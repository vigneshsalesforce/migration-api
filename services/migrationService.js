const logger = require('../logger/logger');

const getSalesforceAuthDetails = async (req) => {
    const { Source } = req.models;
    try {
        const salesforceAuth = await Source.findOne({ type: 'salesforce', active: true }).lean();
         if (!salesforceAuth) {
           logger.error("No salesforce credentials found");
             return null
        }
        return salesforceAuth;
    } catch (error) {
         logger.error("Error fetching salesforce credentials", error);
       throw error;
    }

}

const getSharepointAuthDetails = async (req) => {
    const { Source } = req.models;
    try {
        const sharepointAuth = await Source.findOne({ type: 'sharepoint', active: true }).lean();
        if (!sharepointAuth) {
             logger.error("No sharepoint credentials found");
            return null
        }
        return sharepointAuth;
    } catch (error) {
        logger.error("Error fetching sharepoint credentials", error);
         throw error;
    }
}

module.exports = {
    getSalesforceAuthDetails,
    getSharepointAuthDetails
};