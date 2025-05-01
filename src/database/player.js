'use strict';

const { db } = require('./connection');
const { NotFoundException } = require('../controllers/error-handler');

const playerExists = (username) => {
  const record = db.prepare(`
    SELECT COUNT(*) AS count FROM Players WHERE username = ?
  `);

  const count = record.get(username).count;
  if (count) return true;
  else return false;
};

const handleNotFound = (username) => {
  const exists = playerExists(username);
  if (!exists) {
    throw new NotFoundException(`User with username ${username} is not found`);
  }
};

const createPlayer = (username, hashedPassword) => {
  const record = db.prepare(`
    INSERT INTO Players 
    (username, hashed_password) 
    VALUES(?, ?)
  `);

  record.run(username, hashedPassword);
};

const findPlayerByUsername = (username) => {
  handleNotFound(username);
  const record = db.prepare(`
    SELECT * FROM Players WHERE username = ?
  `);

  const user = record.get(username);

  return user;
};

module.exports = {
  createPlayer,
  findPlayerByUsername,
};
