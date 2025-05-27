import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('./database.db');

import { TaskQueue } from '../queue.js';
const dbQueue = new TaskQueue();

const createDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Players(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      registration_date TEXT NOT NULL,
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
      token_expire_date TEXT NOT NULL,
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
