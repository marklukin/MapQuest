import {
  createPlayer,
  findPlayer,
  deletePlayer,
  changePassword,
  changeUsername,
  updateScore,
  updateAvatar,
} from '../database/player.js';

import {
  createToken,
  findToken,
  validateToken,
  deleteAllPlayerTokens,
} from '../database/token.js';


import { Unauthorized } from '../error-handler.js';

import {
  generateToken,
  checkPassword,
  hashPassword,
  addHoursToDatetime,
} from '../utils.js';


const registerPlayerOpts = {
  schema: {
    response: {
      201: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          expire: { type: 'string' },
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

const Player = {
  type: 'object',
  properties: {
    Playerid: { type: 'integer' },
    username: { type: 'string' },
    registration_date: { type: 'string' },
    world_score: { type: 'integer' },
    europe_score: { type: 'integer' },
    asia_score: { type: 'integer' },
    usa_score: { type: 'integer' },
    africa_score: { type: 'integer' },
  },
};

const getPlayerOpts = {
  schema: {
    response: {
      200: Player,
    },
  },
};


const getCurrentPlayerOpts = {
  schema: {
    headers: tokenHeader,
    
    response: { 200: Player },
  }
}

const tokenHeader = {
  type: 'object',
  properties: {
    'x-token': { 'type': 'string' },
  },
  required: ['x-token'],
};

const statusMessage = {
  type: 'object',
  properties: {
    message: { type: 'string' },
  },
};

const deletePlayerOpts = {
  schema: {
    headers: tokenHeader,

    response: { 201: statusMessage },
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

    headers: tokenHeader,

    response: { 201: statusMessage },
  },
};

const changeUsernameOpts = {
  schema: {
    body: {
      type: 'object',
      properties: {
        newUsername: { type: 'string' },
      },
    },

    headers: tokenHeader,

    response: { 201: statusMessage },
  },
};

const updateScoreOpts = {
  schema: {
    headers: tokenHeader,

    response: { 201: statusMessage },
  }
};

const updateAvatarOpts = {
  schema: {
    haders: tokenHeader,

    body: {
      type: 'object',
      required: ['avatar'],
      properties: {
        avatar: { type: 'string' },
      },
    },

    response: { 201: statusMessage },
  },
};


export const playerRoutes = async (fastify, options) => {
  fastify.post(
    '/players/register',
    registerPlayerOpts,
    async (req, reply) => {
      const { username, password } = req.body;

      const hashedPassword = hashPassword(password);

      await createPlayer(username, hashedPassword);

      const token = generateToken();
      const expire = addHoursToDatetime(new Date(), 6);

      const player = await findPlayer(username);

      await createToken(token, expire.toISOString(), player.id);

      return reply.code(201).send({ token, expire });
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
        throw new Unauthorized('Your password is invalid');
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
      await validateToken(token);

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
      await validateToken(token);
      const { newPassword } = req.body;

      const tokenRecord = await findToken(token);
      const player = await findPlayer(tokenRecord.creator_id, 'id');

      const hashedNewPassword = hashPassword(newPassword);
      await changePassword(hashedNewPassword, player.username);

      reply.send({
        'message': 'The password was changed successfully',
      });
    },
  );

  fastify.post(
    '/players/changeUsername',
    changeUsernameOpts,
    async (req, reply) => {
      const token = req.headers['x-token'];
      await validateToken(token);
      const { newUsername } = req.body;

      const tokenRecord = await findToken(token);
      const player = await findPlayer(tokenRecord.creator_id, 'id');

      await changeUsername(newUsername, player.username);

      reply.send({
        'message': 'The username was changed successfully',
      });
    },
  );

  fastify.post(
    '/players/updateScore',
    updateScoreOpts,
    async (req, reply) => {
      const token = req.headers['x-token'];
      await validateToken(token);

      const { score, region } = req.cookies;
      const tokenRecord = await findToken(token);
      const playerId = tokenRecord.creator_id;

      await updateScore(score, region, playerId);

      reply.send({
        'message': 'The score was updated successfully'
      });
    }
  );
  
  fastify.post(
    '/players/updateAvatar',
    updateAvatarOpts,
    async (req, reply) => {
      const token = req.headers['x-token'];
      await validateToken(token);
      
      const { avatar } = req.body;

      const sizeInBytes = (avatar.length * 3) / 4;
      const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

      if (sizeInBytes > MAX_IMAGE_SIZE) {
        return reply.code(500).send({ 
          err: 'Image too large. Maximum size is 2MB.' 
        });
      }

      const tokenRecord = await findToken(token);
      await updateAvatar(avatar, tokenRecord.creator_id);

      reply.send({
        'message': 'The avatar was updated successfully',
      });
    }
  );
};
