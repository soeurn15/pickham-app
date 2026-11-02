const pool = require('../config/db.js');

const count = async table => (await pool.query(`SELECT COUNT(*) AS count FROM ${table}`))[0][0].count;

async function platformMetrics() {
  const [users, pins, boards, comments, likes] = await Promise.all(['users', 'pins', 'boards', 'comments', 'likes'].map(count));
  const [categories] = await pool.query(
    `SELECT COALESCE(category, 'Other') AS category, COUNT(*) AS count
     FROM pins GROUP BY category ORDER BY count DESC`
  );
  return { users, pins, boards, comments, likes, categories };
}

module.exports = { platformMetrics };
