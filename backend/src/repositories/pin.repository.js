const pool = require('../config/db.js');
const { escapeLike } = require('../utils/sql.js');

// Pin + author + like count + this viewer's like/favourite flags (needs [viewerId, viewerId] params first)
const PIN_FIELDS = `
  p.*, u.username, u.avatar AS user_avatar, COUNT(DISTINCT l.user_id) AS likes_count,
  EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND pin_id = p.id) AS is_liked,
  EXISTS(SELECT 1 FROM favorites WHERE user_id = ? AND pin_id = p.id) AS is_favorited`;
const PIN_JOINS = 'JOIN users u ON p.user_id = u.id LEFT JOIN likes l ON p.id = l.pin_id';

const LIKE = "LIKE ? ESCAPE '|'";
const like = value => `%${escapeLike(value.toLowerCase())}%`;

function filters({ search, category, tag }) {
  const conditions = [];
  const params = [];
  if (category && category !== 'All') {
    conditions.push('p.category = ?');
    params.push(category);
  }
  if (tag) {
    conditions.push(`LOWER(p.tags) ${LIKE}`);
    params.push(like(tag));
  }
  if (search) {
    conditions.push(`(LOWER(p.title) ${LIKE} OR LOWER(p.description) ${LIKE} OR LOWER(p.tags) ${LIKE})`);
    params.push(like(search), like(search), like(search));
  }
  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

async function search(viewerId, query) {
  const { where, params } = filters(query);
  const [rows] = await pool.query(
    `SELECT ${PIN_FIELDS} FROM pins p ${PIN_JOINS} ${where} GROUP BY p.id ORDER BY p.id DESC LIMIT ? OFFSET ?`,
    [viewerId, viewerId, ...params, query.limit, query.offset]
  );
  return rows;
}

async function countMatching(query) {
  const { where, params } = filters(query);
  const [[row]] = await pool.query(`SELECT COUNT(*) AS count FROM pins p ${where}`, params);
  return row.count;
}

async function findDetail(viewerId, pinId) {
  const [rows] = await pool.query(
    `SELECT ${PIN_FIELDS}, u.bio AS user_bio FROM pins p ${PIN_JOINS} WHERE p.id = ? GROUP BY p.id`,
    [viewerId, viewerId, pinId]
  );
  return rows[0];
}

// Pins sharing the category or any tag with the given pin
async function findSimilar(pin, tags) {
  const conditions = [];
  const params = [];
  if (pin.category) {
    conditions.push('p.category = ?');
    params.push(pin.category);
  }
  if (tags.length) {
    conditions.push(`(${tags.map(() => `LOWER(p.tags) ${LIKE}`).join(' OR ')})`);
    tags.forEach(t => params.push(like(t)));
  }
  if (!conditions.length) return [];

  const [rows] = await pool.query(
    `SELECT p.*, u.username, u.avatar AS user_avatar, COUNT(DISTINCT l.user_id) AS likes_count
     FROM pins p ${PIN_JOINS}
     WHERE (${conditions.join(' OR ')}) AND p.id != ?
     GROUP BY p.id
     ORDER BY (CASE WHEN p.category = ? THEN 2 ELSE 0 END) DESC, p.id DESC
     LIMIT 8`,
    [...params, pin.id, pin.category]
  );
  return rows;
}

const findOwnerAndImage = async id =>
  (await pool.query('SELECT user_id, image_url, thumb_url FROM pins WHERE id = ?', [id]))[0][0];
const exists = async id => (await pool.query('SELECT 1 FROM pins WHERE id = ?', [id]))[0].length > 0;

async function create({ title, description, imageUrl, thumbUrl, category, tags, userId }, conn = pool) {
  const [result] = await conn.query(
    'INSERT INTO pins (title, description, image_url, thumb_url, category, tags, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, description, imageUrl, thumbUrl, category, tags, userId]
  );
  return result.insertId;
}

const remove = id => pool.query('DELETE FROM pins WHERE id = ?', [id]);

async function listUploadsByUser(userId, conn = pool) {
  const [rows] = await conn.query('SELECT image_url, thumb_url FROM pins WHERE user_id = ?', [userId]);
  return rows;
}

async function listByUser(userId) {
  const [rows] = await pool.query(
    `SELECT p.*, COUNT(DISTINCT l.user_id) AS likes_count
     FROM pins p LEFT JOIN likes l ON p.id = l.pin_id
     WHERE p.user_id = ? GROUP BY p.id ORDER BY p.id DESC`,
    [userId]
  );
  return rows;
}

async function listLikedByUser(userId) {
  const [rows] = await pool.query(
    `SELECT p.*, COUNT(DISTINCT l2.user_id) AS likes_count
     FROM likes l
     JOIN pins p ON l.pin_id = p.id
     LEFT JOIN likes l2 ON p.id = l2.pin_id
     WHERE l.user_id = ?
     GROUP BY p.id, l.created_at
     ORDER BY l.created_at DESC`,
    [userId]
  );
  return rows;
}

module.exports = {
  PIN_FIELDS, PIN_JOINS, search, countMatching, findDetail, findSimilar, findOwnerAndImage, exists,
  create, remove, listUploadsByUser, listByUser, listLikedByUser
};
