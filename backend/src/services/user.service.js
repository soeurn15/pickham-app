const { withTransaction } = require('../config/db.js');
const userRepo = require('../repositories/user.repository.js');
const pinRepo = require('../repositories/pin.repository.js');
const boardRepo = require('../repositories/board.repository.js');
const storage = require('./storage.service.js');
const { notFound, forbidden, conflict, badRequest } = require('../utils/httpError.js');

async function getProfile(id) {
  const user = await userRepo.findById(id);
  if (!user) throw notFound('User not found');

  const [created_pins, liked_pins, boards] = await Promise.all([
    pinRepo.listByUser(id),
    pinRepo.listLikedByUser(id),
    boardRepo.listPlainForUser(id)
  ]);
  return { user, created_pins, liked_pins, boards };
}

// Users edit themselves; admins may edit anyone.
async function updateProfile(actor, id, data) {
  if (id !== actor.id && actor.role !== 'admin') throw forbidden('You can only edit your own profile');
  if (!(await userRepo.findById(id))) throw notFound('User not found');
  if (await userRepo.usernameTaken(data.username, id)) throw conflict('Username is already taken');
  await userRepo.updateProfile(id, data);
}

const listForAdmin = async ({ limit = 200, offset = 0 } = {}) => userRepo.listWithPinCounts({ limit, offset });

async function setRole(actor, id, role) {
  if (id === actor.id) throw badRequest('You cannot change your own role');
  if (!(await userRepo.findById(id))) throw notFound('User not found');
  await userRepo.setRole(id, role);
}

async function remove(actor, id) {
  if (id === actor.id) throw badRequest('You cannot delete your own account here');

  // Rows cascade; the stored image files are removed once the database change has committed
  const uploads = await withTransaction(async conn => {
    const user = await userRepo.findById(id, conn);
    if (!user) throw notFound('User not found');
    if (user.role === 'admin' && (await userRepo.countAdmins(conn)) <= 1) throw badRequest('The last admin cannot be deleted');
    const files = await pinRepo.listUploadsByUser(id, conn);
    await userRepo.remove(id, conn);
    return files;
  });
  await Promise.all(uploads.flatMap(p => [storage.remove(p.image_url), storage.remove(p.thumb_url)]));
}

module.exports = { getProfile, updateProfile, listForAdmin, setRole, remove };
