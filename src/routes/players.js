'use strict';

const {
  findPlayerByUsername,
  createPlayer,
  deletePlayer,
} = require('../database/player');

const {
  generateToken,
  generatePassword,
  validPassword,
} = require('../utils');

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
      201: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          tokenExpireDate: { type: 'string' },
        },
      },
    },
    body: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
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
  fastify.post(
    '/players/register',
    registerPlayerOpts,
    (req, reply) => {
      const { username, password } = req.body;

      const encryptedPassword = generatePassword(password);
      const token = generateToken();

      const days = 7;
      let tokenExpireDate = new Date();
      tokenExpireDate.setDate(tokenExpireDate.getDate() + days);
      tokenExpireDate = tokenExpireDate.toISOString();

      createPlayer(
        username,
        encryptedPassword,
        token,
        tokenExpireDate,
      );

      reply.code(201).send({ token, tokenExpireDate });
    },
  );

  fastify.get(
    '/players/:username',
    getPlayerOpts,
    (req, reply) => {
      const { username } = req.params;
      const player = findPlayerByUsername(username);
      reply.send(player);
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
