const express = require('express');
const pool = require('../config/db.js');
const { ownsBoard } = require('../utils/boards.js');

const router = express.Router();

// Boards Endpoints
router.get('/boards', async (req, res) => {
  try {
    const userId = req.user.id;
    // Get boards alongside pins count and cover image (first pin in the board)
    const [rows] = await pool.query(
      `SELECT b.*, COUNT(bp.pin_id) as pins_count, 
              (SELECT p.image_url FROM board_pins bp2 
               JOIN pins p ON bp2.pin_id = p.id 
               WHERE bp2.board_id = b.id ORDER BY bp2.created_at DESC LIMIT 1) as cover_url
       FROM boards b
       LEFT JOIN board_pins bp ON b.id = bp.board_id
       WHERE b.user_id = ?
       GROUP BY b.id
       ORDER BY b.id DESC`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve boards' });
  }
});

router.post('/boards', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Board name is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO boards (name, description, user_id) VALUES (?, ?, ?)',
      [name.trim(), description || '', req.user.id]
    );

    res.status(201).json({ id: result.insertId, name, description, pins_count: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create board' });
  }
});

// Get pins saved within a board
router.get('/boards/:id/pins', async (req, res) => {
  try {
    const boardId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Board details
    const [boards] = await pool.query('SELECT * FROM boards WHERE id = ?', [boardId]);
    if (boards.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const [pins] = await pool.query(
      `SELECT p.*, u.username, u.avatar as user_avatar, COUNT(DISTINCT l.user_id) as likes_count,
              EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND pin_id = p.id) as is_liked,
             EXISTS(SELECT 1 FROM favorites WHERE user_id = ${Number(req.user.id)} AND pin_id = p.id) as is_favorited
       FROM board_pins bp
       JOIN pins p ON bp.pin_id = p.id
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON p.id = l.pin_id
       WHERE bp.board_id = ?
       GROUP BY p.id
       ORDER BY bp.created_at DESC`,
      [userId, boardId]
    );

    res.json({ board: boards[0], pins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve pins in board' });
  }
});

// Save a pin to a board
router.post('/boards/:id/pins', async (req, res) => {
  try {
    const boardId = parseInt(req.params.id, 10);
    const { pin_id } = req.body;

    if (!(await ownsBoard(req.user.id, boardId))) {
      return res.status(403).json({ error: 'You can only change your own boards' });
    }
    const [result] = await pool.query('INSERT IGNORE INTO board_pins (board_id, pin_id) VALUES (?, ?)', [boardId, parseInt(pin_id, 10)]);
    res.json({ success: true, already_saved: result.affectedRows === 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save pin to board' });
  }
});

// Remove a pin from a board
router.delete('/boards/:id/pins/:pinId', async (req, res) => {
  try {
    const boardId = parseInt(req.params.id, 10);
    const pinId = parseInt(req.params.pinId, 10);

    if (!(await ownsBoard(req.user.id, boardId))) {
      return res.status(403).json({ error: 'You can only change your own boards' });
    }
    await pool.query('DELETE FROM board_pins WHERE board_id = ? AND pin_id = ?', [boardId, pinId]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove pin from board' });
  }
});

module.exports = router;
