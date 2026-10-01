const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db.cjs');
const { upload, UPLOADS_DIR } = require('../middleware/upload.cjs');
const { ownsBoard } = require('../utils/boards.cjs');

const router = express.Router();

// Pins List (supports Search, Category, and Tag)
router.get('/pins', async (req, res) => {
  try {
    const { search, category, tag } = req.query;
    let sql = `
      SELECT p.*, u.username, u.avatar as user_avatar, COUNT(DISTINCT l.user_id) as likes_count,
             EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND pin_id = p.id) as is_liked,
             EXISTS(SELECT 1 FROM favorites WHERE user_id = ${Number(req.user.id)} AND pin_id = p.id) as is_favorited
      FROM pins p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.pin_id
    `;
    const params = [req.user.id]; // current user checks likes
    const conditions = [];

    if (category && category !== 'All') {
      conditions.push('p.category = ?');
      params.push(category);
    }

    if (tag) {
      conditions.push('LOWER(p.tags) LIKE ?');
      params.push(`%${tag.toString().toLowerCase()}%`);
    }

    if (search) {
      conditions.push('(LOWER(p.title) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.tags) LIKE ?)');
      const searchPattern = `%${search.toString().toLowerCase()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY p.id ORDER BY p.id DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve pins' });
  }
});

// Pin Details & Recommended similar pins
router.get('/pins/:id', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Fetch details
    const [pins] = await pool.query(
      `SELECT p.*, u.username, u.avatar as user_avatar, u.bio as user_bio,
              COUNT(DISTINCT l.user_id) as likes_count,
              EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND pin_id = p.id) as is_liked,
             EXISTS(SELECT 1 FROM favorites WHERE user_id = ${Number(req.user.id)} AND pin_id = p.id) as is_favorited
       FROM pins p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON p.id = l.pin_id
       WHERE p.id = ?
       GROUP BY p.id`,
      [userId, pinId]
    );

    if (pins.length === 0) {
      return res.status(404).json({ error: 'Pin not found' });
    }
    const pin = pins[0];

    // Split tags for matching
    const tagsArr = pin.tags ? pin.tags.split(',').map(t => t.trim().toLowerCase()) : [];
    
    // Similar Pins calculation:
    // Match same category or overlap in tags. Sort by matches count.
    let similarPins = [];
    if (tagsArr.length > 0 || pin.category) {
      let tagsQueryParts = tagsArr.map(() => 'LOWER(p.tags) LIKE ?').join(' OR ');
      let conditions = [];
      let params = [];

      if (pin.category) {
        conditions.push('p.category = ?');
        params.push(pin.category);
      }
      if (tagsQueryParts) {
        conditions.push(`(${tagsQueryParts})`);
        tagsArr.forEach(t => params.push(`%${t}%`));
      }

      // Exclude current pin
      params.push(pinId);

      const [simRows] = await pool.query(
        `SELECT p.*, u.username, u.avatar as user_avatar, COUNT(DISTINCT l.user_id) as likes_count
         FROM pins p
         JOIN users u ON p.user_id = u.id
         LEFT JOIN likes l ON p.id = l.pin_id
         WHERE (${conditions.join(' OR ')}) AND p.id != ?
         GROUP BY p.id
         ORDER BY (CASE WHEN p.category = ? THEN 2 ELSE 0 END) DESC, p.id DESC
         LIMIT 8`,
        [...params, pin.category]
      );
      similarPins = simRows;
    }

    res.json({ pin, similar: similarPins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve pin details' });
  }
});

// Create Pin
router.post('/pins', upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    let imageUrl = '';

    if (req.file) {
      // Physical file uploaded
      imageUrl = '/uploads/' + req.file.filename;
    } else if (req.body.image_url) {
      // Image URL provided
      imageUrl = req.body.image_url;
    } else {
      return res.status(400).json({ error: 'Please upload an image or provide a valid image URL' });
    }

    const userId = req.user.id;
    const parsedTags = tags ? tags.toString().split(',').map(t => t.trim()).join(', ') : 'creative';

    const [insertResult] = await pool.query(
      'INSERT INTO pins (title, description, image_url, category, tags, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title || 'Untitled Pin', description || '', imageUrl, category || 'Other', parsedTags, userId]
    );

    const pinId = insertResult.insertId;

    // Check if the user selected a board to save to directly
    const boardId = req.body.board_id ? parseInt(req.body.board_id, 10) : null;
    if (boardId && (await ownsBoard(userId, boardId))) {
      await pool.query('INSERT INTO board_pins (board_id, pin_id) VALUES (?, ?)', [boardId, pinId]);
    }

    res.status(201).json({ success: true, pinId });
  } catch (error) {
    console.error('Error creating pin:', error);
    res.status(500).json({ error: 'Failed to create pin: ' + error.message });
  }
});

// Delete Pin
router.delete('/pins/:id', async (req, res) => {
  try {
    const pinId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Verify ownership
    const [pin] = await pool.query('SELECT user_id, image_url FROM pins WHERE id = ?', [pinId]);
    if (pin.length === 0) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    if (pin[0].user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to delete this pin' });
    }

    // Delete physically if local upload
    if (pin[0].image_url.startsWith('/uploads/')) {
      const filename = pin[0].image_url.replace('/uploads/', '');
      const filepath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    await pool.query('DELETE FROM pins WHERE id = ?', [pinId]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete pin' });
  }
});

module.exports = router;
