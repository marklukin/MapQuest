'use strict';

const {
  getPlayerHandler,
  registerPlayerHandler,
  deletePlayerHandler,
} = require('../controllers/players');

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
    body: {
      type: 'object',
      required: ['username', 'hashedPassword'],
      properties: {
        username: { type: 'string' },
        hashedPassword: { type: 'string' },
      },
    },
  },
};

const deletePlayerOpts = {
  schema: {
    response: {
      201: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    },
  },
};

const playerRoutes = (fastify, options, done) => {
  fastify.get('/players/:username', getPlayerOpts, getPlayerHandler);
  fastify.post('/players/register', registerPlayerOpts, registerPlayerHandler);
  fastify.delete('/players/:username', deletePlayerOpts, deletePlayerHandler);

  done();
};

module.exports = playerRoutes;
