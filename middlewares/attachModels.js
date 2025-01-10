const Migration = require('../models/migration');
const Source = require('../models/source');
const logger = require('../logger/logger');

const attachModels = (req, res, next) => {
    const models = {
        Migration,
        Source
    }
    req.models = models;
    next();
}

module.exports = attachModels;