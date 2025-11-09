import 'dotenv/config'
import mysql from 'mysql2/promise'
import { pool } from '../db'
import { up as up001 } from './001_create_orders'
import { up as up002 } from './002_create_products_and_reviews'
import { up as up003 } from './003_update_products_five_items'

/**
 * Template tag function for running SQL queries
 */
export function sql(strings: TemplateStringsArray, ...values: any[]) {
  const query = strings.reduce((acc, str, i) => {
    return acc + str + (values[i] ? '?' : '')
  }, '')
  
  return pool.query(query, values)
}

/**
 * Run migrations
 */
export async function runMigrations() {
  console.log('Running migrations...')
  
  // Create database if it doesn't exist
  await pool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'un533n'};`)
  await pool.query(`USE ${process.env.DB_NAME || 'un533n'};`)

  // Create migrations table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  // Get list of applied migrations
  const [applied] = await sql`SELECT name FROM migrations;`
  const appliedMigrations = new Set((applied as any[]).map(row => row.name))

  // Get all migration files
  const migrations = [
    { name: '001_create_orders', up: up001 },
    { name: '002_create_products_and_reviews', up: up002 },
    { name: '003_update_products_five_items', up: up003 }
  ]

  // Run pending migrations
  for (const migration of migrations) {
    if (!appliedMigrations.has(migration.name)) {
      console.log(`Running migration: ${migration.name}`)
      await migration.up()
      await sql`INSERT INTO migrations (name) VALUES (${migration.name});`
      console.log(`Completed migration: ${migration.name}`)
    }
  }

  console.log('Migrations complete')
}

// If run directly, execute migrations
if (require.main === module) {
  runMigrations().catch(err => {
    console.error('Migration runner failed:', err)
    process.exit(1)
  })
}