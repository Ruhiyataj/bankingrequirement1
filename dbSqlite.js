const Database = require('better-sqlite3');
const path = require('path');

// Create SQLite database
const db = new Database(path.join(__dirname, 'kodbank.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS kodusers (
    uid INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    balance REAL DEFAULT 100000.00,
    phone TEXT NOT NULL,
    role TEXT DEFAULT 'Customer'
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS CJWT (
    tid INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    uid INTEGER NOT NULL,
    exparity TEXT NOT NULL,
    FOREIGN KEY (uid) REFERENCES kodusers(uid) ON DELETE CASCADE
  )
`);

console.log('✓ SQLite database initialized successfully');

module.exports = db;
