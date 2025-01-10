const express = require('express');
const router = express.Router();

const {salesforceLogin, sharepointLogin, fetchToken} = require('./../controllers/auth')

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Salesforce Sharepoint Migration API' });
})

router.get('/salesforce', salesforceLogin);
router.post('/token', fetchToken);

router.get('/sharepoint', sharepointLogin);
module.exports = router;