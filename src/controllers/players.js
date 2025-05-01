'use strict';

const {
  findPlayerByUsername,
  createPlayer,
  deletePlayer,
} = require('../database/player');

// GET /player:username
const getPlayerHandler = (req, reply) => {
  const { username } = req.params;

  const player = findPlayerByUsername(username);

  reply.send(player);
};

// POST /player/register
const registerPlayerHandler = (req, reply) => {
  const { username, hashedPassword } = req.body;

  createPlayer(username, hashedPassword);
  const user = findPlayerByUsername(username);

  reply.code(201).send(user);
};

const deletePlayerHandler = (req, reply) => {
  const { username } = req.params;

  deletePlayer(username);

  reply.send({ 'message': `Player with ${username} has been deleted` });
};

module.exports = {
  getPlayerHandler,
  registerPlayerHandler,
  deletePlayerHandler,
};
