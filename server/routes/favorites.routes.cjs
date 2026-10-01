const express = require('express');
const pool = require('../config/db.cjs');

const router = express.Router();

// Favorites (private bookmarks)
router.get('/favorites', async (req, res) => {
  try {
    const [pins] = await pool.query(
      `SELECT p.*, u.username, u.avatar as user_avatar, COUNT(DISTINCT l.user_id) as likes_count,
              EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND pin_id = p.id) as is_liked,
              1 as is_favorited
       FROM favorites f
       JOIN pins p ON f.pin_id = p.id
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON p.id = l.pin_id
       WHERE f.user_id = ?
       GROUP BY p.id, f.created_at
       ORDER BY f.created_at DESC`,
      [req.user.id, req.user.id]
    );
    res.json(pins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load favorites' });
  }
});

router.post('/pins/:id/favorite', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const [pin] = await pool.query('SELECT id FROM pins WHERE id = ?', [pinId]);
    if (pin.length === 0) return res.status(404).json({ error: 'Pin not found' });

    await pool.query('INSERT IGNORE INTO favorites (user_id, pin_id) VALUES (?, ?)', [req.user.id, pinId]);
    res.json({ success: true, is_favorited: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

router.delete('/pins/:id/favorite', async (req, res) => {
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = ? AND pin_id = ?', [req.user.id, parseInt(req.params.id, 10)]);
    res.json({ success: true, is_favorited: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

module.exports = router;
