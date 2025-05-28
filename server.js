import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

import { playerRoutes } from './src/routes/players.js';
import { errorHandler } from './src/error-handler.js';

import { createDatabase, dbQueue } from './src/database/connection.js';

import { fastifyStatic } from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { fastifyCookie } from '@fastify/cookie';
import 'dotenv/config';

const port = process.env.PORT;
if (!port) {
  console.error('Missing port option in .env');
  process.exit(1);
}

const hostname = process.env.HOSTNAME;
if (!hostname) {
  console.error('Missing hostname option in .env');
  process.exit(1);
}

fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
});

fastify.register(fastifyCookie, {
  hook: 'onRequest',
  parseOptions: {},
});

fastify.setErrorHandler(errorHandler);
fastify.register(playerRoutes, { prefix: 'api/v1' });

const start = async () => {
  dbQueue.start();
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  createDatabase();
};

start();
