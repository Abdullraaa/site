"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const inmemoryOrders_1 = require("../inmemoryOrders");
const utils_1 = require("../utils");
const router = (0, express_1.Router)();
// POST /api/orders - Create a new order
router.post('/', async (req, res) => {
    try {
        const { items, total, customer } = req.body;
        if (!items?.length || !total) {
            return res.status(400).json({ error: 'Invalid order data' });
        }
        // Generate a unique reference number
        const ref = (0, utils_1.generateRef)();
        // Try to persist to DB, otherwise save in-memory for dev/testing
        try {
            const connection = await db_1.pool.getConnection();
            try {
                await connection.beginTransaction();
                const [insertRes] = await connection.execute('INSERT INTO orders (reference, status, total, currency, customer_phone) VALUES (?, ?, ?, ?, ?)', [ref, 'pending', total, 'USD', customer?.phone || null]);
                const orderId = insertRes.insertId;
                const itemValues = items.map(item => [orderId, item.productId, item.qty, item.price]);
                if (itemValues.length) {
                    await connection.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?', [itemValues]);
                }
                await connection.commit();
                connection.release();
                return res.json({ success: true, reference: ref, orderId });
            }
            catch (err) {
                await connection.rollback();
                connection.release();
                console.error('DB transaction failed, falling back to in-memory', err);
            }
        }
        catch (dbErr) {
            console.warn('DB not available, saving order in-memory for dev', dbErr);
        }
        // Save in-memory fallback
        try {
            const saved = (0, inmemoryOrders_1.saveOrderInMemory)({ reference: ref, total, currency: 'USD', customer_phone: customer?.phone || null, items });
            return res.json({ success: false, persisted: false, reference: ref, orderId: saved.orderId });
        }
        catch (err) {
            console.error('Failed to save in-memory order:', err);
            return res.status(500).json({ error: 'Failed to create order' });
        }
    }
    catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({ error: 'Failed to create order' });
    }
});
// GET /api/orders/:reference - Get order by reference
router.get('/:reference', async (req, res) => {
    const ref = req.params.reference;
    // Try to fetch from DB first
    try {
        const [rows] = await db_1.pool.query(`SELECT o.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'productId', oi.product_id,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.reference = ?
      GROUP BY o.id`, [ref]);
        if (rows && rows.length) {
            return res.json(rows[0]);
        }
    }
    catch (dbErr) {
        console.warn('DB unavailable or query failed, falling back to in-memory:', dbErr);
    }
    // Fallback to in-memory store
    try {
        const inMem = (0, inmemoryOrders_1.getOrderInMemory)(ref);
        if (!inMem)
            return res.status(404).json({ error: 'Order not found' });
        return res.json({
            id: inMem.orderId,
            reference: inMem.reference,
            status: inMem.status,
            total: inMem.total,
            currency: inMem.currency,
            customer_phone: inMem.customer_phone,
            items: inMem.items,
            created_at: inMem.created_at
        });
    }
    catch (err) {
        console.error('Error fetching in-memory order:', err);
        return res.status(500).json({ error: 'Failed to fetch order' });
    }
});
exports.default = router;
