'use strict';

const http = require('node:http');
const fs = require('node:fs');

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

const index = (req, resp) => {
  fs.readFile('./public/index.html', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    };
    resp.writeHead(200, { 'Content-Type': 'text/html' });
    resp.write(data);
    resp.end();
  });
};

const server = http.createServer((req, resp) => {
  if (req.url === '/') index(req, resp);
});

server.listen(port, hostname, () => {
  console.log(`Server has started at http://${hostname}:${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.log(`No access to port: ${port}`);
  }
});
