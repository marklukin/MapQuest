'use strict';

const {
  findPlayerByUsername,
  createPlayer,
  deletePlayer,
  findPlayerByToken,
  updateUserToken,
} = require('../database/player');

const {
  generateToken,
  checkPassword,
  hashPassword,
  addHoursToDatetime,
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

const loginPlayerOpts = {
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

    body: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string' },
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

      const hashedPassword = hashPassword(password);
      const token = generateToken();

      const tokenExpireDate = addHoursToDatetime(new Date(), 6);

      createPlayer(
        username,
        hashedPassword,
        token,
        tokenExpireDate,
      );

      reply.code(201).send({ token, tokenExpireDate });
    },
  );

  fastify.post(
    '/players/log-in',
    loginPlayerOpts,
    (req, reply) => {
      const { username, password } = req.body;

      const user = findPlayerByUsername(username);
      const isValidPassword = checkPassword(
        password,
        user.password_hash,
        user.password_salt,
      );
      // FIX: fix error
      if (!isValidPassword) {
        reply.code(401).send({ error: 'unautherized' });
      }
      const tokenExpireDate = addHoursToDatetime(new Date(), 6);

      const token = generateToken();
      updateUserToken(user.token, token, tokenExpireDate);

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
    '/players',
    deletePlayerOpts,
    (req, reply) => {
      const { token } = req.body;

      const player = findPlayerByToken(token);
      deletePlayer(player.username);

      reply.send({
        'message': `Player with ${player.username} has been deleted`,
      });
    },
  );

  done();
};

module.exports = playerRoutes;
