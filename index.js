'use strict';

const http = require('node:http');
const fs = require('node:fs');

const hostname = '127.0.0.1';
const port = 8000;

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
