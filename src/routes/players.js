'use strict';

const {
  createPlayer,
  deletePlayer,
  findPlayer,
  changePassword,
} = require('../database/player');

const {
  createToken,
  findToken,
  renewTokenExpireDate,
  deleteAllPlayerTokens,
} = require('../database/token');
const { InvalidPassword } = require('../error-handler');

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

const tokenHeader = {
  type: 'object',
  properties: {
    'x-token': { 'type': 'string' },
  },
  required: ['x-token'],
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

    headers: tokenHeader,
  },
};

const changePasswordOpts = {
  schema: {
    body: {
      type: 'object',
      properties: {
        newPassword: { type: 'string' },
      },
    },

    response: {
      201: {
        type: 'object',
        properties: {
          status: { type: 'string' },
        },
      },
    },

    headers: tokenHeader,
  },
};

const playerRoutes = async (fastify, options) => {
  fastify.post(
    '/players/register',
    registerPlayerOpts,
    async (req, reply) => {
      const { username, password } = req.body;

      const hashedPassword = hashPassword(password);

      await createPlayer(username, hashedPassword);

      const token = generateToken();
      const tokenExpireDate = addHoursToDatetime(new Date(), 6);

      const player = await findPlayer(username);

      await createToken(token, tokenExpireDate.toISOString(), player.id);

      return reply.code(201).send({ token, tokenExpireDate });
    },
  );

  fastify.post(
    '/players/log-in',
    loginPlayerOpts,
    async (req, reply) => {
      const { username, password } = req.body;

      const player = await findPlayer(username);
      const isValidPassword = checkPassword(
        password,
        player.password_hash,
        player.password_salt,
      );

      if (!isValidPassword) {
        throw new InvalidPassword('Your password is invalid');
      }

      const token = generateToken();
      const tokenExpireDate = addHoursToDatetime(new Date(), 6);

      await createToken(token, tokenExpireDate.toISOString(), player.id);

      reply.code(201).send({ token, tokenExpireDate });
    },
  );

  fastify.get(
    '/players/:username',
    getPlayerOpts,
    async (req, reply) => {
      const { username } = req.params;
      const player = await findPlayer(username);
      reply.send(player);
    },
  );

  fastify.delete(
    '/players',
    deletePlayerOpts,
    async (req, reply) => {
      const token = req.headers['x-token'];

      const tokenRecord = await findToken(token);
      const player = await findPlayer(tokenRecord.creator_id, 'id');

      await deleteAllPlayerTokens(tokenRecord.creator_id);
      await deletePlayer(player.username);
      reply.send({
        'message': `Player with username: ${player.username} has been deleted`,
      });
    },
  );

  fastify.post(
    '/players/changePassword',
    changePasswordOpts,
    async (req, reply) => {
      const token = req.headers['x-token'];
      const { newPassword } = req.body;

      const tokenRecord = await findToken(token);
      const player = await findPlayer(tokenRecord.creator_id, 'id');

      const hashedNewPassword = hashPassword(newPassword);
      await changePassword(hashedNewPassword, player.username);

      reply.send({
        'status': 'The password was changed successfully',
      });
    },
  );
};

module.exports = playerRoutes;
