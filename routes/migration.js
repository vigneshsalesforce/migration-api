const express = require('express');
const router = express.Router();

const { startMigration} = require('./../controllers/migrationController')

router.post('/start', startMigration);


module.exports = router;