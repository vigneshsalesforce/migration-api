const axios = require('axios');
const {
    SALESFORCE_CLIENT_ID,
    SALESFORCE_CLIENT_SECRET,
    SALESFORCE_REDIRECT_URI,
    SHAREPOINT_CLIENT_ID,
    SHAREPOINT_CLIENT_SECRET,
    SHAREPOINT_REDIRECT_URI,
    SHAREPOINT_TENANT_ID
  } = require('../constants/envConstants');
  const { API_BASE_URL_SALESFORCE, API_BASE_URL_SHAREPOINT } = require('../constants/appConstants');
  const logger = require('../logger/logger');
  
  const salesforceConfig = {
    clientId: SALESFORCE_CLIENT_ID,
    clientSecret: SALESFORCE_CLIENT_SECRET,
    redirectUri: SALESFORCE_REDIRECT_URI,
    authorizeUrl: `${API_BASE_URL_SALESFORCE}/services/oauth2/authorize`,
    tokenUrl: `${API_BASE_URL_SALESFORCE}/services/oauth2/token`
  };
  
  
  const sharepointConfig = {
    clientId: SHAREPOINT_CLIENT_ID,
    clientSecret: SHAREPOINT_CLIENT_SECRET,
    redirectUri: SHAREPOINT_REDIRECT_URI,
    tenantId: SHAREPOINT_TENANT_ID,
    authorizeUrl: `https://login.microsoftonline.com/${SHAREPOINT_TENANT_ID}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${SHAREPOINT_TENANT_ID}/oauth2/v2.0/token`
  };
  
  function generateAuthURL(provider) {
    let authUrl = null;
      if (provider === 'salesforce') {
          const { authorizeUrl, clientId, redirectUri } = salesforceConfig;
        authUrl = `${authorizeUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
      } else if (provider === 'sharepoint') {
          const { authorizeUrl, clientId, redirectUri } = sharepointConfig;
        authUrl = `${authorizeUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=offline_access%20Files.ReadWrite.All`;
      }
      if(authUrl) {
          logger.info(`Generated auth URL for ${provider}: ${authUrl}`);
          return authUrl;
      } else {
          logger.error(`Unable to generate auth URL for ${provider}`)
          throw new Error(`Unable to generate auth URL for ${provider}`)
      }
  
  }
  
  async function getToken(provider, code) {
      let tokenUrl = null;
      let clientSecret = null;
      let clientId = null;
      let redirectUri = null;
      if (provider === 'salesforce') {
          tokenUrl = salesforceConfig.tokenUrl;
          clientSecret = salesforceConfig.clientSecret;
          clientId = salesforceConfig.clientId;
          redirectUri = salesforceConfig.redirectUri;
      } else if (provider === 'sharepoint') {
          tokenUrl = sharepointConfig.tokenUrl;
          clientSecret = sharepointConfig.clientSecret;
          clientId = sharepointConfig.clientId;
          redirectUri = sharepointConfig.redirectUri;
      }
      const params = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      };
      try {
        const formData = new URLSearchParams(params);
        const response = await axios.post(tokenUrl, formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        logger.info(`Token fetched successfully for ${provider} and data is: ${JSON.stringify(response.data)}`);
        return response.data;
      } catch (error) {
          logger.error(`Failed to fetch token for ${provider}: ${error.message}`);
        throw new Error(`Failed to fetch token for ${provider}`)
      }
  }

  async function getRefreshToken(provider, refreshToken) {
    let tokenUrl = null;
    let clientSecret = null;
    let clientId = null;
    if (provider === 'salesforce') {
        tokenUrl = salesforceConfig.tokenUrl;
        clientSecret = salesforceConfig.clientSecret;
        clientId = salesforceConfig.clientId;
    } else if (provider === 'sharepoint') {
        tokenUrl = sharepointConfig.tokenUrl;
        clientSecret = sharepointConfig.clientSecret;
        clientId = sharepointConfig.clientId;
    }
    const params = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    };
    try {
      const formData = new URLSearchParams(params);
      const response = await axios.post(tokenUrl, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      logger.info(`Refresh Token fetched successfully for ${provider} and data is: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
        logger.error(`Failed to fetch refresh token for ${provider}: ${error.message}`);
      throw new Error(`Failed to fetch refresh token for ${provider}`)
    }
  }

  async function fetchSharepointSiteUrl (accessToken) {
    try {
         const response = await axios.get(`https://graph.microsoft.com/v1.0/sites?search=*`, {
          headers: {
               'Authorization': `Bearer ${accessToken}`,
             },
          });
          logger.info('response', response.data);
         if (response.data && response.data.value && response.data.value.length > 0) {
               const siteUrl = response.data.value[0].webUrl;
              return siteUrl;
          } else {
              throw new Error('No SharePoint site found')
        }

    } catch (error) {
      logger.error('Error fetching SharePoint site url', error);
     throw new Error('Error fetching SharePoint site url:' + error.message);
    }
 }
  
  module.exports = {
      salesforceConfig,
      sharepointConfig,
      generateAuthURL,
      getToken,
      getRefreshToken,
      fetchSharepointSiteUrl,
  };