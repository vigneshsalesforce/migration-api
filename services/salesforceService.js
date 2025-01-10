// src/services/salesforceService.js
const logger = require('../logger/logger');
const fs = require('fs').promises;
const path = require('path');
const { SALESFORCE_API_VERSION } = require('../constants/appConstants');
const { makeApiRequest } = require('../utils/apiHelper');

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 5447 });

const BATCH_SIZE = 5;
const BASE_LOCAL_FILE_PATH = path.join(__dirname, '../../Download');

async function ensureDownloadDirExists() {
    try {
        await fs.access(BASE_LOCAL_FILE_PATH);
        logger.info("Download Directory Exist");
    } catch (error) {
        logger.info("Download Directory not exist creating it...");
        await fs.mkdir(BASE_LOCAL_FILE_PATH, { recursive: true });
    }
}

async function startSalesforceMigration(objectName, migrationRecord, req) {
    await ensureDownloadDirExists();
    let fileDetails = [];
    try {
        const { access_token, instance_url } = migrationRecord.salesforceAuth;
        const { _id: migrationId } = migrationRecord;
        const { Migration } = req.models;
        const query = `SELECT Id, Name FROM ${objectName}`;
        const headers = {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const queryUrl = `${instance_url}/services/data/${SALESFORCE_API_VERSION}/query?q=${query}`;
        const queryResponse = await makeApiRequest(queryUrl, 'get', headers, undefined, req);

        if (!queryResponse || !queryResponse.records) {
            logger.error('No records found from salesforce query')
            throw new Error("No records found from salesforce query");
        }
        const recordIds = queryResponse.records.map(record => record.Id);

         fileDetails = await fetchFileDetails(recordIds, access_token, instance_url, objectName, req);

        logger.info(`File Ids fetched for migration id: ${migrationId} . Total files: ${fileDetails.length}`);
        await Migration.findByIdAndUpdate(migrationId, { totalFiles: fileDetails.length });

        // Fetch Files and Process (Batch Processing)
        await processFiles(fileDetails, access_token, instance_url, migrationId, objectName, req);

         const migration = await Migration.findById(migrationId);
        let migrationStatus = 'completed';
          if (migration && migration.migratedFiles !== migration.totalFiles) {
            migrationStatus = 'partial success'
        }

        logger.info(`All files processed for migration id: ${migrationId}`);
        await Migration.findByIdAndUpdate(migrationId, { status: migrationStatus, endTime: new Date(),  totalFiles: fileDetails.length });
        // Send completion message via WebSocket
         wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'complete', migrationId }));
        }
      });
    } catch (error) {
        logger.error(`Salesforce migration failed for object ${objectName}`, error);
        const { Migration } = req.models;
        await Migration.findByIdAndUpdate(migrationRecord._id, { status: 'failed', endTime: new Date() });
        // Send error message via WebSocket
         wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'error', migrationId , message: error.message }));
        }
      });
        throw error;
    }
}


async function fetchFileDetails(recordIds, access_token, instance_url, objectName, req) {
    try {
        let fileDetails = [];
      if (recordIds && recordIds.length > 0) {
        const headers = { 'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
           let allRecordIds = [...recordIds];

          const relatedObjectQueries = await fetchRelatedObjectRecords(recordIds, access_token, instance_url, objectName, req);

            if (relatedObjectQueries) {
                for (const records of relatedObjectQueries) {
                  allRecordIds.push(...records);
                }
           }
            let soqlQuery = `SELECT Id, LinkedEntityId, ContentDocumentId from ContentDocumentLink where LinkedEntityId IN ('${allRecordIds.join("','")}')`;
             const queryUrl = `${instance_url}/services/data/${SALESFORCE_API_VERSION}/query?q=${soqlQuery}`;
            const queryResponse = await makeApiRequest(queryUrl, 'get', headers, undefined, req);
           if (queryResponse && queryResponse.records && queryResponse.records.length > 0) {
             for (const record of queryResponse.records) {
                 const fileDetail = await fetchFileContent(record.ContentDocumentId, access_token, instance_url, req)
                   fileDetails.push({
                       ...fileDetail,
                     linkedEntityId : record.LinkedEntityId,
                        objectName
                   })
                }
             } else {
                  logger.info("No content document link found.");
             }

        } else {
             logger.info(`No record ids available to fetch files for object ${objectName}`)
         }
        return fileDetails;
   } catch (error) {
         logger.error('Error fetching File Ids', error);
         throw error
    }
}
async function fetchRelatedObjectRecords(recordIds, access_token, instance_url, objectName, req) {
    try {
        const headers = { 'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
          const relatedObjects = ['Contact', 'Case', 'Opportunity']; // Add related objects as needed
          const relatedObjectRecordIds = []
          for (const relatedObject of relatedObjects) {
                const soqlQuery = `SELECT Id from ${relatedObject} where AccountId IN ('${recordIds.join("','")}')`;
                const queryUrl = `${instance_url}/services/data/${SALESFORCE_API_VERSION}/query?q=${soqlQuery}`;
                const queryResponse = await makeApiRequest(queryUrl, 'get', headers, undefined, req);
              if(queryResponse && queryResponse.records && queryResponse.records.length > 0) {
                  relatedObjectRecordIds.push(queryResponse.records.map((record)=> record.Id));
               }
          }

       return relatedObjectRecordIds;

    } catch (error) {
         logger.error('Error fetching related object records', error);
        throw error
    }
}


async function processFiles(fileDetails, access_token, instance_url, migrationId, objectName, req) {
    const batches = [];
    for (let i = 0; i < fileDetails.length; i += BATCH_SIZE) {
        batches.push(fileDetails.slice(i, i + BATCH_SIZE));
    }
    let processedFiles = 0;
    for (const batch of batches) {
        await processFileBatch(batch, access_token, instance_url, migrationId, objectName, req);
        processedFiles += batch.length;
        const progress = (processedFiles / fileDetails.length) * 100;
         const { Migration } = req.models;
          await Migration.findByIdAndUpdate(migrationId, { progress });
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'progress',
                progress,
                totalFiles: fileDetails.length,
                processedFiles,
                 migrationId
              }));
            }
        });
    }
}

async function processFileBatch(fileDetails, access_token, instance_url, migrationId, objectName, req) {
    try {
      const { File } = req.models;
      const batchPromises = fileDetails.map(async (fileDetail) => {
            try {
                const fileData = await fetchFileContent(fileDetail.fileId, access_token, instance_url, req);
              const file = await File.create({
                  migration: migrationId,
                  name: fileDetail.title,
                   size: fileData.fileData ? fileData.fileData.length : 0,
                    linkedEntityId: fileDetail.linkedEntityId
                });
                await saveFileLocally(fileData, fileDetail, access_token, instance_url, migrationId, objectName, req);
                  await File.findByIdAndUpdate(file._id, { status: 'completed' });
                 await updateMigratedFileCount(migrationId, req);
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'fileProgress',
                            fileName: fileDetail.title,
                             fileId: file._id,
                            fileSize: fileData.fileData ? fileData.fileData.length : 0,
                             status: 'completed',
                            migrationId
                        }));
                    }
                });
                logger.info(`File fetched and saved locally with id : ${fileDetail.fileId} for migration id ${migrationId}`)
            } catch (error) {
                 logger.error(`Error processing file with id: ${fileDetail.fileId}, migration id: ${migrationId}: ${error.message}`);
                 const file = await File.create({
                     migration: migrationId,
                     name: fileDetail.title,
                      linkedEntityId: fileDetail.linkedEntityId,
                     status: 'failed',
                    error: error.message
                  });

                 wss.clients.forEach((client) => {
                     if (client.readyState === WebSocket.OPEN) {
                         client.send(JSON.stringify({
                             type: 'fileProgress',
                             fileName: fileDetail.title,
                             fileId: file._id,
                             fileSize: 0,
                              status: 'failed',
                             migrationId,
                              error: error.message
                         }));
                     }
                 });
            }
       });
        await Promise.allSettled(batchPromises);
        logger.info(`Files from batch processed for migration id: ${migrationId}`)
    } catch (error) {
        logger.error(`Error processing file batch: ${error.message}`);
        throw error;
   }
}

async function fetchFileContent(fileId, access_token, instance_url, req) {
    try {
        const headers = { 'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
        const contentUrl = `${instance_url}/services/data/${SALESFORCE_API_VERSION}/sobjects/ContentVersion/`

        const soqlQuery = `SELECT VersionData, FileExtension, ContentDocumentId, Title, Id from ContentVersion where ContentDocumentId = '${fileId}'`;
         const queryUrl = `${instance_url}/services/data/${SALESFORCE_API_VERSION}/query?q=${soqlQuery}`;
        const queryResponse = await makeApiRequest(queryUrl, 'get', headers, undefined, req);
        if (queryResponse && queryResponse.records && queryResponse.records.length > 0) {
            const contentVersion = queryResponse.records[0];
              const versionDataUrl = `${contentUrl}${contentVersion.Id}/VersionData`;
               const response = await makeApiRequest(versionDataUrl, 'get', headers, undefined, req, 'arraybuffer');
           return {
                fileData: response,
                 fileExtension: contentVersion.FileExtension,
               fileId,
                title: contentVersion.Title
            }
        } else {
            logger.error(`Unable to fetch file data for ${fileId}`);
           throw new Error(`Unable to fetch file data for ${fileId}`);
       }

   } catch (error) {
         logger.error(`Error fetching file content: ${fileId}`, error)
      throw error
    }
}


async function saveFileLocally(fileData, fileDetail, access_token, instance_url, migrationId, objectName, req) {
    try {
        const baseDir = path.join(BASE_LOCAL_FILE_PATH, `${migrationId}`);
        let objectDir = path.join(baseDir, objectName);

        const { fileExtension, fileData: data, title } = fileData;
        let linkedObjectName = null;
        let linkedEntityId = fileDetail.linkedEntityId;
        if (fileDetail.linkedEntityId) {
             linkedObjectName = await getObjectName(fileDetail.linkedEntityId, access_token, instance_url, req);
       }

       if (linkedObjectName === 'Contact') {
           objectDir = path.join(baseDir, objectName, 'contact_files', linkedEntityId);
       } else if (linkedObjectName === 'Case') {
           objectDir = path.join(baseDir, objectName, 'case_files', linkedEntityId);
        }  else if (linkedObjectName === 'Opportunity') {
          objectDir = path.join(baseDir, objectName, 'opportunity_files', linkedEntityId);
        }  else if(linkedEntityId) {
             objectDir = path.join(baseDir, objectName, 'Account_files',linkedEntityId)
        } else {
              objectDir = path.join(baseDir, objectName, `${objectName.toLowerCase()}_files`);
        }


        // Ensure base directory exists
        await fs.mkdir(baseDir, { recursive: true });
       // Ensure object directory exists
        await fs.mkdir(objectDir, { recursive: true });

          const fileName = `${title}.${fileExtension}`;
          const filePath = path.join(objectDir, fileName);
         const buffer = Buffer.from(data);
         await fs.writeFile(filePath, buffer);
         logger.info(`File saved locally at ${filePath}`);
   } catch (error) {
        logger.error(`Error saving file locally: ${error.message}`);
      throw error
    }
}

async function getObjectName(linkedEntityId, access_token, instance_url, req) {
    try {
        const headers = { 'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
        const soqlQuery = `SELECT Id, LinkedEntity.Type from ContentDocumentLink where LinkedEntityId = '${linkedEntityId}'`;
       const queryUrl = `${instance_url}/services/data/${SALESFORCE_API_VERSION}/query?q=${soqlQuery}`;
        const queryResponse = await makeApiRequest(queryUrl, 'get', headers, undefined, req);
        if (queryResponse && queryResponse.records && queryResponse.records.length > 0) {
            const contentDocument = queryResponse.records[0];
            return contentDocument.LinkedEntity.Type
       }
        return 'default'
   } catch (error) {
         logger.error(`Error getting linked object Name: ${error.message}`)
       throw error
    }
}


async function updateMigratedFileCount(migrationId, req) {
    try {
        const { Migration } = req.models;
       await Migration.findByIdAndUpdate(migrationId, { $inc: { migratedFiles: 1 } });
    } catch (error) {
         logger.error(`Error updating file count for migration id ${migrationId}: ${error.message}`)
       throw error;
   }
}

module.exports = {
   startSalesforceMigration,
};