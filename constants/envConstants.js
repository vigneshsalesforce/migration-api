const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

const SALESFORCE_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID || '3MVG9GCMQoQ6rpzTwrb74bpn5elzVF2StwX.CaXdDC4VJk.P.LDPc1gJyqXs7VDofzJUa55igYiSYzkAqJeyq';
const SALESFORCE_CLIENT_SECRET = process.env.SALESFORCE_CLIENT_SECRET || 'FD23D51FAD675B7A2250061B116BFAED357FBE941F4E6FE6351C105E0FE37409';
const SALESFORCE_REDIRECT_URI = process.env.SALESFORCE_REDIRECT_URI || 'http://localhost:3000/redirect/salesforce';

const SHAREPOINT_CLIENT_ID = process.env.SHAREPOINT_CLIENT_ID || '18672ef9-44e9-4e9b-9812-2c024cf47517';
const SHAREPOINT_CLIENT_SECRET = process.env.SHAREPOINT_CLIENT_SECRET || 'TDo8Q~EvEDeYSUhlmOd9yRsw6tRwQigaKI96ycaj';
const SHAREPOINT_REDIRECT_URI = process.env.SHAREPOINT_REDIRECT_URI || 'http://localhost:3000/redirect/sharepoint';
const SHAREPOINT_TENANT_ID = process.env.SHAREPOINT_TENANT_ID || 'f1bf6bf8-6353-4fda-b1a5-640dc4efaa32';


module.exports = {
  PORT,
  MONGODB_URI,
  SALESFORCE_CLIENT_ID,
  SALESFORCE_CLIENT_SECRET,
  SALESFORCE_REDIRECT_URI,
  SHAREPOINT_CLIENT_ID,
  SHAREPOINT_CLIENT_SECRET,
  SHAREPOINT_REDIRECT_URI,
  SHAREPOINT_TENANT_ID
};