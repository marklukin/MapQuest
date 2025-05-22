'use strict';

const { db, dbQueue } = require('./connection');

const { RecordNotFound } = require('../error-handler');

const playerTokenExists = async (token) => {
  const record = await dbQueue.put(() => {
    const record = db.prepare(`
      SELECT * FROM Tokens WHERE token = ?
    `);

    return record.get(token);
  });

  if (record) return true;
  else return false;
};

const createToken = async (
  token,
  tokenExpireDate,
  creatorId,
) => {
  await dbQueue.put(() => {
    const query = db.prepare(`
      INSERT INTO Tokens
      (token, token_expire_date, creator_id)
      VALUES(?, ?, ?)
    `);

    query.run(token, tokenExpireDate, creatorId);
  });
};

const findToken = async (token) => {
  const exists = await playerTokenExists(token);
  if (!exists) {
    throw new RecordNotFound(`Player token doesn't exist`);
  }

  const record = await dbQueue.put(() => {
    const query = db.prepare(`
      SELECT * FROM Tokens
      WHERE token = ?
    `);

    return query.get(token);
  });

  return record;
};

const renewTokenExpireDate = async (playerId, newToken, newExpireDate) => {
  await dbQueue.put(() => {
    const query = db.prepare(`
      UPDATE Tokens
      SET token = ?, token_expire_date = ? 
      WHERE creator_id = ?
    `);

    query.run(newToken, newExpireDate, playerId);
  });
};

const deleteAllPlayerTokens = async (playerId) => {
  await dbQueue.put(() => {
    const query = db.prepare(`
      DELETE FROM Tokens
      WHERE creator_id = ?
    `);

    query.run(playerId);
  });
};

module.exports = {
  createToken,
  findToken,
  renewTokenExpireDate,
  deleteAllPlayerTokens,
};
