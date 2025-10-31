
/*
  CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(255) DEFAULT 'pending',
    whatsapp_link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
*/

const db = require('../config/db');

class Order {
  static create(newOrder) {
    let sql = `INSERT INTO orders (user_id, total_price, whatsapp_link) VALUES (?, ?, ?);`;
    return db.execute(sql, [newOrder.user_id, newOrder.total_price, newOrder.whatsapp_link]);
  }
}

module.exports = Order;
