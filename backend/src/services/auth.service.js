const userRepo = require('../repositories/user.repository.js');
const { hashPassword, verifyPassword, DUMMY_HASH_PROMISE } = require('../utils/password.js');
const { signToken } = require('../utils/token.js');
const { publicUser } = require('../utils/user.js');
const { unauthorized, conflict } = require('../utils/httpError.js');

async function login({ username, password }) {
  const user = await userRepo.findAuthByUsername(username);
  // Always run one hash comparison so unknown usernames take as long as wrong passwords
  const ok = await verifyPassword(password, user ? user.password : await DUMMY_HASH_PROMISE);
  if (!user || !ok) throw unauthorized('Invalid username or password');
  return { ...publicUser(user), token: signToken(user.id) };
}

async function register({ username, password, avatar, bio }) {
  if (await userRepo.usernameTaken(username)) throw conflict('Username is already taken');

  const avatarUrl = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
  const id = await userRepo.create({ username, passwordHash: await hashPassword(password), avatar: avatarUrl, bio });
  return { ...(await userRepo.findById(id)), token: signToken(id) };
}

module.exports = { login, register };
