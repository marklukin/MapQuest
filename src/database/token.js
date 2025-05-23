import { db, dbQueue } from './connection.js';
import { RecordNotFound } from '../error-handler.js';

const tokenExists = async (token) => {
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
  const tokenRecord = await dbQueue.put(() => {
    const query = db.prepare(`
      SELECT * FROM Tokens
      WHERE token = ?
    `);

    return query.get(token);
  });

  if (!tokenRecord) {
    throw new RecordNotFound(`The token doesn't exist`);
  }

  return tokenRecord;
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

export {
  createToken,
  findToken,
  renewTokenExpireDate,
  deleteAllPlayerTokens,
  tokenExists,
};
