// src/services/sharepointService.js
const logger = require('../logger/logger');
const { makeApiRequest } = require('../utils/apiHelper');
const {
    SHAREPOINT_CLIENT_ID,
    SHAREPOINT_CLIENT_SECRET,
    SHAREPOINT_REDIRECT_URI,
    SHAREPOINT_TENANT_ID
} = require('../constants/envConstants');

const { getRefreshToken } = require('../config/oauth');


async function saveFileToSharePoint(fileData, fileDetail, access_token, instance_url, migrationId, objectName, linkedObjectName) {
    try {
        const { fileData: data, title, fileExtension } = fileData;
        const fileName = `${title}.${fileExtension}`;
        const sharepointApiUrl = `${instance_url}/drives/root/items/`;
        const headers = {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/octet-stream', // Use correct content type for binary data
        };
        let sharepointFolderPath = `${objectName}`;
        if (linkedObjectName) {
            sharepointFolderPath = `${objectName}/${linkedObjectName.toLowerCase()}`;
        }
        const uploadUrl = `${sharepointApiUrl}:/${sharepointFolderPath}/${fileName}:/content?@name.conflict=rename`; //rename if file exist
        logger.info(`Uploading file ${fileName} to sharepoint with path : ${sharepointFolderPath}`)
        await makeApiRequest(uploadUrl, 'put', headers, data, undefined, 'arraybuffer')
        logger.info(`Uploaded file ${fileName} to sharepoint with path : ${sharepointFolderPath}`)
    } catch (error) {
        logger.error(`Error saving file to sharepoint: ${error.message}`, error);
        throw error;
    }
}


async function getSharePointAccessToken(req) {
   const { Source } = req.models;
    try {
        const sharepointSource = await Source.findOne({ type: 'sharepoint', active: true }).lean();
        if(sharepointSource && sharepointSource.refresh_token) {
            const response = await getRefreshToken('sharepoint', sharepointSource.refresh_token);
           if (response && response.access_token) {
             await Source.findOneAndUpdate({type: 'sharepoint', active: true}, {access_token: response.access_token })
             return response.access_token
          }
        }
        const tokenEndpoint = `https://login.microsoftonline.com/${SHAREPOINT_TENANT_ID}/oauth2/v2.0/token`;

        const params = new URLSearchParams({
            client_id: SHAREPOINT_CLIENT_ID,
            scope: 'https://graph.microsoft.com/.default',
            client_secret: SHAREPOINT_CLIENT_SECRET,
            grant_type: 'client_credentials',
        });

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        }

        const response = await makeApiRequest(tokenEndpoint, 'post', headers, params.toString());

        if (response && response.access_token) {
           await Source.findOneAndUpdate({type: 'sharepoint', active: true}, {access_token: response.access_token, refresh_token: response.refresh_token })
            return response.access_token
        } else {
          logger.error("Failed to retrieve SharePoint access token.", response);
            throw new Error('Failed to retrieve SharePoint access token.');
        }
    } catch (error) {
        logger.error('Error fetching SharePoint access token', error);
        throw error;
    }
}


module.exports = {
    saveFileToSharePoint,
    getSharePointAccessToken
};