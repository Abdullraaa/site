import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { json } from 'body-parser'
import ordersRouter from './routes/orders'
import { pool } from './db'
import { ResultSetHeader } from 'mysql2'
import { saveOrderInMemory } from './inmemoryOrders'
import rateLimit from 'express-rate-limit'
import { body, validationResult } from 'express-validator'

const app = express()

// Middleware
app.use(helmet())
app.use(cors())
app.use(json())

// Basic rate limiter for API endpoints (simple protection)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
})

// Apply to all /api routes
app.use('/api', apiLimiter)

const PORT = process.env.PORT || 4000

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Products endpoint - read from DB
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT id, sku, title, slug, description, price, image_url as imageUrl, color, category FROM products LIMIT 100`)
    return res.json({ products: rows })
  } catch (err) {
    console.error('Failed to list products:', err)
    // fallback to empty list
    return res.json({ products: [] })
  }
})

// Single product endpoint - read from DB
app.get('/api/products/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT id, sku, title, slug, description, price, image_url as imageUrl, color, category FROM products WHERE slug = ? LIMIT 1`, [req.params.slug])
    if (!(rows as any[]).length) return res.status(404).json({ error: 'Product not found' })
    return res.json({ product: (rows as any[])[0] })
  } catch (err) {
    console.error('Failed to get product:', err)
    return res.status(500).json({ error: 'server_error' })
  }
})

// WhatsApp Checkout
app.post('/api/checkout/create-whatsapp',
  // validation + normalization for phone numbers
  body('items').isArray({ min: 1 }),
  body('items.*.qty').isInt({ min: 1 }),
  body('items.*.price').isFloat({ gt: 0 }),
  body('total').isFloat({ gt: 0 }),
  // accept optional phone with optional leading +, normalize to digits-only server-side
  body('customer.phone')
    .optional()
    .trim()
    .customSanitizer((p: any) => (typeof p === 'string' ? p.replace(/[^+\d]/g, '') : p))
    .matches(/^\+?\d{7,15}$/).withMessage('Invalid phone format'),
  async (req, res) => {
    // handle validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
  const { items, total, customer } = req.body

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'No items in cart' })
      }

  const ref = `UN-${Date.now()}`

  // Normalize customer phone for storage/DB: digits only (strip + and non-digits)
  const normalizedCustomerPhone = customer?.phone ? String(customer.phone).replace(/\D/g, '') : null

    // Try to persist order in DB within a transaction. If DB unavailable, fallback to returning WhatsApp URL
    let connection: any = null
    let orderId: number | null = null
    let persisted = false
    try {
      try {
        connection = await pool.getConnection()
      } catch (dbErr) {
        console.error('DB connection failed, proceeding without persistence:', dbErr)
        connection = null
      }

      if (connection) {
        try {
          await connection.beginTransaction()
          const [insertRes] = await connection.execute(
            'INSERT INTO orders (reference, status, total, currency, customer_phone) VALUES (?, ?, ?, ?, ?)',
              [ref, 'pending', total, 'USD', normalizedCustomerPhone]
          )
          orderId = insertRes.insertId

          const itemValues = items.map((it: any) => [orderId, it.productId || it.id || null, it.qty || 1, it.price || 0])
          if (itemValues.length) {
            await connection.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?', [itemValues])
          }

          await connection.commit()
          persisted = true
        } catch (errInner) {
          await connection.rollback()
          console.error('DB transaction failed, rolled back:', errInner)
        } finally {
          connection.release()
        }
      }

      // Build WhatsApp message and URL regardless of DB result
  const itemsList = items.map((item: { qty: number; title: string; price: number }) => `${item.qty}x ${item.title} @ $${item.price}`).join('\n')
      const message = `New Order - ${ref}\n\nItems:\n${itemsList}\n\nTotal: $${total}`
  const whatsappNumber = (process.env.WHATSAPP_NUMBER || '').replace(/\D/g, '')
      const base = /Mobi|Android/i.test((req.headers['user-agent']||'')) ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send'
      const phoneParam = whatsappNumber ? `phone=${whatsappNumber}&` : ''
      const url = `${base}?${phoneParam}text=${encodeURIComponent(message)}`

      // If DB persistence didn't happen, save a dev fallback copy in-memory so GET can retrieve it during development
      if (!persisted) {
        try {
          const saved = saveOrderInMemory({ reference: ref, total, items, customer_phone: customer?.phone || null })
          orderId = saved.orderId ?? orderId
        } catch (e) {
          console.error('Failed to save in-memory order:', e)
        }
      }

      return res.json({ success: persisted, persisted, reference: ref, orderId, whatsappUrl: url })
    } catch (err) {
      console.error('Checkout overall error:', err)
      return res.status(500).json({ error: 'Failed to create checkout' })
    }
    } catch (error) {
      console.error('Error creating WhatsApp checkout:', error)
      return res.status(500).json({ error: 'Failed to create checkout' })
    }
  }
)

// Use routes
app.use('/api/orders', ordersRouter)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})