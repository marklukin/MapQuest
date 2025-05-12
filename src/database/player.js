'use strict';

const { db } = require('./connection');
const {
  RecordNotFound,
  RecordAlreadyExists,
} = require('../error-handler');

const playerExists = (value, field = 'username') => {
  const record = db.prepare(`
    SELECT COUNT(*) AS count FROM Players WHERE ${field} = ?
  `);

  const count = record.get(value).count;
  if (count) return true;
  else return false;
};

const createPlayer = (
  username,
  password,
) => {
  const exists = playerExists(username);
  if (exists) {
    throw new RecordAlreadyExists(
      `Player with username: ${username} alredy exists`,
    );
  }
  const record = db.prepare(`
    INSERT INTO Players 
    (username, password_hash, password_salt) 
    VALUES(?, ?, ?)
  `);

  record.run(username, password.hash, password.salt);
};


const deletePlayer = (username) => {
  const exists = playerExists(username);
  if (!exists) {
    throw new RecordNotFound(`Player with username: ${username} not found`);
  }

  const record = db.prepare(`
    DELETE FROM Players
    WHERE username = ?
  `);

  record.run(username);
};

const findPlayer = (value, field = 'username') => {
  const exists = playerExists(value, field);
  if (!exists) {
    throw new RecordNotFound(`Player with ${field}: ${value} not found`);
  }

  const record = db.prepare(`
    SELECT * FROM Players WHERE ${field} = ?
  `);

  const player = record.get(value);

  return player;
};

module.exports = {
  createPlayer,
  deletePlayer,
  findPlayer,
};
