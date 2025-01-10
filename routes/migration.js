const express = require('express');
const router = express.Router();

const { startMigration , getActiveMigrations} = require('./../controllers/migrationController')
const { getMigrationsHistory } = require('../controllers/historyController')

router.get('/', getActiveMigrations)
router.post('/start', startMigration);
router.get('/history', getMigrationsHistory);


module.exports = router;