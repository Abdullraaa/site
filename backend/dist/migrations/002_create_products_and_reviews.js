"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
const db_1 = require("../db");
async function up() {
    // products table
    await db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT PRIMARY KEY AUTO_INCREMENT,
      sku VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      image_url VARCHAR(512),
      color VARCHAR(50),
      category VARCHAR(100),
      stock INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
    // product_images (optional)
    await db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id INT PRIMARY KEY AUTO_INCREMENT,
      product_id INT NOT NULL,
      url VARCHAR(512) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);
    // reviews table
    await db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT PRIMARY KEY AUTO_INCREMENT,
      product_id INT NOT NULL,
      user_id INT,
      rating TINYINT NOT NULL DEFAULT 5,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);
    // Seed sample products if table empty
    const [rows] = await db_1.pool.query(`SELECT COUNT(*) as cnt FROM products`);
    const cnt = rows[0]?.cnt ?? 0;
    if (cnt === 0) {
        console.log('Seeding sample products...');
        const sample = [
            { sku: 'UN-001', title: 'SQUARE TEE', slug: 'square-tee', price: 45.00, description: 'Minimalist unisex t-shirt with geometric square design. Made from 100% organic cotton.', image_url: '/images/products/square-tee.jpg', color: 'Black', category: 'T-Shirts' },
            { sku: 'UN-001B', title: 'SQUARE TEE', slug: 'black-tee', price: 45.00, description: 'Minimalist unisex t-shirt with geometric square design. Made from 100% organic cotton.', image_url: '/images/products/black-tee.jpg', color: 'Black', category: 'T-Shirts' },
            { sku: 'UN-002', title: 'CIRCLE HOODIE', slug: 'circle-hoodie', price: 75.00, description: 'Oversized hoodie featuring a bold circle motif. Crafted from premium French terry cotton.', image_url: '/images/products/circle-hoodie.jpg', color: 'Gray', category: 'Hoodies' },
            { sku: 'UN-002W', title: 'CIRCLE HOODIE', slug: 'white-hoodie', price: 75.00, description: 'Oversized hoodie featuring a bold circle motif. Crafted from premium French terry cotton.', image_url: '/images/products/white-hoodie.jpg', color: 'White', category: 'Hoodies' },
            { sku: 'UN-002G', title: 'CIRCLE HOODIE', slug: 'gray-hoodie', price: 75.00, description: 'Oversized hoodie featuring a bold circle motif. Crafted from premium French terry cotton.', image_url: '/images/products/gray-hoodie.jpg', color: 'Gray', category: 'Hoodies' },
            { sku: 'UN-003', title: 'TRIANGLE CAP', slug: 'triangle-cap', price: 35.00, description: 'Six-panel cap with embroidered triangle logo. Adjustable strap for perfect fit.', image_url: '/images/products/triangle-cap.jpg', color: 'White', category: 'Accessories' },
            { sku: 'UN-003B', title: 'TRIANGLE CAP', slug: 'black-cap', price: 35.00, description: 'Six-panel cap with embroidered triangle logo. Adjustable strap for perfect fit.', image_url: '/images/products/black-cap.jpg', color: 'Black', category: 'Accessories' },
            { sku: 'UN-003W', title: 'TRIANGLE CAP', slug: 'white-cap', price: 35.00, description: 'Six-panel cap with embroidered triangle logo. Adjustable strap for perfect fit.', image_url: '/images/products/white-cap.jpg', color: 'White', category: 'Accessories' }
        ];
        for (const p of sample) {
            await db_1.pool.query('INSERT INTO products (sku, title, slug, description, price, image_url, color, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [p.sku, p.title, p.slug, p.description, p.price, p.image_url, p.color, p.category, 100]);
        }
    }
}
