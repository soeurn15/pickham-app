const express = require('express');
const pool = require('../config/db.js');
const { hashPassword, verifyPassword } = require('../utils/password.js');
const { signToken } = require('../utils/token.js');
const { publicUser } = require('../utils/user.js');

const router = express.Router();

// --- AUTHENTICATION ENDPOINTS ---

// User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (rows.length === 0 || !verifyPassword(password.trim(), rows[0].password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Upgrade legacy plaintext passwords to a hash on first successful login
    if (!rows[0].password.startsWith('scrypt$')) {
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashPassword(password.trim()), rows[0].id]);
    }

    res.json({ ...publicUser(rows[0]), token: signToken(rows[0].id) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// User registration
router.post('/register', async (req, res) => {
  try {
    const { username, password, avatar, bio } = req.body;
    if (!username || !username.trim() || !password || !password.trim()) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if username already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const defaultAvatar = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username.trim())}&background=random`;
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role, avatar, bio) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), hashPassword(password.trim()), 'user', defaultAvatar, bio || 'Visual Enthusiast']
    );

    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json({ ...publicUser(newUser[0]), token: signToken(result.insertId) });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;
