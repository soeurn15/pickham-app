const { withTransaction } = require('../config/db.js');
const repo = require('../repositories/category.repository.js');
const { MAX_CATEGORY_LENGTH } = require('../validators/category.validator.js');
const { notFound, conflict, badRequest } = require('../utils/httpError.js');

const list = () => repo.listWithCounts();

async function create(name) {
  // Names are matched case-insensitively by the column collation
  if (await repo.findByName(name)) throw conflict('That category already exists');
  return { id: await repo.create(name), name };
}

// Pins in the deleted category move to the fallback so none are orphaned; both steps succeed or neither does.
async function remove(id) {
  const category = await repo.findById(id);
  if (!category) throw notFound('Category not found');
  if (category.name === repo.FALLBACK_CATEGORY) {
    throw badRequest(`"${repo.FALLBACK_CATEGORY}" is the default category and cannot be deleted`);
  }
  await withTransaction(async conn => {
    await repo.movePins(category.name, repo.FALLBACK_CATEGORY, conn);
    await repo.remove(id, conn);
  });
}

module.exports = { list, create, remove, MAX_CATEGORY_LENGTH };
