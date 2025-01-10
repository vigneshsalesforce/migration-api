// src/config/mongo.js
const mongoose = require('mongoose');
const { MONGODB_URI } = require('../constants/envConstants');
const logger = require('../logger/logger');
const Migration = require('../models/migration');

async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: 'migration'  // Specify the database name
        });

        logger.info('MongoDB connected successfully');

        // Check if the collection exists
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionExists = collections.some(collection => collection.name === 'migrations');

        if(!collectionExists) {
            logger.info("Migrations collection does not exist. Creating it...")
            // Initialize the model to create the collection (and schema if it doesn't exist).
            await Migration.createCollection(); // Creating the collection based on schema

            logger.info("Migrations collection has been created successfully.");
        } else {
          logger.info("Migrations collection already exists.");
        }

    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

module.exports = connectDB;