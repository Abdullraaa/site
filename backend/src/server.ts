import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { json } from 'body-parser'
import ordersRouter from './routes/orders'
import reviewsRouter from './routes/reviews'
import { pool } from './db'
import { ResultSetHeader } from 'mysql2'
import { saveOrderInMemory } from './inmemoryOrders'
import rateLimit from 'express-rate-limit'
import { body, validationResult } from 'express-validator'
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler'
import { getLoggerMiddleware } from './middleware/logger'

const app = express()
const PORT = process.env.PORT || 4000
const isDevelopment = process.env.NODE_ENV !== 'production'

// Security & Logging Middleware
app.use(helmet())

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
    ]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use(json())
app.use(getLoggerMiddleware())

// Rate Limiting - Production ready
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
})

// Apply rate limiting to all API routes
app.use('/api', apiLimiter)

// Stricter rate limiting for checkout endpoint
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 checkout attempts per window
  message: 'Too many checkout attempts, please try again later'
})

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() })
})

// Products endpoint - read from DB
app.get('/api/products', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT id, sku, title, slug, description, price, image_url as imageUrl, color, category 
    FROM products 
    ORDER BY id ASC 
    LIMIT 100
  `)
  res.json({ success: true, products: rows })
}))

// Single product endpoint - read from DB
app.get('/api/products/:slug', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT id, sku, title, slug, description, price, image_url as imageUrl, color, category 
    FROM products 
    WHERE slug = ? 
    LIMIT 1
  `, [req.params.slug])
  
  if (!(rows as any[]).length) {
    return res.status(404).json({ 
      success: false, 
      error: { message: 'Product not found', statusCode: 404 } 
    })
  }
  
  res.json({ success: true, product: (rows as any[])[0] })
}))

// WhatsApp Checkout - with enhanced rate limiting
app.post('/api/checkout/create-whatsapp',
  checkoutLimiter,
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
  asyncHandler(async (req, res) => {
    // handle validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: { message: 'Validation failed', statusCode: 400, errors: errors.array() }
      })
    }

    const { items, total, customer } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: { message: 'No items in cart', statusCode: 400 } 
      })
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
      const base = /Mobi|Android/i.test((req.headers['user-agent'] || '')) ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send'
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

      return res.json({ success: true, persisted, reference: ref, orderId, whatsappUrl: url })
    } catch (err) {
      console.error('Checkout overall error:', err)
      return res.status(500).json({ 
        success: false,
        error: { message: 'Failed to create checkout', statusCode: 500 } 
      })
    }
  })
)

// Use routes
app.use('/api/orders', ordersRouter)
app.use('/api/reviews', reviewsRouter)

// 404 handler - must be after all routes
app.use(notFoundHandler)

// Error handler - must be last
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔒 CORS allowed origins: ${allowedOrigins.join(', ')}`)
})