'use strict';

const { db } = require('./connection');
const {
  NotFoundException,
  AlredyExists,
  InvalidToken,
  TokenExpired,
} = require('../error-handler');

const playerExists = (username) => {
  const record = db.prepare(`
    SELECT COUNT(*) AS count FROM Players WHERE username = ?
  `);

  const count = record.get(username).count;
  if (count) return true;
  else return false;
};

const tokenExists = (token) => {
  const record = db.prepare(`
    SELECT COUNT(*) AS count FROM Players WHERE token = ?
  `);

  const tokenExists = record.get(token).count;
  if (tokenExists) return true;
  else return false;
};

const createPlayer = (
  username,
  password,
  token,
  tokenExpireDate,
) => {
  const exists = playerExists(username);
  if (exists) {
    throw new AlredyExists(`User with username ${username} is alredy exists`);
  }
  const record = db.prepare(`
    INSERT INTO Players 
    (username, password_hash, password_salt, token, token_expire_date) 
    VALUES(?, ?, ?, ?, ?)
  `);

  record.run(username, password.hash, password.salt, token, tokenExpireDate);
};

const findPlayerByToken = (token) => {
  const exists = tokenExists(token);
  if (!exists) {
    throw new InvalidToken(`Token is invalid`);
  }
  const record = db.prepare(`
    SELECT * FROM Players
    WHERE token = ?
  `);

  const user = record.get(token);
  const tokenExpireDate = Date.parse(user.token_expire_date);
  const today = new Date();

  if (today > tokenExpireDate) {
    throw new TokenExpired(`Token is expired`);
  }

  return user;
};

const updateUserToken = (oldToken, newToken, tokenExpireDate) => {
  const exists = tokenExists(oldToken);
  if (!exists) {
    throw new InvalidToken(`Token is invalid`);
  }
  const record = db.prepare(`
    UPDATE Players
    SET token = ?, token_expire_date = ?
    WHERE token = ?
  `);

  record.run(newToken, tokenExpireDate, oldToken);
};

const deletePlayer = (username) => {
  const exists = playerExists(username);
  if (!exists) {
    throw new NotFoundException(`User with username ${username} is not found`);
  }

  const record = db.prepare(`
    DELETE FROM Players
    WHERE username = ?
  `);

  record.run(username);
};

const findPlayerByUsername = (username) => {
  const exists = playerExists(username);
  if (!exists) {
    throw new NotFoundException(`User with username ${username} is not found`);
  }

  const record = db.prepare(`
    SELECT * FROM Players WHERE username = ?
  `);

  const user = record.get(username);

  return user;
};

module.exports = {
  createPlayer,
  deletePlayer,
  findPlayerByUsername,
  findPlayerByToken,
  updateUserToken,
};
