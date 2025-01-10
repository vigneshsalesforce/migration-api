const logger = require('../logger/logger');

const getSalesforceAuthDetails = async (req) => {
    try {
        const { Source } = req.models;
        const salesforceAuth = await Source.findOne({ type: 'salesforce' }).sort({ updatedAt: -1 }).lean();
        if (!salesforceAuth) {
            logger.error("Unable to retrieve salesforce auth details");
            return null;
        }
        return salesforceAuth
    } catch (error) {
        logger.error('Error fetching salesforce auth details:', error);
        throw new Error("Error fetching salesforce auth details");
    }
};


const getSharepointAuthDetails = async (req) => {
    try {
        const { Source } = req.models;
        const sharepointAuth = await Source.findOne({ type: 'sharepoint' }).sort({ updatedAt: -1 }).lean();
        if (!sharepointAuth) {
            logger.error("Unable to retrieve sharepoint auth details");
            return null
        }
        return sharepointAuth;
    } catch (error) {
        logger.error('Error fetching sharepoint auth details:', error);
        throw new Error("Error fetching sharepoint auth details");
    }
};

module.exports = {
    getSalesforceAuthDetails,
    getSharepointAuthDetails,
};