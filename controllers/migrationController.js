// src/controllers/migrationController.js
const { getSalesforceAuthDetails, getSharepointAuthDetails } = require('../services/migrationService');
const { startSalesforceMigration } = require('../services/salesforceService');
const logger = require('../logger/logger');

const getActiveMigrations = async (req, res) => {
  const { Migration } = req.models;
  try {
      const migrations = await Migration.find({ status: { $in: ['inProgress', 'paused'] } })
        .populate('source destination', 'name type')
          .sort({ createdAt: -1 })
           .lean();
        res.status(200).send(migrations);
  } catch (error) {
      logger.error('Error fetching active migrations', error);
      res.status(500).send({ error: 'Failed to fetch active migrations', message: error.message });
  }
};

const startMigration = async (req, res) => {
    const { selectedObject } = req.body;
    const objectName = selectedObject;
    if (!objectName) {
        return res.status(400).send({ error: 'Salesforce object name is required.' })
    }
    // Access Migration model from req.models
    const { Migration, Source } = req.models;
    try {
        // Step 1: Retrieve Salesforce & SharePoint tokens from MongoDB
        const salesforceAuth = await getSalesforceAuthDetails(req);
        const sharepointAuth = await getSharepointAuthDetails(req);

        if (!salesforceAuth || !sharepointAuth) {
            return res.status(400).send({ error: 'Salesforce or Sharepoint credentials not available' })
        }
       const salesforceSource = await Source.findById(salesforceAuth._id);
         const sharepointSource = await Source.findById(sharepointAuth._id);
        // Step 2: Create Migration record in MongoDB
        const newMigration = await  Migration.create({
          salesforceObject: objectName,
          relatedObjects: ['Contact', 'Case'], // Hardcoded related objects
          source: salesforceSource._id,
          destination : sharepointSource._id,
          status: 'inProgress',
          startTime: new Date(),
        });
       logger.info(`Migration Record created with id ${newMigration._id}`);

       // Step 3: Start the salesforce migration process and fetch the files
        startSalesforceMigration(objectName, { ...newMigration.toObject(), salesforceAuth, sharepointAuth }, req);
        logger.info(`Salesforce migration started for object: ${objectName}, migration id: ${newMigration._id}`)
       res.status(202).send({ message: 'Migration started successfully.', migrationId: newMigration._id });
    } catch (error) {
     logger.error('Error starting migration', error);
       res.status(500).send({ error: 'Failed to start migration' , message: error.message });
   }
};

module.exports = {
  startMigration,
  getActiveMigrations,
};