import { pool } from '../db'

export async function up() {
  // Replace products with curated set (cap, sweats, armless, tees black/white, crop-top)
  await pool.query('SET FOREIGN_KEY_CHECKS = 0')
  await pool.query('DELETE FROM product_images')
  await pool.query('DELETE FROM reviews')
  await pool.query('DELETE FROM products')
  await pool.query('SET FOREIGN_KEY_CHECKS = 1')

  const products = [
    { sku: 'UN-100', title: 'US Crest Motion Hoodie', slug: 'us-crest-motion-hoodie', price: 149000.0, description: 'Relaxed fit heavyweight sweats with minimal branding.', image_url: '/images/products/IMG_0570.png', color: 'Multi', category: 'Hoodie' },
    { sku: 'UN-200', title: 'US Crest Motion Pant', slug: 'US Crest Motion Pant', price: 120000.0, description: 'Relaxed fit heavyweight sweats with minimal branding.', image_url: '/images/products/IMG_0572.png', color: 'Multi', category: 'Bottoms' },
    { sku: 'UN-300', title: 'US Effort Sleeveless Tee', slug: 'US Effort Sleeveless Tee', price: 75000.0, description: 'Sleeveless tank with clean neckline and premium cotton.', image_url: '/images/products/IMG_0562.png', color: 'White', category: 'Tops' },
    { sku: 'UN-400', title: 'US Logo Tee', slug: 'US Logo Tee', price: 91000.0, description: 'Essential tee in heavyweight jersey.', image_url: '/images/products/IMG_0567.png', color: 'Black & White', category: 'T-Shirts' },
    { sku: 'UN-500', title: 'US PGNL Crop Top', slug: 'US PGNL Crop Top', price: 54000.0, description: 'Cropped top with tight rib and clean finish.', image_url: '/images/products/IMG_0568.png', color: 'Multi', category: 'Tops' },
    { sku: 'UN-600', title: 'Combo', slug: 'combo', price: 269000.0, salePrice: 250000.0, description: 'Complete streetwear set with hoodie, pants, and essentials.', image_url: '/images/products/IMG_0564.png', color: 'Multi', category: 'Sets' }
  ]

  for (const p of products) {
    await pool.query(
      'INSERT INTO products (sku, title, slug, description, price, image_url, color, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.sku, p.title, p.slug, p.description, p.price, p.image_url, p.color, p.category, 100]
    )
  }
}


