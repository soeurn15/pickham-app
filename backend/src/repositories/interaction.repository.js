// Likes, favourites (private bookmarks) and comments.
const pool = require('../config/db.js');
const { PIN_FIELDS, PIN_JOINS } = require('./pin.repository.js');

const COMMENT_SELECT = `
  SELECT c.*, u.username, u.avatar AS user_avatar
  FROM comments c JOIN users u ON c.user_id = u.id`;

const addLike = (userId, pinId) => pool.query('INSERT IGNORE INTO likes (user_id, pin_id) VALUES (?, ?)', [userId, pinId]);
const removeLike = (userId, pinId) => pool.query('DELETE FROM likes WHERE user_id = ? AND pin_id = ?', [userId, pinId]);
const countLikes = async pinId => (await pool.query('SELECT COUNT(*) AS count FROM likes WHERE pin_id = ?', [pinId]))[0][0].count;

const addFavorite = (userId, pinId) => pool.query('INSERT IGNORE INTO favorites (user_id, pin_id) VALUES (?, ?)', [userId, pinId]);
const removeFavorite = (userId, pinId) => pool.query('DELETE FROM favorites WHERE user_id = ? AND pin_id = ?', [userId, pinId]);

async function listFavorites(userId) {
  const [rows] = await pool.query(
    `SELECT ${PIN_FIELDS}
     FROM favorites f JOIN pins p ON f.pin_id = p.id ${PIN_JOINS}
     WHERE f.user_id = ?
     GROUP BY p.id, f.created_at
     ORDER BY f.created_at DESC`,
    [userId, userId, userId]
  );
  return rows;
}

async function listComments(pinId) {
  const [rows] = await pool.query(`${COMMENT_SELECT} WHERE c.pin_id = ? ORDER BY c.id ASC LIMIT 500`, [pinId]);
  return rows;
}

async function addComment(pinId, userId, text) {
  const [result] = await pool.query('INSERT INTO comments (pin_id, user_id, comment_text) VALUES (?, ?, ?)', [pinId, userId, text]);
  return (await pool.query(`${COMMENT_SELECT} WHERE c.id = ?`, [result.insertId]))[0][0];
}

module.exports = { addLike, removeLike, countLikes, addFavorite, removeFavorite, listFavorites, listComments, addComment };
