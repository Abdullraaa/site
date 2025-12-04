"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = sql;
exports.runMigrations = runMigrations;
require("dotenv/config");
const db_1 = require("../db");
const _001_create_orders_1 = require("./001_create_orders");
const _002_create_products_and_reviews_1 = require("./002_create_products_and_reviews");
const _003_seed_curated_products_1 = require("./003_seed_curated_products");
/**
 * Template tag function for running SQL queries
 */
function sql(strings, ...values) {
    const query = strings.reduce((acc, str, i) => {
        return acc + str + (values[i] ? '?' : '');
    }, '');
    return db_1.pool.query(query, values);
}
/**
 * Run migrations
 */
async function runMigrations() {
    console.log('Running migrations...');
    // Create database if it doesn't exist
    await db_1.pool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'un533n'};`);
    await db_1.pool.query(`USE ${process.env.DB_NAME || 'un533n'};`);
    // Create migrations table if it doesn't exist
    await sql `
    CREATE TABLE IF NOT EXISTS migrations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
    // Get list of applied migrations
    const [applied] = await sql `SELECT name FROM migrations;`;
    const appliedMigrations = new Set(applied.map(row => row.name));
    // Get all migration files
    const migrations = [
        { name: '001_create_orders', up: _001_create_orders_1.up },
        { name: '002_create_products_and_reviews', up: _002_create_products_and_reviews_1.up },
        { name: '003_seed_curated_products', up: _003_seed_curated_products_1.up }
    ];
    // Run pending migrations
    for (const migration of migrations) {
        if (!appliedMigrations.has(migration.name)) {
            console.log(`Running migration: ${migration.name}`);
            await migration.up();
            await sql `INSERT INTO migrations (name) VALUES (${migration.name});`;
            console.log(`Completed migration: ${migration.name}`);
        }
    }
    console.log('Migrations complete');
}
// If run directly, execute migrations
if (require.main === module) {
    runMigrations().catch(err => {
        console.error('Migration runner failed:', err);
        process.exit(1);
    });
}
