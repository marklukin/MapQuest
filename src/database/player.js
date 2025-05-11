'use strict';

const { db } = require('./connection');
const {
  RecordNotFound,
  RecordAlreadyExists,
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
) => {
  const exists = playerExists(username);
  if (exists) {
    throw new RecordAlreadyExists(
      `User with username ${username} is alredy exists`,
    );
  }
  const record = db.prepare(`
    INSERT INTO Players 
    (username, password_hash, password_salt) 
    VALUES(?, ?, ?)
  `);

  record.run(username, password.hash, password.salt);
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

const deletePlayer = (username) => {
  const exists = playerExists(username);
  if (!exists) {
    throw new RecordNotFound(`User with username ${username} is not found`);
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
    throw new RecordNotFound(`User with username ${username} is not found`);
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
};
