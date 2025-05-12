'use strict';

const { db } = require('./connection');
const {
  RecordNotFound,
  RecordAlreadyExists,
} = require('../error-handler');

const playerExists = (field = 'username', value) => {
  const record = db.prepare(`
    SELECT COUNT(*) AS count FROM Players WHERE ? = ?
  `);

  const count = record.get(field, value).count;
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
};
