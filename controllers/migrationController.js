const { getSalesforceAuthDetails, getSharepointAuthDetails } = require('../services/migrationService');
const { startSalesforceMigration } = require('../services/salesforceService');
const logger = require('../logger/logger');

const startMigration = async (req, res) => {
    const { selectedObject } = req.body;
    console.log(req.body);
    console.log(selectedObject);
    const objectName = selectedObject;
    if (!objectName) {
        return res.status(400).send({ error: 'Salesforce object name is required.' })
    }
    // Access Migration model from req.models
    const { Migration } = req.models;
  try {
        // Step 1: Retrieve Salesforce & SharePoint tokens from MongoDB
       const salesforceAuth = await getSalesforceAuthDetails(req);
        const sharepointAuth = await getSharepointAuthDetails(req);

        if (!salesforceAuth || !sharepointAuth) {
          return res.status(400).send({ error: 'Salesforce or Sharepoint credentials not available' })
        }

        // Step 2: Create Migration record in MongoDB
        const newMigration = await  Migration.create({
          salesforceObject: objectName,
          salesforceObjectName: objectName,
          salesforceAuth,
           sharepointAuth,
          status: 'inProgress',
          startTime: new Date(),
        });
       logger.info(`Migration Record created with id ${newMigration._id}`);

       // Step 3: Start the salesforce migration process and fetch the files
        await startSalesforceMigration(objectName, newMigration, req);
        logger.info(`Salesforce migration started for object: ${objectName}, migration id: ${newMigration._id}`)
       res.status(202).send({ message: 'Migration started successfully.' });
    } catch (error) {
     logger.error('Error starting migration', error);
       res.status(500).send({ error: 'Failed to start migration' });
   }
};

module.exports = {
  startMigration,
};