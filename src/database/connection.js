'use strict';

const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('./database.db');

const createDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Players(
      Playerid INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      token TEXT NOT NULL,
      token_expire_date TEXT NOT NULL,
      world_score INTEGER DEFAULT 0,
      europe_score INTEGER DEFAULT 0,
      asia_score INTEGER DEFAULT 0,
      usa_score INTEGER DEFAULT 0
    )
  `);

  return db;
};

module.exports = {
  db,
  createDatabase,
};
