import { Router, Request, Response } from 'express'
import { pool } from '../db'
import { getOrderInMemory, saveOrderInMemory } from '../inmemoryOrders'
import { generateRef } from '../utils'
import { CreateOrderRequest, Order } from '../types/order'
import { ResultSetHeader } from 'mysql2'

const router = Router()

// POST /api/orders - Create a new order
router.post('/', async (req: CreateOrderRequest, res: Response) => {
  try {
    const { items, total, customer } = req.body

    if (!items?.length || !total) {
      return res.status(400).json({ error: 'Invalid order data' })
    }

    // Generate a unique reference number
    const ref = generateRef()

    // Try to persist to DB, otherwise save in-memory for dev/testing
    try {
      const connection = await pool.getConnection()
      try {
        await connection.beginTransaction()
        const [insertRes] = await connection.execute(
          'INSERT INTO orders (reference, status, total, currency, customer_phone) VALUES (?, ?, ?, ?, ?)',
          [ref, 'pending', total, 'USD', customer?.phone || null]
        )
        const orderId = (insertRes as any).insertId

        const itemValues = items.map(item => [orderId, item.productId, item.qty, item.price])
        if (itemValues.length) {
          await connection.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?', [itemValues])
        }

        await connection.commit()
        connection.release()

        return res.json({ success: true, reference: ref, orderId })
      } catch (err) {
        await connection.rollback()
        connection.release()
        console.error('DB transaction failed, falling back to in-memory', err)
      }
    } catch (dbErr) {
      console.warn('DB not available, saving order in-memory for dev', dbErr)
    }

    // Save in-memory fallback
    try {
      const saved = saveOrderInMemory({ reference: ref, total, currency: 'USD', customer_phone: customer?.phone || null, items })
      return res.json({ success: false, persisted: false, reference: ref, orderId: saved.orderId })
    } catch (err) {
      console.error('Failed to save in-memory order:', err)
      return res.status(500).json({ error: 'Failed to create order' })
    }
  } catch (error) {
    console.error('Error creating order:', error)
    return res.status(500).json({ error: 'Failed to create order' })
  }
})

// GET /api/orders/:reference - Get order by reference
router.get('/:reference', async (req: Request, res: Response) => {
  const ref = req.params.reference
  // Try to fetch from DB first
  try {
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

    if (rows && (rows as any[]).length) {
      return res.json((rows as any[])[0])
    }
  } catch (dbErr) {
    console.warn('DB unavailable or query failed, falling back to in-memory:', dbErr)
  }

  // Fallback to in-memory store
  try {
    const inMem = getOrderInMemory(ref)
    if (!inMem) return res.status(404).json({ error: 'Order not found' })

    return res.json({
      id: inMem.orderId,
      reference: inMem.reference,
      status: inMem.status,
      total: inMem.total,
      currency: inMem.currency,
      customer_phone: inMem.customer_phone,
      items: inMem.items,
      created_at: inMem.created_at
    })
  } catch (err) {
    console.error('Error fetching in-memory order:', err)
    return res.status(500).json({ error: 'Failed to fetch order' })
  }
})

export default router