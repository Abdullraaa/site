"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const db_1 = require("../db");
async function up() {
    console.log('Clearing existing products and seeding new 5-item collection...');
    // Clear existing products
    await db_1.pool.query('DELETE FROM products');
    // Seed new products: Cap, Crop Top, Sweats, Hoodie (single color each), T-Shirt (Black & White)
    const products = [
        // Cap - Black only
        { sku: 'UN-CAP-BLK', title: 'TRIANGLE CAP', slug: 'triangle-cap-black', price: 35.00, description: 'Six-panel cap with embroidered triangle logo. Adjustable strap for perfect fit.', image_url: '/images/products/black-cap.jpg', color: 'Black', category: 'Caps' },
        // Crop Top - White only
        { sku: 'UN-CROP-WHT', title: 'SQUARE CROP TOP', slug: 'square-crop-white', price: 40.00, description: 'Minimalist crop top with geometric square design. Made from soft organic cotton blend.', image_url: '/images/products/square-tee.jpg', color: 'White', category: 'Tops' },
        // Sweats - Black only
        { sku: 'UN-SWEAT-BLK', title: 'ESSENTIAL SWEATS', slug: 'essential-sweats-black', price: 65.00, description: 'Relaxed fit sweatpants with tapered leg. Premium heavyweight cotton fleece.', image_url: '/images/products/black-tee.jpg', color: 'Black', category: 'Bottoms' },
        // Hoodie - Gray only
        { sku: 'UN-HOOD-GRY', title: 'CIRCLE HOODIE', slug: 'circle-hoodie-gray', price: 75.00, description: 'Oversized hoodie featuring a bold circle motif. Crafted from premium French terry cotton.', image_url: '/images/products/gray-hoodie.jpg', color: 'Gray', category: 'Hoodies' },
        // T-Shirt - Black & White
        { sku: 'UN-TEE-BLK', title: 'ESSENTIAL TEE', slug: 'essential-tee-black', price: 45.00, description: 'Classic unisex t-shirt with minimalist design. Made from 100% organic cotton.', image_url: '/images/products/black-tee.jpg', color: 'Black', category: 'T-Shirts' },
        { sku: 'UN-TEE-WHT', title: 'ESSENTIAL TEE', slug: 'essential-tee-white', price: 45.00, description: 'Classic unisex t-shirt with minimalist design. Made from 100% organic cotton.', image_url: '/images/products/square-tee.jpg', color: 'White', category: 'T-Shirts' }
    ];
    for (const p of products) {
        await db_1.pool.query('INSERT INTO products (sku, title, slug, description, price, image_url, color, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [p.sku, p.title, p.slug, p.description, p.price, p.image_url, p.color, p.category, 100]);
    }
    console.log(`✅ Seeded ${products.length} products (4 single-color + 1 with B&W options)`);
}
async function down() {
    console.log('Rolling back product seed...');
    await db_1.pool.query('DELETE FROM products');
}
