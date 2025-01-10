const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    migration: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Migration',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
    },
     linkedEntityId:{
        type:String
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'skipped'],
        default: 'pending',
    },
    error: {
        type: String, // Store error message if the file failed
    },
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);

module.exports = File;