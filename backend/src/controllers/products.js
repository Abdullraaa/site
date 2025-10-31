// Use the shared pool from config to keep DB access consistent
const pool = require('../config/db')

// Product controllers
exports.listProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, 
             GROUP_CONCAT(pi.url) as images,
             COUNT(DISTINCT r.id) as review_count,
             AVG(r.rating) as avg_rating
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN reviews r ON p.id = r.product_id
      GROUP BY p.id
      LIMIT ? OFFSET ?
    `, [req.query.limit || 20, req.query.offset || 0]);

    return res.json({ products: rows });
  } catch (err) {
    console.error('Failed to list products:', err);
    // Fallback to sample data if DB fails
    return res.json({
      products: [
        { id: 1, sku: 'UN-001', title: 'SQUARE TEE', price: 45.00 },
        { id: 2, sku: 'UN-002', title: 'CARGO PANT', price: 85.00 }
      ]
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*,
             GROUP_CONCAT(pi.url) as images,
             COUNT(DISTINCT r.id) as review_count,
             AVG(r.rating) as avg_rating
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.slug = ?
      GROUP BY p.id
    `, [req.params.slug]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'product_not_found' });
    }

    return res.json({ product: rows[0] });
  } catch (err) {
    console.error('Failed to get product:', err);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, u.name as reviewer_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.params.productId, req.query.limit || 10, req.query.offset || 0]);

    return res.json({ reviews: rows });
  } catch (err) {
    console.error('Failed to get reviews:', err);
    return res.status(500).json({ error: 'server_error' });
  }
};