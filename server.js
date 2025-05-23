import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { playerRoutes } from './src/routes/players.js';
import { errorHandler } from './src/error-handler.js';
import { fastifyStatic } from '@fastify/static';

import { createDatabase, dbQueue } from './src/database/connection.js';

import 'dotenv/config';

const port = process.env.PORT;
if (!port) {
  console.error('Missing port option in .env');
}

const hostname = process.env.HOSTNAME;
if (!hostname) {
  console.error('Missing hostname option in .env');
  process.exit(1);
}

fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
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
