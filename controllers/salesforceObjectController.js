// src/controllers/salesforceObjectController.js
const logger = require('../logger/logger');
const { makeApiRequest } = require('../utils/apiHelper');
const { SALESFORCE_API_VERSION } = require('../constants/appConstants');


const getSalesforceObjects = async (req, res) => {
    try {
        const { Source } = req.models;
        const salesforceAuth = await Source.findOne({ type: 'salesforce', active: true }).lean();
        if (!salesforceAuth) {
             logger.error("No salesforce credentials found");
             return res.status(400).send({ error: 'No salesforce credentials found' })
        }

        const { access_token, instance_url } = salesforceAuth;
         const headers = {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
         };

        const query = `SELECT QualifiedApiName, Label FROM EntityDefinition ORDER BY Label`;
        const queryUrl = `${instance_url}/services/data/${SALESFORCE_API_VERSION}/query?q=${query}`;
        const queryResponse = await makeApiRequest(queryUrl, 'get', headers, undefined, req);

        if(!queryResponse || !queryResponse.records || queryResponse.records.length === 0) {
            logger.error("No objects found from salesforce");
             return res.status(404).send({ error: "No objects found from salesforce" });
       }
         const objects = queryResponse.records.map((record) => ({
             name: record.Label,
            value : record.QualifiedApiName
        }));

        res.status(200).send({objects});
    } catch (error) {
        logger.error('Error fetching salesforce objects', error);
        res.status(500).send({ error: 'Failed to fetch salesforce objects', message: error.message });
    }
};

const getRelatedObjects = async (req, res) => {
    const { selectedObject } = req.body
    if(!selectedObject) {
        return res.status(400).send({ error: 'Salesforce object name is required.' })
    }
     try {
          const { Source } = req.models;
          const salesforceAuth = await Source.findOne({ type: 'salesforce', active: true }).lean();
            if (!salesforceAuth) {
                 logger.error("No salesforce credentials found");
                 return res.status(400).send({ error: 'No salesforce credentials found' })
            }
          const { access_token, instance_url } = salesforceAuth;
            const headers = {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
         };
            const describeUrl = `${instance_url}/services/data/${SALESFORCE_API_VERSION}/sobjects/${selectedObject}/describe`;

            const describeResponse = await makeApiRequest(describeUrl, 'get', headers, undefined, req);

            if (!describeResponse || !describeResponse.childRelationships) {
                logger.error('No related objects found from salesforce describe api.');
                return res.status(404).send({ error: 'No related objects found from salesforce.' });
            }

            const relatedObjects = describeResponse.childRelationships
            .filter((relationship) => relationship.relationshipName !== null)
            .map(relationship => ({
                name: relationship.relationshipName,
                value: relationship.childSObject
            }));
       
        res.status(200).send({ relatedObjects });
    } catch (error) {
        logger.error('Error fetching related objects', error);
        res.status(500).send({ error: 'Failed to fetch related objects', message: error.message });
    }
}

module.exports = {
    getSalesforceObjects,
   getRelatedObjects
};