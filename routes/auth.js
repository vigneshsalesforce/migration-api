const express = require('express');
const router = express.Router();

const {salesforceLogin, sharepointLogin, fetchToken, reauthenticateSource, getAllSources, disconnectSource} = require('./../controllers/auth')

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Salesforce Sharepoint Migration API' });
})

router.get('/salesforce', salesforceLogin);
router.post('/token', fetchToken);

router.get('/sharepoint', sharepointLogin);
router.post('/reauthenticate/:sourceId', reauthenticateSource);
router.post('/disconnect/:sourceId', disconnectSource);
router.get('/sources', getAllSources)
module.exports = router;