// src/controllers/dashboardController.js
const logger = require('../logger/logger');

const getDashboardData = async (req, res) => {
    const { Migration, File } = req.models;
    try {
        const totalMigrations = await Migration.countDocuments({});
        const completedMigrations = await Migration.countDocuments({ status: 'completed' });
        const totalFiles = await Migration.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalFiles' },
                },
            },
        ]);

        const completedFiles = await Migration.aggregate([
          {
              $group: {
                  _id: null,
                migratedFiles: { $sum: '$migratedFiles' },
               }
          }
         ])

        const recentMigrations = await Migration.find({})
            .sort({ createdAt: -1 })
            .limit(5)
          .lean();



        const metrics = {
            totalFiles: totalFiles[0]?.total || 0,
            completedFiles: completedFiles[0]?.migratedFiles || 0,
            estimatedTime: 'N/A',
            successRate: (completedMigrations / totalMigrations) * 100 || 0,
        };
        res.status(200).send({ metrics, recentMigrations });
    } catch (error) {
        logger.error('Error fetching dashboard data', error);
        res.status(500).send({ error: 'Failed to fetch dashboard data', message: error.message });
    }
};

module.exports = {
    getDashboardData,
};