'use strict';

const { db, dbQueue } = require('./connection');
const {
  RecordNotFound,
  RecordAlreadyExists,
} = require('../error-handler');

const playerExists = async (value, field = 'username') => {
  const record = await dbQueue.put(() => {
    const record = db.prepare(`
      SELECT * FROM Players WHERE ${field} = ?
    `);

    return record.get(value);
  });

  if (record) return true;
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
  await dbQueue.put(() => {
    const record = db.prepare(`
      DELETE FROM Players
      WHERE username = ?
    `);

    record.run(username);
  });
};

const findPlayer = async (value, field = 'username') => {
  const player = await dbQueue.put(() => {
    const record = db.prepare(`
      SELECT * FROM Players WHERE ${field} = ?
    `);

    return record.get(value);
  });

  if (!player) {
    throw new RecordNotFound(`Player with ${field}: ${value} not found`);
  }

  return player;
};


const changePassword = async (newPassword, value, field = 'username') => {
  await dbQueue.put(() => {
    const record = db.prepare(`
      UPDATE Players
      SET password_hash = ?, password_salt = ?
      WHERE ${field} = ?
    `);

    record.run(newPassword.hash, newPassword.salt, value);
  });
};

const changeUsername = async (newUsername, value, field = 'username') => {
  await dbQueue.put(() => {
    const record = db.prepare(`
      UPDATE Players
      SET username = ?
      WHERE ${field} = ?
    `);

    record.run(newUsername, value);
  });
};


module.exports = {
  createPlayer,
  deletePlayer,
  findPlayer,
  changePassword,
  changeUsername,
};
