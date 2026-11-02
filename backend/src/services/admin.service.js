const statsRepo = require('../repositories/stats.repository.js');

const metrics = () => statsRepo.platformMetrics();

module.exports = { metrics };
