import { db, dbQueue } from './connection.js';
import { RecordNotFound, Unauthorized } from '../error-handler.js';

const createToken = async (
  token,
  tokenExpireDate,
  creatorId,
) => {
  await dbQueue.put(() => {
    const query = db.prepare(`
      INSERT INTO Tokens
      (token, expire, creator_id)
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

const renewToken = async (playerId, newToken, newExpireDate) => {
  await dbQueue.put(() => {
    const query = db.prepare(`
      UPDATE Tokens
      SET token = ?, expire = ? 
      WHERE creator_id = ?
    `);

    query.run(newToken, newExpireDate, playerId);
  });
};

const validateToken = async (token) => {
  const tokenRecord = await findToken(token);
  const tokenExpireDate = Date.parse(tokenRecord.expire);

  if (Date.now() > tokenExpireDate) {
    throw new Unauthorized('Token is expired');
  }
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
  validateToken,
  renewToken,
  deleteAllPlayerTokens,
};
