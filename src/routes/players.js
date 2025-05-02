'use strict';

const {
  findPlayerByUsername,
  createPlayer,
  deletePlayer,
} = require('../database/player');

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
  fastify.get(
    '/players/:username',
    getPlayerOpts,
    (req, reply) => {
      const { username } = req.params;
      const player = findPlayerByUsername(username);
      reply.send(player);
    },
  );


  fastify.post(
    '/players/register',
    registerPlayerOpts,
    (req, reply) => {
      const { username, hashedPassword } = req.body;

      createPlayer(username, hashedPassword);
      const user = findPlayerByUsername(username);

      reply.code(201).send(user);
    },
  );

  fastify.delete(
    '/players/:username',
    deletePlayerOpts,
    (req, reply) => {
      const { username } = req.params;
      deletePlayer(username);

      reply.send({ 'message': `Player with ${username} has been deleted` });
    },
  );

  done();
};

module.exports = playerRoutes;
