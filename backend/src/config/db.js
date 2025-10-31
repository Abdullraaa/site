const mysql = require('mysql2/promise')
const config = require('./index')

const pool = mysql.createPool({
  host: process.env.DB_HOST || (config.db && config.db.host) || '127.0.0.1',
  user: process.env.DB_USER || (config.db && config.db.user) || 'root',
  password: process.env.DB_PASSWORD || (config.db && config.db.password) || '',
  database: process.env.DB_NAME || (config.db && config.db.database) || 'un533n_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

pool.getConnection().then(() => console.log('MySQL pool created')).catch(err => console.error('MySQL pool error', err))

module.exports = pool