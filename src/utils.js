'use strict';

const crypto = require('node:crypto');

const generateToken = () => crypto.randomBytes(128).toString('hex');

const hashPassword = (password) => {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash =
    crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');

  return {
    salt,
    hash,
  };
};

const checkPassword = (password, hash, salt) => {
  const checkHash =
    crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');

  return hash === checkHash;
};

const addHoursToDatetime = (date, hours) => {
  const result = new Date(date.getTime());
  result.setTime(date.getTime() + hours * 3600 * 1000);
  return result;
};

module.exports = {
  hashPassword,
  checkPassword,
  generateToken,
  addHoursToDatetime,
};
