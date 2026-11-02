const pool = require('../config/db.js');
const { PIN_FIELDS, PIN_JOINS } = require('./pin.repository.js');

async function listForUser(userId) {
  const [rows] = await pool.query(
    `SELECT b.*, COUNT(bp.pin_id) AS pins_count,
            (SELECT COALESCE(p.thumb_url, p.image_url) FROM board_pins bp2
             JOIN pins p ON bp2.pin_id = p.id
             WHERE bp2.board_id = b.id ORDER BY bp2.created_at DESC LIMIT 1) AS cover_url
     FROM boards b
     LEFT JOIN board_pins bp ON b.id = bp.board_id
     WHERE b.user_id = ?
     GROUP BY b.id
     ORDER BY b.id DESC`,
    [userId]
  );
  return rows;
}

const listPlainForUser = async userId => (await pool.query('SELECT * FROM boards WHERE user_id = ? ORDER BY id DESC', [userId]))[0];
const findById = async id => (await pool.query('SELECT * FROM boards WHERE id = ?', [id]))[0][0];
const isOwnedBy = async (boardId, userId) =>
  (await pool.query('SELECT 1 FROM boards WHERE id = ? AND user_id = ?', [boardId, userId]))[0].length > 0;

async function create({ name, description, userId }) {
  const [result] = await pool.query('INSERT INTO boards (name, description, user_id) VALUES (?, ?, ?)', [name, description, userId]);
  return result.insertId;
}

async function listPins(viewerId, boardId) {
  const [rows] = await pool.query(
    `SELECT ${PIN_FIELDS}
     FROM board_pins bp JOIN pins p ON bp.pin_id = p.id ${PIN_JOINS}
     WHERE bp.board_id = ?
     GROUP BY p.id, bp.created_at
     ORDER BY bp.created_at DESC`,
    [viewerId, viewerId, boardId]
  );
  return rows;
}

// Returns true when the pin was newly added.
async function addPin(boardId, pinId, conn = pool) {
  const [result] = await conn.query('INSERT IGNORE INTO board_pins (board_id, pin_id) VALUES (?, ?)', [boardId, pinId]);
  return result.affectedRows > 0;
}

const removePin = (boardId, pinId) => pool.query('DELETE FROM board_pins WHERE board_id = ? AND pin_id = ?', [boardId, pinId]);

module.exports = { listForUser, listPlainForUser, findById, isOwnedBy, create, listPins, addPin, removePin };
