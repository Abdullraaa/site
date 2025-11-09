import { pool } from '../db'

export async function up() {
  // Replace products with curated set (cap, sweats, armless, tees black/white, crop-top)
  await pool.query('SET FOREIGN_KEY_CHECKS = 0')
  await pool.query('DELETE FROM product_images')
  await pool.query('DELETE FROM reviews')
  await pool.query('DELETE FROM products')
  await pool.query('SET FOREIGN_KEY_CHECKS = 1')

  const products = [
    { sku: 'UN-100', title: 'CAP', slug: 'cap', price: 35.0, description: 'Breathable mesh cap with tonal embroidery.', image_url: '/images/products/triangle-cap.jpg', color: 'Black', category: 'Accessories' },
    { sku: 'UN-200', title: 'SWEATS', slug: 'sweats', price: 65.0, description: 'Relaxed fit heavyweight sweats with minimal branding.', image_url: '/images/products/gray-hoodie.jpg', color: 'Gray', category: 'Bottoms' },
    { sku: 'UN-300', title: 'ARMLESS', slug: 'armless', price: 30.0, description: 'Sleeveless tank with clean neckline and premium cotton.', image_url: '/images/products/white-hoodie.jpg', color: 'White', category: 'Tops' },
    { sku: 'UN-400B', title: 'TEE — BLACK', slug: 'tee-black', price: 40.0, description: 'Essential black tee in heavyweight jersey.', image_url: '/images/products/black-tee.jpg', color: 'Black', category: 'T-Shirts' },
    { sku: 'UN-400W', title: 'TEE — WHITE', slug: 'tee-white', price: 40.0, description: 'Essential white tee in heavyweight jersey.', image_url: '/images/products/square-tee.jpg', color: 'White', category: 'T-Shirts' },
    { sku: 'UN-500', title: 'CROP TOP', slug: 'crop-top', price: 32.0, description: 'Cropped top with tight rib and clean finish.', image_url: '/images/products/circle-hoodie.jpg', color: 'Black', category: 'Tops' }
  ]

  for (const p of products) {
    await pool.query(
      'INSERT INTO products (sku, title, slug, description, price, image_url, color, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.sku, p.title, p.slug, p.description, p.price, p.image_url, p.color, p.category, 100]
    )
  }
}


