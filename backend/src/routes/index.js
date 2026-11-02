// All API routes. Public: /health and /auth/*. Everything else needs a token; /admin/* also needs the admin role.
const express = require('express');
const pool = require('../config/db.js');
const { requireAuth, requireAdmin } = require('../middleware/auth.js');
const { authLimiter, uploadLimiter } = require('../middleware/rateLimit.js');
const { upload } = require('../middleware/upload.js');

const auth = require('../controllers/auth.controller.js');
const users = require('../controllers/user.controller.js');
const pins = require('../controllers/pin.controller.js');
const boards = require('../controllers/board.controller.js');
const interactions = require('../controllers/interaction.controller.js');
const categories = require('../controllers/category.controller.js');

const router = express.Router();

// --- Public ---
router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});
router.post('/auth/login', authLimiter, auth.login);
router.post('/auth/register', authLimiter, auth.register);

// --- Signed-in users ---
router.use(requireAuth);

router.get('/users/:id', users.profile);
router.post('/users/:id', users.updateProfile);

router.get('/categories', categories.list);

router.get('/pins', pins.list);
router.get('/pins/:id', pins.detail);
router.post('/pins', uploadLimiter, upload.single('image'), pins.create);
router.delete('/pins/:id', pins.remove);

router.post('/pins/:id/like', interactions.like);
router.delete('/pins/:id/like', interactions.unlike);
router.get('/favorites', interactions.favorites);
router.post('/pins/:id/favorite', interactions.favorite);
router.delete('/pins/:id/favorite', interactions.unfavorite);
router.get('/pins/:id/comments', interactions.comments);
router.post('/pins/:id/comments', interactions.addComment);

router.get('/boards', boards.list);
router.post('/boards', boards.create);
router.get('/boards/:id/pins', boards.pins);
router.post('/boards/:id/pins', boards.addPin);
router.delete('/boards/:id/pins/:pinId', boards.removePin);

// --- Admins only ---
const admin = express.Router();
admin.use(requireAdmin);
admin.get('/metrics', users.metrics);
admin.get('/users', users.listUsers);
admin.post('/users/:id/role', users.setRole);
admin.post('/users/:id/edit', users.updateProfile); // an admin may edit any profile
admin.delete('/users/:id', users.removeUser);
admin.post('/categories', categories.create);
admin.delete('/categories/:id', categories.remove);
router.use('/admin', admin);

module.exports = router;
