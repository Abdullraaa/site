
/*
  CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
*/

const db = require('../config/db');

class User {
  static create(newUser) {
    let sql = `INSERT INTO users (email, password) VALUES (?, ?);`;
    return db.execute(sql, [newUser.email, newUser.password]);
  }

  static findByEmail(email) {
    let sql = `SELECT * FROM users WHERE email = ?;`;
    return db.execute(sql, [email]);
  }
}

module.exports = User;
