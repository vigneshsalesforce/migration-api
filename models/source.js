
const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['salesforce', 'sharepoint'],
    required: true
  },
  access_token: String,
  refresh_token: String,
  instance_url: String,
  response: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

const Source = mongoose.model('Source', sourceSchema);

module.exports = Source;