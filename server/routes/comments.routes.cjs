const express = require('express');
const pool = require('../config/db.cjs');

const router = express.Router();

// Comments Endpoints
router.get('/pins/:id/comments', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const [rows] = await pool.query(
      `SELECT c.*, u.username, u.avatar as user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.pin_id = ?
       ORDER BY c.id ASC`,
      [pinId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

router.post('/pins/:id/comments', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const { comment_text } = req.body;

    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty' });
    }

    const [result] = await pool.query(
      'INSERT INTO comments (pin_id, user_id, comment_text) VALUES (?, ?, ?)',
      [pinId, req.user.id, comment_text.trim()]
    );

    // Fetch the newly inserted comment with user details
    const [comments] = await pool.query(
      `SELECT c.*, u.username, u.avatar as user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json(comments[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
