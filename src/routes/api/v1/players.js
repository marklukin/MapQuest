import {
  createPlayer,
  findPlayer,
  deletePlayer,
  changePassword,
  changeUsername,
  saveGameResult,
  updateAvatar,
} from '#src/database/player';

import {
  createToken,
  findToken,
  validateToken,
  renewToken,
  deleteAllPlayerTokens,
} from '#src/database/token';


import { Unauthorized } from '#src/error-handler';

import {
  generateToken,
  checkPassword,
  hashPassword,
  addHoursToDatetime,
} from '#src/utils';


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

const tokenHeader = {
  type: 'object',
  properties: {
    'x-token': { 'type': 'string' },
  },
  required: ['x-token'],
};

const Player = {
  type: 'object',
  properties: {
    Playerid: { type: 'integer' },
    username: { type: 'string' },
    registration_date: { type: 'string' },
    total_games_played: { type: 'integer' },
    total_time_spent: { type: 'integer' },
    world_score: { type: 'integer' },
    europe_score: { type: 'integer' },
    asia_score: { type: 'integer' },
    usa_score: { type: 'integer' },
    africa_score: { type: 'integer' },
    avatar: { type: 'string' },
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

const gameResultOpts = {
  schema: {
    headers: tokenHeader,
    body: {
      type: 'object',
      required: ['region', 'score', 'timeSpent'],
      properties: {
        region: { type: 'string' },
        score: { type: 'number' },
        timeSpent: { type: 'integer' },
      },
    },
    response: { 201: statusMessage },
  },
};

const updateAvatarOpts = {
  schema: {
    headers: tokenHeader,

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

  fastify.get(
    '/players/currentPlayer',
    getCurrentPlayerOpts,
    async (req, reply) => {
      const token = req.headers['x-token'];

      const tokenRecord = await findToken(token);
      const player = await findPlayer(tokenRecord.creator_id, 'id');

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
    '/players/gameResult',
    gameResultOpts,
    async (req, reply) => {
      const token = req.headers['x-token'];
      await validateToken(token);

      const { score, region, timeSpent } = req.body;

      const tokenRecord = await findToken(token);
      await saveGameResult(tokenRecord.creator_id, score, region, timeSpent);

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
