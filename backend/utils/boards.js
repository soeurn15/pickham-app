const pool = require('../config/db.js');

async function ownsBoard(userId, boardId) {
  const [rows] = await pool.query('SELECT 1 FROM boards WHERE id = ? AND user_id = ?', [boardId, userId]);
  return rows.length > 0;
}

module.exports = { ownsBoard };