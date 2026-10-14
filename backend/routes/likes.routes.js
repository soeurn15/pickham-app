const express = require('express');
const pool = require('../config/db.js');

const router = express.Router();

// Likes Endpoints
router.post('/pins/:id/like', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    await pool.query('INSERT IGNORE INTO likes (user_id, pin_id) VALUES (?, ?)', [userId, pinId]);
    const [count] = await pool.query('SELECT COUNT(*) as count FROM likes WHERE pin_id = ?', [pinId]);
    
    res.json({ success: true, likes_count: count[0].count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to like pin' });
  }
});

router.delete('/pins/:id/like', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    await pool.query('DELETE FROM likes WHERE user_id = ? AND pin_id = ?', [userId, pinId]);
    const [count] = await pool.query('SELECT COUNT(*) as count FROM likes WHERE pin_id = ?', [pinId]);

    res.json({ success: true, likes_count: count[0].count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to unlike pin' });
  }
});

module.exports = router;
