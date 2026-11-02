const pool = require('../config/db.js');

const PUBLIC_COLUMNS = 'id, username, role, avatar, bio, created_at';

const findById = async (id, conn = pool) => (await conn.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`, [id]))[0][0];
const findAuthByUsername = async username => (await pool.query('SELECT * FROM users WHERE username = ?', [username]))[0][0];
const usernameTaken = async (username, exceptId = 0) =>
  (await pool.query('SELECT 1 FROM users WHERE username = ? AND id <> ?', [username, exceptId]))[0].length > 0;

async function create({ username, passwordHash, avatar, bio }) {
  const [result] = await pool.query(
    'INSERT INTO users (username, password, role, avatar, bio) VALUES (?, ?, ?, ?, ?)',
    [username, passwordHash, 'user', avatar, bio]
  );
  return result.insertId;
}

const updateProfile = (id, { username, avatar, bio }) =>
  pool.query('UPDATE users SET username = ?, avatar = ?, bio = ? WHERE id = ?', [username, avatar, bio, id]);

const setRole = (id, role) => pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
const remove = (id, conn = pool) => conn.query('DELETE FROM users WHERE id = ?', [id]);
const countAdmins = async (conn = pool) => (await conn.query("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"))[0][0].count;

async function listWithPinCounts({ limit, offset }) {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.avatar, u.bio, u.role, u.created_at, COUNT(p.id) AS pins_count
     FROM users u
     LEFT JOIN pins p ON u.id = p.user_id
     GROUP BY u.id
     ORDER BY u.id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
}

const count = async () => (await pool.query('SELECT COUNT(*) AS count FROM users'))[0][0].count;

module.exports = { findById, findAuthByUsername, usernameTaken, create, updateProfile, setRole, remove, countAdmins, listWithPinCounts, count };
