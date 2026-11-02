const v = require('./common.js');

const MAX_CATEGORY_LENGTH = 50;

function create(body = {}) {
  return { name: v.text(body.name, 'Category name', { max: MAX_CATEGORY_LENGTH }) };
}

module.exports = { create, MAX_CATEGORY_LENGTH };
