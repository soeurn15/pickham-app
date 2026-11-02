const v = require('./common.js');

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

// Search / filter / page parameters for the feed
function list(query = {}) {
  const str = x => (typeof x === 'string' ? x.trim().slice(0, 100) : '');
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const page = Math.min(Math.max(parseInt(query.page, 10) || 1, 1), 10000);
  return { search: str(query.search), category: str(query.category), tag: str(query.tag), limit, offset: (page - 1) * limit };
}

// Text fields of a new pin. The image itself is validated and stored by media.service.
function create(body = {}) {
  const tags = typeof body.tags === 'string' && body.tags.trim()
    ? body.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 15).join(', ').slice(0, 500)
    : 'creative';

  return {
    title: v.optionalText(body.title, 'Title', { max: 255, fallback: 'Untitled Pin' }),
    description: v.optionalText(body.description, 'Description', { max: 2000 }),
    category: typeof body.category === 'string' ? body.category.trim() : '',
    tags,
    // Only used when no file is uploaded; http(s) only
    externalImageUrl: body.image_url ? v.httpUrl(body.image_url, 'Image URL') : null,
    boardId: body.board_id ? v.id(body.board_id, 'board id') : null
  };
}

module.exports = { list, create };
