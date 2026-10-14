const express = require('express');
const pool = require('../config/db.js');
const { FALLBACK_CATEGORY, MAX_CATEGORY_LENGTH } = require('../utils/categories.js');

const router = express.Router();

// --- ADMIN MANAGEMENT ENDPOINTS ---

// Get Platform Metrics
router.get('/metrics', async (req, res) => {
  try {
    const [[usersCount]] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [[pinsCount]] = await pool.query('SELECT COUNT(*) as count FROM pins');
    const [[boardsCount]] = await pool.query('SELECT COUNT(*) as count FROM boards');
    const [[commentsCount]] = await pool.query('SELECT COUNT(*) as count FROM comments');

    const [[likesCount]] = await pool.query('SELECT COUNT(*) as count FROM likes');
    const [categories] = await pool.query(
      `SELECT COALESCE(category, 'Other') as category, COUNT(*) as count
       FROM pins GROUP BY category ORDER BY count DESC`
    );

    res.json({
      users: usersCount.count,
      pins: pinsCount.count,
      boards: boardsCount.count,
      comments: commentsCount.count,
      likes: likesCount.count,
      categories
    });
  } catch (error) {
    console.error('Failed to get metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve admin metrics' });
  }
});

// Get User Accounts list (admin role is enforced where the router is mounted)
router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.avatar, u.bio, u.role, u.created_at, COUNT(p.id) as pins_count
      FROM users u
      LEFT JOIN pins p ON u.id = p.user_id
      GROUP BY u.id
      ORDER BY u.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Failed to get admin users:', error);
    res.status(500).json({ error: 'Failed to retrieve admin users list' });
  }
});

// Toggle role between user/admin
router.post('/users/:id/role', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { role } = req.body;
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ error: 'Invalid user role specified' });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to change user role' });
  }
});

// Admin edit user profile details
router.post('/users/:id/edit', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { username, avatar, bio } = req.body;

    await pool.query(
      'UPDATE users SET username = ?, avatar = ?, bio = ? WHERE id = ?',
      [username, avatar, bio, id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Admin delete user account
router.delete('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    // Check if user exists
    const [user] = await pool.query('SELECT username FROM users WHERE id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user (cascade automatically cleans up pins, likes, comments, etc.)
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Add a category
router.post('/categories', async (req, res) => {
  try {
    const name = String(req.body?.name ?? '').trim();
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    if (name.length > MAX_CATEGORY_LENGTH) {
      return res.status(400).json({ error: `Category name must be ${MAX_CATEGORY_LENGTH} characters or fewer` });
    }

    // Names are matched case-insensitively by the column collation
    const [existing] = await pool.query('SELECT id FROM categories WHERE name = ?', [name]);
    if (existing.length > 0) return res.status(409).json({ error: 'That category already exists' });

    const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Delete a category; its pins move to the fallback category so none are orphaned
router.delete('/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query('SELECT name FROM categories WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });

    const { name } = rows[0];
    if (name === FALLBACK_CATEGORY) {
      return res.status(400).json({ error: `"${FALLBACK_CATEGORY}" is the default category and cannot be deleted` });
    }

    await pool.query('UPDATE pins SET category = ? WHERE category = ?', [FALLBACK_CATEGORY, name]);
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
