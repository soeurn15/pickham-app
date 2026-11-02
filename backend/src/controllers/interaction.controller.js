const service = require('../services/interaction.service.js');
const validate = require('../validators/comment.validator.js');
const { id } = require('../validators/common.js');

const like = async (req, res) => res.json(await service.like(req.user.id, id(req.params.id)));
const unlike = async (req, res) => res.json(await service.unlike(req.user.id, id(req.params.id)));
const favorite = async (req, res) => res.json(await service.favorite(req.user.id, id(req.params.id)));
const unfavorite = async (req, res) => res.json(await service.unfavorite(req.user.id, id(req.params.id)));
const favorites = async (req, res) => res.json(await service.favorites(req.user.id));
const comments = async (req, res) => res.json(await service.comments(id(req.params.id)));

async function addComment(req, res) {
  const { text } = validate.create(req.body);
  res.status(201).json(await service.addComment(req.user.id, id(req.params.id), text));
}

module.exports = { like, unlike, favorite, unfavorite, favorites, comments, addComment };
