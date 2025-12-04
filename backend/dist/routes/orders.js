"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const utils_1 = require("../utils");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// POST /api/orders - Create a new order
router.post('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { items, total, customer } = req.body;
    if (!items?.length || !total) {
        throw new errorHandler_1.AppError('Invalid order data', 400);
    }
    const ref = (0, utils_1.generateRef)();
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
        return res.json({ success: true, reference: ref, orderId });
    }
    catch (err) {
        await connection.rollback();
        throw new errorHandler_1.AppError('Failed to create order', 500);
    }
    finally {
        connection.release();
    }
}));
// GET /api/orders/:reference - Get order by reference
router.get('/:reference', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const ref = req.params.reference;
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
    if (!rows || !rows.length) {
        throw new errorHandler_1.AppError('Order not found', 404);
    }
    res.json({ success: true, order: rows[0] });
}));
exports.default = router;
