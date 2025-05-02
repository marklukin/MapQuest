'use strict';

class NotFoundException extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}

const errorHandler = (err, req, reply) => {
  if (err instanceof NotFoundException) {
    return reply.code(404).send({ error: err.message });
  }

  reply.log.error({
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
    },
    err,
  }, 'Unhandled error occured.');

  return reply.code(500).send(err.message);
};

module.exports = {
  NotFoundException,
  errorHandler,
};
