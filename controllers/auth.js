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
            migration = await Source.create({ name: provider,type: provider, ...token, active: true });
        } else {
            Object.assign(migration, token);
            migration.active = true;
            await migration.save();
        }
        res.status(200).send({ success: true });
    } catch (error) {
        logger.error("Fetch Token Error", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
}

const reauthenticateSource = async (req, res) => {
    const { sourceId } = req.params;
   const { Source } = req.models;
   try {
      const source = await Source.findByIdAndUpdate(sourceId, { reauthenticate: true }, { new: true });
       if (!source) {
           return res.status(404).send({ message: 'Source not found' })
      }
       res.status(200).send({ message: 'Source set to reauthenticate.', source , success: true});
   } catch (error) {
       logger.error('Error reauthenticating source', error);
        res.status(500).send({ message: 'Error reauthenticating source.', error: error.message })
  }
};

const getAllSources = async (req, res) => {
   const { Source } = req.models;
   try {
       const sources = await Source.find({}).lean();
        res.status(200).send({sources});
   } catch (error) {
       logger.error('Error fetching sources', error);
       res.status(500).send({ message: 'Error fetching sources', error: error.message });
   }
}
const disconnectSource = async (req, res) => {
    const { sourceId } = req.params;
     const { Source } = req.models;
   try {
       const source = await Source.findByIdAndUpdate(sourceId, { active: false }, { new: true });
        if (!source) {
           return res.status(404).send({ message: 'Source not found' })
       }
       res.status(200).send({ message: 'Source disconnected successfully', source, success: true });
   } catch (error) {
        logger.error('Error disconnecting source', error);
      res.status(500).send({ message: 'Error disconnecting source.', error: error.message });
  }
};

module.exports = {
    salesforceLogin,
    sharepointLogin,
    fetchToken,
    reauthenticateSource,
    getAllSources,
    disconnectSource,
}