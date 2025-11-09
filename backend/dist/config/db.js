"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const index_1 = __importDefault(require("./index"));
exports.pool = promise_1.default.createPool({
    host: process.env.DB_HOST || (index_1.default.db && index_1.default.db.host) || '127.0.0.1',
    user: process.env.DB_USER || (index_1.default.db && index_1.default.db.user) || 'root',
    password: process.env.DB_PASSWORD || (index_1.default.db && index_1.default.db.password) || '',
    database: process.env.DB_NAME || (index_1.default.db && index_1.default.db.database) || 'un533n_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    typeCast: (field, next) => {
        if (field.type === 'DECIMAL' || field.type === 'NEWDECIMAL') {
            const value = field.string();
            return value === null ? null : parseFloat(value);
        }
        return next();
    }
});
exports.pool.getConnection().then(() => console.log('MySQL pool created')).catch(err => console.error('MySQL pool error', err));
