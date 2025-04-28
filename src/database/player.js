'use strict';

const { db } = require('./connection');

const playerExists = (username) => {
  const record = db.prepare(`
    SELECT COUNT(*) AS count FROM Players WHERE username = ?
  `);

  const count = record.get(username).count;
  if (count) return true;
  else return false;
};

const createPlayer = (username, hashedPassword) => {
  if (playerExists(username)) throw new Error('User is exist');

  const record = db.prepare(`
    INSERT INTO Players 
    (username, hashed_password) 
    VALUES(?, ?)
  `);

  record.run(username, hashedPassword);
};

const findPlayerByUsername = (username) => {
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
