const express = require('express');
const router = express.Router();

const { startMigration , getActiveMigrations} = require('./../controllers/migrationController')
const { getMigrationsHistory } = require('../controllers/historyController')
const { getSalesforceObjects, getRelatedObjects } = require('../controllers/salesforceObjectController');

router.get('/', getActiveMigrations)
router.post('/start', startMigration);
router.get('/history', getMigrationsHistory);
router.get('/objects', getSalesforceObjects) // Get salesforce object
router.post('/related-objects', getRelatedObjects) // get related objects


module.exports = router;