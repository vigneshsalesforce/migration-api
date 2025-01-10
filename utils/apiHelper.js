// src/utils/apiHelper.js
const axios = require('axios');
const logger = require('../logger/logger');
const { API_BASE_URL_SALESFORCE } = require('../constants/appConstants');
const { salesforceConfig, getToken, getRefreshToken } = require('../config/oauth');

async function makeApiRequest(url, method, headers, data, req, responseType = 'json') {
    const config = {
        method: method,
        url: url,
        headers: headers,
        responseType: responseType
    }
    if (data) {
        config.data = data;
    }
    try {
        const response = await axios(config);
        logger.info(`API request successful for ${url} with response code ${response.status}`);
        return response.data;
    } catch (error) {
        logger.error(`API request failed for ${url}: ${error.message}`);
       if(error.response && error.response.status === 401 && url.includes(API_BASE_URL_SALESFORCE)) {
           logger.info("Session expired or invalid. Refreshing the salesforce token.")
            const authDetails = await refreshSalesforceToken(req);
           if (authDetails && authDetails.access_token) {
                logger.info("Successfully refreshed salesforce token. Retrying API request.")
               config.headers['Authorization'] = `Bearer ${authDetails.access_token}`;
               config.headers['Content-Type'] = 'application/json';
                config.headers['Accept'] = 'application/json';
                 const response = await axios(config);
                 logger.info(`API request successful after refresh token for ${url} with response code ${response.status}`);
                 return response.data;
           }
       }
        throw error;
    }
}

async function refreshSalesforceToken(req) {
    try {
        const { Source } = req.models;
      const salesforceAuth = await Source.findOne({ type: 'salesforce' }).sort({updatedAt: -1}).lean();
      if(!salesforceAuth || !salesforceAuth.refresh_token) {
          logger.error("Unable to retrieve salesforce auth details or refresh token");
           return null;
      }
       const response = await getRefreshToken("salesforce",salesforceAuth.refresh_token);

         if(response && response.access_token && response.refresh_token) {
              await Source.findByIdAndUpdate(salesforceAuth._id, {
                  access_token: response.access_token,
                  refresh_token: response.refresh_token
              });
             logger.info("Successfully refreshed salesforce access token and saved to database.");
              return {
                access_token: response.access_token
              }
         } else {
             logger.error("Unable to fetch salesforce access token using refresh token.");
              return null;
          }
    } catch (error) {
         logger.error("Unable to refresh salesforce access token.", error)
         throw error
    }
}
module.exports = {
    makeApiRequest
};