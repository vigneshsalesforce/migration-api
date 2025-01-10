const mongoose = require('mongoose');

const migrationSchema = new mongoose.Schema({
    salesforceObject: {
        type: String,
        required: true,
    },
    relatedObjects: [{
        type: String,
    }],
    source: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Source',
        required: true,
    },
    destination: {
       type: mongoose.Schema.Types.ObjectId,
          ref: 'Source',
        required: true,
    },
    startTime: {
        type: Date,
    },
    endTime: {
        type: Date,
    },
    totalFiles: {
        type: Number,
        default: 0,
    },
    migratedFiles: {
        type: Number,
        default: 0,
    },
   progress: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['inProgress', 'completed', 'failed', 'paused', 'cancelled', 'partial success'],
        default: 'inProgress',
    },
}, { timestamps: true });

const Migration = mongoose.model('Migration', migrationSchema);

module.exports = Migration;