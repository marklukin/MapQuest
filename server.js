'use strict';

const fastify = require('fastify')({ logger: true });
const path = require('node:path');
const result = require('dotenv').config();
if (result.error) {
  throw result.error;
}

const config = result.parsed;

const port = config.PORT;
if (!port) {
  console.error('missing port option in .env');
  process.exit(1);
}

const host = config.HOSTNAME;
if (!host) {
  console.error('missing port option in .env');
  process.exit(1);
}

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'frontend'),
});

fastify.listen({ port, host }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
