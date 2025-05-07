'use strict';

const { db } = require('./connection');
const { NotFoundException } = require('../error-handler');

const playerExists = (username) => {
  const record = db.prepare(`
    SELECT COUNT(*) AS count FROM Players WHERE username = ?
  `);

  const count = record.get(username).count;
  if (count) return true;
  else return false;
};

const createPlayer = (
  username,
  passwordHash,
  passwordSalt,
  token,
  tokenExpireDate,
) => {
  const record = db.prepare(`
    INSERT INTO Players 
    (username, password_hash, password_salt, token, token_expire_date) 
    VALUES(?, ?)
  `);

  record.run(username, passwordHash, passwordSalt, token, tokenExpireDate);
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
};
