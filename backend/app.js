// Builds the Express app: global middleware, security gate, and route wiring.
const express = require('express');
const cors = require('cors');

const pool = require('./config/db.js');
const { requireAuth, requireAdmin } = require('./middleware/auth.js');
const { UPLOADS_DIR } = require('./middleware/upload.js');
const { loginLimiter } = require('./middleware/rateLimit.js');
const errorHandler = require('./middleware/errorHandler.js');

const app = express();

app.use(cors());
app.use(express.json());

// Uploaded images are public files
app.use('/uploads', express.static(UPLOADS_DIR));

// Public: confirms the server and database are reachable
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

// Every /api route needs a valid token except login/register
app.use('/api', (req, res, next) => (req.path.startsWith('/auth/') ? next() : requireAuth(req, res, next)));

// Routes
app.use('/api/auth', loginLimiter, require('./routes/auth.routes.js'));
app.use('/api/admin', requireAdmin, require('./routes/admin.routes.js'));
app.use('/api', require('./routes/users.routes.js'));
app.use('/api', require('./routes/categories.routes.js'));
app.use('/api', require('./routes/pins.routes.js'));
app.use('/api', require('./routes/likes.routes.js'));
app.use('/api', require('./routes/favorites.routes.js'));
app.use('/api', require('./routes/comments.routes.js'));
app.use('/api', require('./routes/boards.routes.js'));

app.use(errorHandler);

module.exports = app;