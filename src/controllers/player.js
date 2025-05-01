'use strict';

const { findPlayerByUsername, createPlayer } = require('../database/player');

// GET /player:username
const getPlayer = (req, reply) => {
  const { username } = req.params;

  const player = findPlayerByUsername(username);

  reply.send(player);
};

// POST /player/register
const registerPlayer = (req, reply) => {
  const { username, hashedPassword } = req.body;

  createPlayer(username, hashedPassword);
  const user = findPlayerByUsername(username);

  reply.code(201).send(user);
};

module.exports = {
  getPlayer,
  registerPlayer,
};
