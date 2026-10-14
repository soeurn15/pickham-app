const pool = require('../config/db.js');

const FALLBACK_CATEGORY = 'Other';
const MAX_CATEGORY_LENGTH = 50;

async function getCategoryNames() {
  const [rows] = await pool.query('SELECT name FROM categories ORDER BY name = ? , name', [FALLBACK_CATEGORY]);
  return rows.map(r => r.name);
}

module.exports = { getCategoryNames, FALLBACK_CATEGORY, MAX_CATEGORY_LENGTH };
