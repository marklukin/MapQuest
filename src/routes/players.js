'use strict';

const {
  createPlayer,
  deletePlayer,
  findPlayer,
} = require('../database/player');

const {
  createToken,
  findToken,
  renewTokenExpireDate,
  deleteAllPlayerTokens,
} = require('../database/token');

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
      type: 'object',
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

      createPlayer(
        username,
        hashedPassword,
      );

      const token = generateToken();
      const tokenExpireDate = addHoursToDatetime(new Date(), 6);

      const player = findPlayer(username);

      createToken(token, tokenExpireDate.toISOString(), player.id);

      reply.code(201).send({ token, tokenExpireDate });
    },
  );

  fastify.post(
    '/players/log-in',
    loginPlayerOpts,
    (req, reply) => {
      const { username, password } = req.body;

      const player = findPlayer(username);
      const isValidPassword = checkPassword(
        password,
        player.password_hash,
        player.password_salt,
      );
      // FIX: fix error
      if (!isValidPassword) {
        reply.code(401).send({ error: 'unautherized' });
      }

      const token = generateToken();
      const tokenExpireDate = addHoursToDatetime(new Date(), 6);

      createToken(token, tokenExpireDate.toISOString(), player.id);

      reply.code(201).send({ token, tokenExpireDate });
    },
  );

  fastify.get(
    '/players/:username',
    getPlayerOpts,
    (req, reply) => {
      const { username } = req.params;
      const player = findPlayer(username);
      reply.send(player);
    },
  );

  fastify.delete(
    '/players',
    deletePlayerOpts,
    (req, reply) => {
      const { token } = req.body;

      const tokenRecord = findToken(token);
      const player = findPlayer(tokenRecord.creator_id, 'id');

      deleteAllPlayerTokens(tokenRecord.creator_id);
      deletePlayer(player.username);
      reply.send({
        'message': `Player with username: ${player.username} has been deleted`,
      });
    },
  );

  done();
};

module.exports = playerRoutes;
