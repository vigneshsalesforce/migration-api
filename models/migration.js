const mongoose = require('mongoose');

const migrationSchema = new mongoose.Schema({
  salesforceObject: {
    type: String,
    required: true,
  },
  salesforceObjectName: {
    type: String,
    required: true
  },
  totalFiles: {
    type: Number,
    default: 0
  },
  migratedFiles: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'inProgress', 'completed', 'failed'],
    default: 'pending',
  },
  startTime: {
      type: Date
  },
  endTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  salesforceAuth:{
      type: Object
  },
    sharepointAuth: {
        type: Object
    }
});

// Add a pre-save hook to update the updatedAt field
migrationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Migration = mongoose.model('Migration', migrationSchema);

module.exports = Migration;