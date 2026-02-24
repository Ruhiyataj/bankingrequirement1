const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "mysql-1eeed505-ruhiyashameer11-d395.l.aivencloud.com",
  port: 25362,
  user: "avnadmin",
  password: "YOUR_PASSWORD_HERE",
  database: "defaultdb",

  ssl: {
    rejectUnauthorized: false   // ⭐ REQUIRED FOR AIVEN
  }
});

module.exports = pool.promise();