const v = require('./common.js');

function create(body = {}) {
  return { text: v.text(body.comment_text, 'Comment text', { max: 1000 }) };
}

module.exports = { create };
