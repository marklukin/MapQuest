'use strict';

const { getPlayer, registerPlayer } = require('../controllers/player');

const Player = {
  type: 'object',
  properties: {
    Playerid: { type: 'integer' },
    username: { type: 'string' },
    world_score: { type: 'integer' },
    europe_score: { type: 'integer' },
    asia_score: { type: 'integer' },
    usa_score: { type: 'integer' },
  },
};

const getPlayerOpts = {
  schema: {
    response: {
      200: Player,
    },
  },
};

const registerPlayerOpts = {
  schema: {
    response: {
      201: Player,
    },
  },
};

const playerRoutes = (fastify, options, done) => {
  fastify.get('/players/:username', getPlayerOpts, getPlayer);
  fastify.post('/players/register', registerPlayerOpts, registerPlayer);

  done();
};

module.exports = playerRoutes;
