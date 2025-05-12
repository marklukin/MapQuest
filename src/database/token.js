'use strict';

const { db } = require('./connection');

const { RecordNotFound } = require('../error-handler');

const playerTokenExists = (token) => {
  const record = db.prepare(`
    SELECT COUNT(*) AS count FROM Tokens WHERE token = ?
  `);

  const count = record.get(token).count;
  if (count) return true;
  else return false;
};

const createToken = (
  token,
  tokenExpireDate,
  creatorId,
) => {
  const query = db.prepare(`
    INSERT INTO Tokens
    (token, token_expire_date, creator_id)
    VALUES(?, ?, ?)
  `);

  query.run(token, tokenExpireDate, creatorId);
};

const findToken = (token) => {
  const exists = playerTokenExists(token);
  if (!exists) {
    throw new RecordNotFound(`Player token don't exist`);
  }

  const query = db.prepare(`
    SELECT * FROM Tokens
    WHERE token = ?
  `);

  const record = query.get(token);

  return record;
};

const renewTokenExpireDate = (playerId, newToken, newExpireDate) => {
  const query = db.prepare(`
    UPDATE Tokens
    SET token = ?, token_expire_date = ? 
    WHERE creator_id = ?
  `);

  query.run(newToken, newExpireDate, playerId);
};

const deleteAllPlayerTokens = (playerId) => {
  const query = db.prepare(`
    DELETE FROM Tokens
    WHERE creator_id = ?
  `);

  query.run(playerId);
};

module.exports = {
  createToken,
  findToken,
  renewTokenExpireDate,
  deleteAllPlayerTokens,
};
