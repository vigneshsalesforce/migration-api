const { generateAuthURL, getToken } = require('../config/oauth');
const logger = require('../logger/logger');

const salesforceLogin = (req, res) => {
    try {
        const authURL = generateAuthURL('salesforce');
        res.send({ authURL });
    } catch (error) {
        logger.error("Salesforce Login Error", error);
        res.status(500).send({ error: "Internal Server Error" });
    }

};

const sharepointLogin = (req, res) => {
    try {
        const authURL = generateAuthURL('sharepoint');
        res.send({ authURL });
    } catch (error) {
        logger.error("Sharepoint Login Error", error);
        res.status(500).send({ error: "Internal Server Error" });
    }

};

const fetchToken = async (req, res) => {
    try {
        const { provider, code } = req.body;
        const token = await getToken(provider, code);
        const { Source } = req.models;
        let migration = await Source.findOne({ type: provider });

        if (!migration) {
            migration = await Source.create({ type: provider, ...token });
        } else {
            Object.assign(migration, token);
            await migration.save();
        }
        res.status(200).send({ success: true });
    } catch (error) {
        logger.error("Fetch Token Error", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
}

module.exports = {
    salesforceLogin,
    sharepointLogin,
    fetchToken,
}