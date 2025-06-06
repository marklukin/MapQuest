import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('./database.db');

import { TaskQueue } from '../queue.js';
const dbQueue = new TaskQueue();

const createDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Players(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      avatar TEXT,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      registration_date TEXT NOT NULL,
      total_time_spent INTEGER DEFAULT 0,
      total_games_played INTEGER DEFAULT 0,
      world_score INTEGER DEFAULT 0,
      europe_score INTEGER DEFAULT 0,
      asia_score INTEGER DEFAULT 0,
      usa_score INTEGER DEFAULT 0,
      africa_score INTEGER DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS Tokens(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL,
      expire TEXT NOT NULL,
      creator_id INTEGER NOT NULL,
      FOREIGN KEY(creator_id) REFERENCES Players(id)
    )
  `);
};

export {
  db,
  dbQueue,
  createDatabase,
};
