"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
const db_1 = require("../db");
async function up() {
    // Replace products with curated set (cap, sweats, armless, tees black/white, crop-top)
    await db_1.pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await db_1.pool.query('DELETE FROM product_images');
    await db_1.pool.query('DELETE FROM reviews');
    await db_1.pool.query('DELETE FROM products');
    await db_1.pool.query('SET FOREIGN_KEY_CHECKS = 1');
    const products = [
        { sku: 'UN-100', title: 'CAP', slug: 'cap', price: 35.0, description: 'Breathable mesh cap with tonal embroidery.', image_url: '/images/products/triangle-cap.jpg', color: 'Black', category: 'Accessories' },
        { sku: 'UN-200', title: 'US Crest Motion Pant', slug: 'US Crest Motion Pant', price: 65.0, description: 'Relaxed fit heavyweight sweats with minimal branding.', image_url: '/images/products/US Crest Motion Pant2.png', color: 'Multi', category: 'Bottoms' },
        { sku: 'UN-300', title: 'US Effort Sleeveless Tee', slug: 'US Effort Sleeveless Tee', price: 30.0, description: 'Sleeveless tank with clean neckline and premium cotton.', image_url: '/images/products/white-hoodie.jpg', color: 'White', category: 'Tops' },
        { sku: 'UN-400', title: 'US Logo Tee', slug: 'US Logo Tee', price: 40.0, description: 'Essential tee in heavyweight jersey.', image_url: '/images/products/Black_Tee.png', color: 'Black & White', category: 'T-Shirts' },
        { sku: 'UN-500', title: 'US PGNL Crop Top', slug: 'US PGNL Crop Top', price: 32.0, description: 'Cropped top with tight rib and clean finish.', image_url: '/images/products/Crop_T.png', color: 'Multi', category: 'Tops' }
    ];
    for (const p of products) {
        await db_1.pool.query('INSERT INTO products (sku, title, slug, description, price, image_url, color, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [p.sku, p.title, p.slug, p.description, p.price, p.image_url, p.color, p.category, 100]);
    }
}
