"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
exports.pool = promise_1.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'un533n',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Use loose types to avoid mysql2 type differences between promise/cjs
    typeCast: (field, next) => {
        // Ensure DECIMAL/NEWDECIMAL values (e.g., price) are returned as numbers, not strings
        // This prevents frontend runtime errors like price.toFixed not being a function
        // Note: Other numeric types are already handled by mysql2
        // field.type can be string in mysql2 typings; compare string values
        if (field?.type === 'DECIMAL' || field?.type === 'NEWDECIMAL') {
            const value = field.string();
            return value === null ? null : parseFloat(value);
        }
        return next();
    }
});
