const pool = require('./db');

async function initDatabase() {
  try {
    // Create kodusers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kodusers (
        uid INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        balance DECIMAL(10, 2) DEFAULT 100000.00,
        phone VARCHAR(15) NOT NULL,
        role ENUM('Customer', 'Manager', 'Admin') DEFAULT 'Customer'
      )
    `);

    // Create CJWT table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS CJWT (
        tid INT PRIMARY KEY AUTO_INCREMENT,
        token TEXT NOT NULL,
        uid INT NOT NULL,
        exparity DATETIME NOT NULL,
        FOREIGN KEY (uid) REFERENCES kodusers(uid) ON DELETE CASCADE
      )
    `);

    console.log('Database tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

initDatabase();
