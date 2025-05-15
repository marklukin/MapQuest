'use strict';

const { db, dbQueue } = require('./connection');
const {
  RecordNotFound,
  RecordAlreadyExists,
} = require('../error-handler');

const playerExists = async (value, field = 'username') => {
  const count = await dbQueue.put(() => {
    const record = db.prepare(`
      SELECT COUNT(*) AS count FROM Players WHERE ${field} = ?
    `);

    return record.get(value).count;
  });

  if (count) return true;
  else return false;
};

const createPlayer = async (
  username,
  password,
) => {
  const exists = await playerExists(username);
  if (exists) {
    throw new RecordAlreadyExists(
      `Player with username: ${username} alredy exists`,
    );
  }

  await dbQueue.put(() => {
    const record = db.prepare(`
      INSERT INTO Players 
      (username, password_hash, password_salt) 
      VALUES(?, ?, ?)
    `);

    record.run(username, password.hash, password.salt);
  });
};


const deletePlayer = async (username) => {
  const exists = await playerExists(username);
  if (!exists) {
    throw new RecordNotFound(`Player with username: ${username} not found`);
  }

  await dbQueue.put(() => {
    const record = db.prepare(`
      DELETE FROM Players
      WHERE username = ?
    `);

    record.run(username);
  });
};

const findPlayer = async (value, field = 'username') => {
  const exists = await playerExists(value, field);
  if (!exists) {
    throw new RecordNotFound(`Player with ${field}: ${value} not found`);
  }

  const player = await dbQueue.put(() => {
    const record = db.prepare(`
      SELECT * FROM Players WHERE ${field} = ?
    `);

    return record.get(value);
  });

  return player;
};

module.exports = {
  createPlayer,
  deletePlayer,
  findPlayer,
};
