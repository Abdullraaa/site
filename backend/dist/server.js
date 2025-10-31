"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = require("body-parser");
const orders_1 = __importDefault(require("./routes/orders"));
const db_1 = require("./db");
const inmemoryOrders_1 = require("./inmemoryOrders");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_validator_1 = require("express-validator");
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, body_parser_1.json)());
// Basic rate limiter for API endpoints (simple protection)
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // limit each IP to 60 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
});
// Apply to all /api routes
app.use('/api', apiLimiter);
const PORT = process.env.PORT || 4000;
// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Products endpoint - read from DB
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await db_1.pool.query(`SELECT id, sku, title, slug, description, price, image_url as imageUrl, color, category FROM products LIMIT 100`);
        return res.json({ products: rows });
    }
    catch (err) {
        console.error('Failed to list products:', err);
        // fallback to empty list
        return res.json({ products: [] });
    }
});
// Single product endpoint - read from DB
app.get('/api/products/:slug', async (req, res) => {
    try {
        const [rows] = await db_1.pool.query(`SELECT id, sku, title, slug, description, price, image_url as imageUrl, color, category FROM products WHERE slug = ? LIMIT 1`, [req.params.slug]);
        if (!rows.length)
            return res.status(404).json({ error: 'Product not found' });
        return res.json({ product: rows[0] });
    }
    catch (err) {
        console.error('Failed to get product:', err);
        return res.status(500).json({ error: 'server_error' });
    }
});
// WhatsApp Checkout
app.post('/api/checkout/create-whatsapp', 
// validation
(0, express_validator_1.body)('items').isArray({ min: 1 }), (0, express_validator_1.body)('items.*.qty').isInt({ min: 1 }), (0, express_validator_1.body)('items.*.price').isFloat({ gt: 0 }), (0, express_validator_1.body)('total').isFloat({ gt: 0 }), (0, express_validator_1.body)('customer.phone').optional().isMobilePhone('any'), async (req, res) => {
    // handle validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { items, total, customer } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'No items in cart' });
        }
        const ref = `UN-${Date.now()}`;
        // Try to persist order in DB within a transaction. If DB unavailable, fallback to returning WhatsApp URL
        let connection = null;
        let orderId = null;
        let persisted = false;
        try {
            try {
                connection = await db_1.pool.getConnection();
            }
            catch (dbErr) {
                console.error('DB connection failed, proceeding without persistence:', dbErr);
                connection = null;
            }
            if (connection) {
                try {
                    await connection.beginTransaction();
                    const [insertRes] = await connection.execute('INSERT INTO orders (reference, status, total, currency, customer_phone) VALUES (?, ?, ?, ?, ?)', [ref, 'pending', total, 'USD', (customer && customer.phone) ? customer.phone : null]);
                    orderId = insertRes.insertId;
                    const itemValues = items.map((it) => [orderId, it.productId || it.id || null, it.qty || 1, it.price || 0]);
                    if (itemValues.length) {
                        await connection.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?', [itemValues]);
                    }
                    await connection.commit();
                    persisted = true;
                }
                catch (errInner) {
                    await connection.rollback();
                    console.error('DB transaction failed, rolled back:', errInner);
                }
                finally {
                    connection.release();
                }
            }
            // Build WhatsApp message and URL regardless of DB result
            const itemsList = items.map((item) => `${item.qty}x ${item.title} @ $${item.price}`).join('\n');
            const message = `New Order - ${ref}\n\nItems:\n${itemsList}\n\nTotal: $${total}`;
            const whatsappNumber = (process.env.WHATSAPP_NUMBER || '').replace(/\D/g, '');
            const base = /Mobi|Android/i.test((req.headers['user-agent'] || '')) ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send';
            const phoneParam = whatsappNumber ? `phone=${whatsappNumber}&` : '';
            const url = `${base}?${phoneParam}text=${encodeURIComponent(message)}`;
            // If DB persistence didn't happen, save a dev fallback copy in-memory so GET can retrieve it during development
            if (!persisted) {
                try {
                    const saved = (0, inmemoryOrders_1.saveOrderInMemory)({ reference: ref, total, items, customer_phone: customer?.phone || null });
                    orderId = saved.orderId ?? orderId;
                }
                catch (e) {
                    console.error('Failed to save in-memory order:', e);
                }
            }
            return res.json({ success: persisted, persisted, reference: ref, orderId, whatsappUrl: url });
        }
        catch (err) {
            console.error('Checkout overall error:', err);
            return res.status(500).json({ error: 'Failed to create checkout' });
        }
    }
    catch (error) {
        console.error('Error creating WhatsApp checkout:', error);
        return res.status(500).json({ error: 'Failed to create checkout' });
    }
});
// Use routes
app.use('/api/orders', orders_1.default);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
