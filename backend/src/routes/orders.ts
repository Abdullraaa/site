import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { generateRef } from '../utils'
import { CreateOrderRequest, Order } from '../types/order'
import { ResultSetHeader } from 'mysql2'
import { asyncHandler, AppError } from '../middleware/errorHandler'

const router = Router()

// POST /api/orders - Create a new order
router.post('/', asyncHandler(async (req: CreateOrderRequest, res: Response) => {
  const { items, total, customer } = req.body

  if (!items?.length || !total) {
    throw new AppError('Invalid order data', 400)
  }

  const ref = generateRef()
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()
    const [insertRes] = await connection.execute(
      'INSERT INTO orders (reference, status, total, currency, customer_phone) VALUES (?, ?, ?, ?, ?)',
      [ref, 'pending', total, 'USD', customer?.phone || null]
    )
    const orderId = (insertRes as ResultSetHeader).insertId

    const itemValues = items.map(item => [orderId, item.productId, item.qty, item.price])
    if (itemValues.length) {
      await connection.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?', [itemValues])
    }

    await connection.commit()
    return res.json({ success: true, reference: ref, orderId })
  } catch (err) {
    await connection.rollback()
    throw new AppError('Failed to create order', 500)
  } finally {
    connection.release()
  }
}))

// GET /api/orders/:reference - Get order by reference
router.get('/:reference', asyncHandler(async (req: Request, res: Response) => {
  const ref = req.params.reference
  const [rows] = await pool.query(
    `SELECT o.*, 
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
    GROUP BY o.id`,
    [ref]
  )

  if (!rows || !(rows as any[]).length) {
    throw new AppError('Order not found', 404)
  }

  res.json({ success: true, order: (rows as any[])[0] })
}))

export default router