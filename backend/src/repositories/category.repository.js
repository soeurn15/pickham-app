const pool = require('../config/db.js');

const FALLBACK_CATEGORY = 'Other';

// "Other" is always listed last
async function listWithCounts() {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, COUNT(p.id) AS pins_count
     FROM categories c
     LEFT JOIN pins p ON p.category = c.name
     GROUP BY c.id
     ORDER BY c.name = ?, c.name`,
    [FALLBACK_CATEGORY]
  );
  return rows;
}

const names = async () => (await listWithCounts()).map(r => r.name);
const findById = async id => (await pool.query('SELECT id, name FROM categories WHERE id = ?', [id]))[0][0];
const findByName = async name => (await pool.query('SELECT id FROM categories WHERE name = ?', [name]))[0][0];
const create = async name => (await pool.query('INSERT INTO categories (name) VALUES (?)', [name]))[0].insertId;
const movePins = (from, to, conn = pool) => conn.query('UPDATE pins SET category = ? WHERE category = ?', [to, from]);
const remove = (id, conn = pool) => conn.query('DELETE FROM categories WHERE id = ?', [id]);

module.exports = { FALLBACK_CATEGORY, listWithCounts, names, findById, findByName, create, movePins, remove };
