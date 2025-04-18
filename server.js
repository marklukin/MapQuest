'use strict';

const http = require('node:http');
const routers = require('./src/routers.js');

const result = require('dotenv').config();
if (result.error) {
  throw result.error;
}

const config = result.parsed;

const port = config.PORT;
if (!port) {
  throw new Error('Missing port option in .env');
}

const hostname = config.HOSTNAME;
if (!hostname) {
  throw new Error('Missing hostname option in .env');
}

const server = http.createServer(async (req, resp) => {
  const router = routers.routing[req.url];

  if (!router) {
    resp.statusCode = 404;
    resp.end('Not found');
    return;
  }

  const result = await router(req, resp);

  resp.setHeader('Content-Type', result.contentType);
  resp.write(result.data, 'utf8');
  resp.end();
});

server.listen(port, hostname, () => {
  console.log(`Server has started at http://${hostname}:${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.log(`No access to port: ${port}`);
  }
});
