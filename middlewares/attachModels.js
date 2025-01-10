const Migration = require('../models/migration');
const Source = require('../models/source');
const File = require('../models/file');
const logger = require('../logger/logger');

const attachModels = (req, res, next) => {
    const models = {
        Migration,
        Source,
        File,
    }
    req.models = models;
    next();
}

module.exports = attachModels;