'use strict';

const indexRouter = async () => {
  const { readFile } = require('node:fs/promises');
  const data = await readFile('./public/index.html', { encoding: 'utf8' });
  const contentType = 'text/html';

  return {
    contentType,
    data,
  };
};

const routing = {
  '/': indexRouter,
};

module.exports = { routing };
