const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['sharepoint', 'salesforce'],
        required: true,
    },
    access_token: {
        type: String,
        required: true,
    },
    refresh_token: {
        type: String,
        required: true,
    },
    instance_url: { // For Salesforce
        type: String,
        required: function() { return this.type === 'salesforce' } //Only required for salesforce
    },
    metadata: { // For storing any additional info
        type: mongoose.Schema.Types.Mixed,
    },
    active: {
        type: Boolean,
        default: true,
    },
    reauthenticate: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });


const Source = mongoose.model('Source', sourceSchema);

module.exports = Source;