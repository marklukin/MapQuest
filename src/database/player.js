import { db, dbQueue } from './connection.js';
import { RecordNotFound, RecordAlreadyExists } from '../error-handler.js';

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

const createPlayer = async (username, password) => {
  const exists = await playerExists(username);
  if (exists) {
    throw new RecordAlreadyExists(
      `Player with username: ${username} alredy exists`,
    );
  }
  
  const curDatetimeString = new Date().toISOString();
  const registrationDate = curDatetimeString.split('T')[0];

  await dbQueue.put(() => {
    const record = db.prepare(`
      INSERT INTO Players 
      (username, password_hash, password_salt, registration_date) 
      VALUES(?, ?, ?, ?)
    `);

    record.run(username, password.hash, password.salt, registrationDate);
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

const saveGameResult = async (playerId, score, region, timeSpent) => {
  const player = await findPlayer(playerId, 'id');

  const newScore = player[`${region}_score`] + score;
  const totalGamesPlayed = player.total_games_played + 1;
  const totalTimeSpent = player.total_time_spent + timeSpent;

  await dbQueue.put(() => {
    const record = db.prepare(`
      UPDATE Players
      SET ${region}_score = ?, total_time_spent = ?, total_games_played = ?
      WHERE id = ?
    `);

    record.run(newScore, totalTimeSpent, totalGamesPlayed, playerId);
  });
};

const updateAvatar = async (newAvatar, playerId) => {
  await dbQueue.put(() => {
    const record = db.prepare(`
      UPDATE Players
      SET avatar = ?
      WHERE id = ?
    `);

    record.run(newAvatar, playerId);
  });
}

const changePassword = async (newPassword, username) => {
  await dbQueue.put(() => {
    const record = db.prepare(`
      UPDATE Players
      SET password_hash = ?, password_salt = ?
      WHERE username = ?
    `);

    record.run(newPassword.hash, newPassword.salt, username);
  });
};

const changeUsername = async (newUsername, value, username) => {
  await dbQueue.put(() => {
    const record = db.prepare(`
      UPDATE Players
      SET username = ?
      WHERE username = ?
    `);

    record.run(newUsername, username);
  });
};

export {
  createPlayer,
  deletePlayer,
  findPlayer,
  changePassword,
  changeUsername,
  saveGameResult,
  updateAvatar,
};
