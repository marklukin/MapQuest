'use strict';

class AppException extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode || 500;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class RecordNotFound extends AppException {
  constructor(message) {
    super(message, 404);
  }
};

class RecordAlreadyExists extends AppException {
  constructor(message) {
    super(message, 409);
  }
};

class InvalidToken extends AppException {
  constructor(message) {
    super(message, 401);
  }
};

class TokenExpired extends AppException {
  constructor(message) {
    super(message, 401);
  }
};

const errorHandler = (err, req, reply) => {
  if (err instanceof AppException) {
    return reply.code(err.statusCode).send({ error: err.message });
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
  RecordNotFound,
  RecordAlreadyExists,
  InvalidToken,
  TokenExpired,
  errorHandler,
};
