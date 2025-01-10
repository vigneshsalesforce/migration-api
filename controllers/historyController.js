const logger = require('../logger/logger');

const getMigrationsHistory = async (req, res) => {
    const { Migration, File } = req.models;
    try {
        const migrations = await Migration.find({ status: { $in: ['completed', 'partial success', 'failed', 'cancelled'] } })
            .sort({ createdAt: -1 })
            .populate('source destination', 'name type')
            .lean();
        const migrationWithFiles = await Promise.all(
            migrations.map(async (migration) => {
                 const files = await File.find({ migration: migration._id }).lean();
                 return { ...migration, files };
            })
        );
        res.status(200).send(migrationWithFiles);
    } catch (error) {
        logger.error('Error fetching migration history', error);
        res.status(500).send({ error: 'Failed to fetch migration history', message: error.message });
    }
};


module.exports = {
    getMigrationsHistory,
};