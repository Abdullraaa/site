require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const bodyParser = require('body-parser')

// Use centralized pool
const pool = require('./config/db')

const app = express()
app.use(helmet())
app.use(cors())
app.use(bodyParser.json())

const PORT = process.env.PORT || 4000
console.log('Starting server with config:', {
  port: PORT,
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbName: process.env.DB_NAME || 'un533n_db'
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// lightweight products endpoint (returns sample products if DB not ready)
app.get('/api/products', async (req, res) => {
  try {
    // try DB first
      try {
      const [rows] = await pool.query('SELECT id, sku, title, slug, price FROM products LIMIT 20')
      return res.json({ products: rows })
    } catch (err) {
      // fallback to sample data
      const sample = [
        { id: 1, sku: 'UN-001', title: 'SQUARE TEE', slug: 'square-tee', price: 45.00 },
        { id: 2, sku: 'UN-002', title: 'CARGO PANT', slug: 'cargo-pant', price: 85.00 }
      ]
      return res.json({ products: sample })
    }
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'server_error' })
  }
})

// product by slug
app.get('/api/products/:slug', async (req, res) => {
  const { slug } = req.params
  try {
    try {
      const [rows] = await pool.query('SELECT id, sku, title, slug, price, description FROM products WHERE slug = ? LIMIT 1', [slug])
      if (rows && rows.length) return res.json({ product: rows[0] })
    } catch (err) {
      // fallback to sample
    }

    const sample = {
      'square-tee': { id: 1, sku: 'UN-001', title: 'SQUARE TEE', slug: 'square-tee', price: 45.00, description: 'Classic square tee.' },
      'cargo-pant': { id: 2, sku: 'UN-002', title: 'CARGO PANT', slug: 'cargo-pant', price: 85.00, description: 'Utility cargo pant.' }
    }

    if (sample[slug]) return res.json({ product: sample[slug] })
    return res.status(404).json({ error: 'not_found' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'server_error' })
  }
})

app.post('/api/checkout/create-whatsapp', async (req, res) => {
  try {
    const { cart, customer } = req.body
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'cart_empty' })
    }

    const total = cart.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0)
    const ref = `UN${new Date().toISOString().slice(0,10).replace(/-/g,'')}${Math.floor(Math.random()*900)+100}`

    try {
      const pool = await getPool()
      const [orderRes] = await pool.query(
        'INSERT INTO orders (`reference`, `status`, `total`, `currency`, `contact_phone`, `created_at`) VALUES (?, ?, ?, ?, ?, now())',
        [ref, 'pending_whatsapp', total, 'USD', (customer && customer.phone) || null]
      )
      const orderId = orderRes.insertId
      for (const item of cart) {
        await pool.query(
          'INSERT INTO order_items (`order_id`,`product_id`,`sku`,`title`,`qty`,`size`,`price`,`total`) VALUES (?,?,?,?,?,?,?,?)',
          [orderId, item.productId || null, item.sku || null, item.title || null, item.qty || 1, item.size || null, item.price || 0, (item.price || 0) * (item.qty || 1)]
        )
      }
    } catch (err) {
      console.warn('DB insert skipped or failed:', err.message)
    }

    const lines = []
    lines.push('NEW ORDER — un533n')
    lines.push(`Ref: ${ref}`)
    if (customer && customer.name) lines.push(`Name: ${customer.name}`)
    if (customer && customer.phone) lines.push(`Phone: ${customer.phone}`)
    lines.push('Items:')
    for (const it of cart) {
      lines.push(`${it.qty}x ${it.title || it.sku || 'Item'} — ${it.size || '-'} — $${(it.price||0).toFixed(2)}`)
    }
    lines.push(`Total: $${total.toFixed(2)}`)
    if (customer && customer.address) lines.push(`Address: ${customer.address}`)
    lines.push('---')
    lines.push('Please confirm payment method / availability.')

    const whatsappNumber = process.env.WHATSAPP_NUMBER || ''
    const base = /Mobi|Android/i.test((req.headers['user-agent']||'')) ? 'https://api.whatsapp.com/send' : 'https://web.whatsapp.com/send'
    const message = lines.join('\n')
    const url = `${base}?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`

    return res.json({ whatsappUrl: url, reference: ref })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'server_error' })
  }
})

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`)
}).on('error', (err) => {
  console.error('Failed to start server:', err)
})