const express = require('express');
const pool = require('../config/db.js');
const { publicUser } = require('../utils/user.js');

const router = express.Router();

// Get user profile
router.get('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    // User details
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = publicUser(users[0]);

    // Created pins
    const [createdPins] = await pool.query(
      `SELECT p.*, COUNT(DISTINCT l.user_id) as likes_count
       FROM pins p 
       LEFT JOIN likes l ON p.id = l.pin_id
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY p.id DESC`, 
      [id]
    );

    // Liked pins
    const [likedPins] = await pool.query(
      `SELECT p.*, COUNT(DISTINCT l2.user_id) as likes_count
       FROM likes l
       JOIN pins p ON l.pin_id = p.id
       LEFT JOIN likes l2 ON p.id = l2.pin_id
       WHERE l.user_id = ?
       GROUP BY p.id
       ORDER BY l.created_at DESC`,
      [id]
    );

    // Boards
    const [boards] = await pool.query('SELECT * FROM boards WHERE user_id = ? ORDER BY id DESC', [id]);

    res.json({
      user,
      created_pins: createdPins,
      liked_pins: likedPins,
      boards
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve user details' });
  }
});

// Update user profile
router.post('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { username, avatar, bio } = req.body;

    if (id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    await pool.query(
      'UPDATE users SET username = ?, avatar = ?, bio = ? WHERE id = ?',
      [username.trim(), avatar, bio, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
