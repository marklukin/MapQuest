'use strict';

class NotFoundException extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}

class AlredyExists extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}

class InvalidToken extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, InvalidToken.prototype);
  }
}

class TokenExpired extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, InvalidToken.prototype);
  }
}

const errorHandler = (err, req, reply) => {
  if (err instanceof NotFoundException) {
    return reply.code(404).send({ error: err.message });
  }

  if (err instanceof AlredyExists) {
    return reply.code(409).send({ error: err.message });
  }

  if (err instanceof InvalidToken) {
    return reply.code(401).send({ error: err.message });
  }

  if (err instanceof TokenExpired) {
    return reply.code(401).send({ error: err.message });
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
  AlredyExists,
  InvalidToken,
  TokenExpired,
  errorHandler,
};
