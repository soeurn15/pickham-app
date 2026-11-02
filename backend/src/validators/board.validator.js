const v = require('./common.js');

function create(body = {}) {
  return {
    name: v.text(body.name, 'Board name', { max: 100 }),
    description: v.optionalText(body.description, 'Description', { max: 500 })
  };
}

module.exports = { create };
