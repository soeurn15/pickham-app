// requireAuth: valid token -> req.user = { id, username, role }.  requireAdmin: role must be admin.
const userRepo = require('../repositories/user.repository.js');
const { readToken } = require('../utils/token.js');
const { unauthorized, forbidden } = require('../utils/httpError.js');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const userId = readToken(header.startsWith('Bearer ') ? header.slice(7) : '');
  if (!userId) throw unauthorized('Please log in again');

  // Role is re-read from the database on every request, so demotions and deletions apply immediately
  const user = await userRepo.findById(userId);
  if (!user) throw unauthorized('Account no longer exists');

  req.user = { id: user.id, username: user.username, role: user.role };
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') throw forbidden('Admin access required');
  next();
}

module.exports = { requireAuth, requireAdmin };
