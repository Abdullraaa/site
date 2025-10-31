-- Sample seed data for un533n store
INSERT INTO categories (name, slug) VALUES
('Tops', 'tops'),
('Bottoms', 'bottoms'),
('Accessories', 'accessories');

INSERT INTO products (sku, title, slug, description, price, currency, inventory_count, category_id) VALUES
('UN-001', 'SQUARE TEE', 'square-tee', 'Minimalist box cut tee in heavyweight cotton.', 45.00, 'USD', 100, 1),
('UN-002', 'CARGO PANT', 'cargo-pant', 'Relaxed fit cargo pants with utility pockets.', 85.00, 'USD', 50, 2),
('UN-003', 'MESH CAP', 'mesh-cap', 'Breathable mesh cap with tonal embroidery.', 35.00, 'USD', 75, 3),
('UN-004', 'OVERSIZED HOODIE', 'oversized-hoodie', 'Dropped shoulder hoodie in brushed fleece.', 95.00, 'USD', 60, 1);

INSERT INTO product_images (product_id, url, alt, sort_order) VALUES
(1, 'https://example.com/images/square-tee-1.jpg', 'Square Tee Front', 1),
(1, 'https://example.com/images/square-tee-2.jpg', 'Square Tee Back', 2),
(2, 'https://example.com/images/cargo-pant-1.jpg', 'Cargo Pant Front', 1),
(2, 'https://example.com/images/cargo-pant-2.jpg', 'Cargo Pant Detail', 2);

-- Sample reviews
INSERT INTO reviews (product_id, rating, title, body, created_at) VALUES
(1, 5, 'Perfect fit', 'Great quality and exactly as described.', NOW()),
(2, 4, 'Nice pants', 'Good material but runs slightly large.', NOW());