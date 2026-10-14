// requireAuth: valid token -> req.user = { id, username, role }.  requireAdmin: role must be admin.
const pool = require('../config/db.js');
const { readToken } = require('../utils/token.js');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const userId = readToken(header.startsWith('Bearer ') ? header.slice(7) : '');
    if (!userId) return res.status(401).json({ error: 'Please log in again' });

    const [rows] = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(401).json({ error: 'Account no longer exists' });

    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

module.exports = { requireAuth, requireAdmin };