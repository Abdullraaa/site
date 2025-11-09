-- Sample seed data for un533n store
INSERT INTO categories (name, slug) VALUES
('Tops', 'tops'),
('Bottoms', 'bottoms'),
('Accessories', 'accessories');

DELETE FROM product_images;
DELETE FROM reviews;
DELETE FROM products;

INSERT INTO products (sku, title, slug, description, price, currency, inventory_count, category_id) VALUES
('UN-100', 'MESH CAP', 'cap', 'Breathable mesh cap with tonal embroidery.', 35.00, 'USD', 100, 3),
('UN-200', 'LOUNGE SWEATS', 'sweats', 'Relaxed fit heavyweight sweats with minimal branding.', 65.00, 'USD', 100, 2),
('UN-300', 'ARMLESS TANK', 'armless', 'Sleeveless tank with clean neckline and premium cotton.', 30.00, 'USD', 100, 1),
('UN-400B', 'ESSENTIAL TEE — BLACK', 'tee-black', 'Essential black tee in heavyweight jersey.', 40.00, 'USD', 100, 1),
('UN-400W', 'ESSENTIAL TEE — WHITE', 'tee-white', 'Essential white tee in heavyweight jersey.', 40.00, 'USD', 100, 1),
('UN-500', 'CROP TOP', 'crop-top', 'Cropped top with tight rib and clean finish.', 32.00, 'USD', 100, 1);

INSERT INTO product_images (product_id, url, alt, sort_order) VALUES
(1, '/images/products/triangle-cap.jpg', 'Cap', 1),
(2, '/images/products/gray-hoodie.jpg', 'Sweats', 1),
(3, '/images/products/white-hoodie.jpg', 'Armless', 1),
(4, '/images/products/black-tee.jpg', 'Tee Black', 1),
(5, '/images/products/white-tee.jpg', 'Tee White', 1),
(6, '/images/products/circle-hoodie.jpg', 'Crop Top', 1);

-- Sample reviews
INSERT INTO reviews (product_id, rating, title, body, created_at) VALUES
(4, 5, 'Perfect tee', 'Thick fabric, sharp fit. Love the black.', NOW()),
(5, 5, 'Clean white', 'Crisp white and not see-through.', NOW());