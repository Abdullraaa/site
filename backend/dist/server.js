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
const reviews_1 = __importDefault(require("./routes/reviews"));
const db_1 = require("./db");
const inmemoryOrders_1 = require("./inmemoryOrders");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./middleware/logger");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
const isDevelopment = process.env.NODE_ENV === 'development';
// Security & Logging Middleware
app.use((0, helmet_1.default)());
// CORS Configuration - Production ready
const allowedOrigins = isDevelopment
    ? [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3005',
        'https://un533nstu.shop',
        'https://www.un533nstu.shop'
    ]
    : [
        'https://un533nstu.shop',
        'https://www.un533nstu.shop'
    ];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use((0, body_parser_1.json)());
app.use((0, logger_1.getLoggerMiddleware)());
// Rate Limiting - Production ready
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later'
});
// Apply rate limiting to all API routes
app.use('/api', apiLimiter);
// Stricter rate limiting for checkout endpoint
const checkoutLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 checkout attempts per window
    message: 'Too many checkout attempts, please try again later'
});
// API Routes
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});
// Products endpoint - read from DB
app.get('/api/products', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const [rows] = await db_1.pool.query(`
    SELECT id, sku, title, slug, description, price, image_url as imageUrl, color, category 
    FROM products 
    ORDER BY id ASC 
    LIMIT 100
  `);
    res.json({ success: true, products: rows });
}));
// Single product endpoint - read from DB
app.get('/api/products/:slug', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const [rows] = await db_1.pool.query(`
    SELECT id, sku, title, slug, description, price, image_url as imageUrl, color, category 
    FROM products 
    WHERE slug = ? 
    LIMIT 1
  `, [req.params.slug]);
    if (!rows.length) {
        return res.status(404).json({
            success: false,
            error: { message: 'Product not found', statusCode: 404 }
        });
    }
    res.json({ success: true, product: rows[0] });
}));
// WhatsApp Checkout - with enhanced rate limiting
app.post('/api/checkout/create-whatsapp', checkoutLimiter, 
// validation + normalization for phone numbers
(0, express_validator_1.body)('items').isArray({ min: 1 }), (0, express_validator_1.body)('items.*.qty').isInt({ min: 1 }), (0, express_validator_1.body)('items.*.price').isFloat({ gt: 0 }), (0, express_validator_1.body)('total').isFloat({ gt: 0 }), 
// accept optional phone with optional leading +, normalize to digits-only server-side
(0, express_validator_1.body)('customer.phone')
    .optional()
    .trim()
    .customSanitizer((p) => (typeof p === 'string' ? p.replace(/[^+\d]/g, '') : p))
    .matches(/^\+?\d{7,15}$/).withMessage('Invalid phone format'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // handle validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', statusCode: 400, errors: errors.array() }
        });
    }
    const { items, total, customer } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            error: { message: 'No items in cart', statusCode: 400 }
        });
    }
    const ref = `UN-${Date.now()}`;
    // Normalize customer phone for storage/DB: digits only (strip + and non-digits)
    const normalizedCustomerPhone = customer?.phone ? String(customer.phone).replace(/\D/g, '') : null;
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
                const [insertRes] = await connection.execute('INSERT INTO orders (reference, status, total, currency, customer_phone) VALUES (?, ?, ?, ?, ?)', [ref, 'pending', total, 'USD', normalizedCustomerPhone]);
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
        return res.json({ success: true, persisted, reference: ref, orderId, whatsappUrl: url });
    }
    catch (err) {
        console.error('Checkout overall error:', err);
        return res.status(500).json({
            success: false,
            error: { message: 'Failed to create checkout', statusCode: 500 }
        });
    }
}));
// Use routes
app.use('/api/orders', orders_1.default);
app.use('/api/reviews', reviews_1.default);
// 404 handler - must be after all routes
app.use(errorHandler_1.notFoundHandler);
// Error handler - must be last
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 CORS allowed origins: ${allowedOrigins.join(', ')}`);
});
