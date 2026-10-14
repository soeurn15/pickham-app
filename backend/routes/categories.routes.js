const express = require('express');
const pool = require('../config/db.js');
const { FALLBACK_CATEGORY } = require('../utils/categories.js');

const router = express.Router();

// List categories (any signed-in user). "Other" is always listed last.
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, COUNT(p.id) AS pins_count
       FROM categories c
       LEFT JOIN pins p ON p.category = c.name
       GROUP BY c.id
       ORDER BY c.name = ?, c.name`,
      [FALLBACK_CATEGORY]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

module.exports = router;
