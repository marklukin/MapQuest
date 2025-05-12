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

const findPlayer = (value, field = 'username') => {
  const exists = playerExists(value, field);
  if (!exists) {
    throw new RecordNotFound(`User with ${field} ${value} is not found`);
  }

  const record = db.prepare(`
    SELECT * FROM Players WHERE ${field} = ?
  `);

  const user = record.get(value);

  return user;
};

module.exports = {
  createPlayer,
  deletePlayer,
  findPlayer,
};
