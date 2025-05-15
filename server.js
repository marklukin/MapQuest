'use strict';

const fastify = require('fastify')({ logger: true });
const path = require('node:path');

const { errorHandler } = require('./src/error-handler');
const { createDatabase, dbQueue } = require('./src/database/connection');

const result = require('dotenv').config();
if (result.error) {
  throw result.error;
}

const config = result.parsed;

const port = config.PORT;
if (!port) {
  console.error('Missing port option in .env');
  process.exit(1);
}

const hostname = config.HOSTNAME;
if (!hostname) {
  console.error('Missing hostname option in .env');
  process.exit(1);
}

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
});

fastify.setErrorHandler(errorHandler);
fastify.register(require('./src/routes/players'),
  { prefix: 'api/v1' },
);

const start = async () => {
  dbQueue.process();
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  createDatabase();
};

start();

// fastify.listen({ port, hostname }, async (err, address) => {
//   await createDatabase();
//
//   if (err) {
//     fastify.log.error(err);
//     process.exit(1);
//   }
//   await dbQueue.process();
// });
