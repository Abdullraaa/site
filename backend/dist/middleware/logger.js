"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoggerMiddleware = void 0;
const morgan_1 = __importDefault(require("morgan"));
/**
 * Custom morgan token to log request body (for debugging)
 * Only logs in development mode
 */
morgan_1.default.token('body', (req) => {
    if (process.env.NODE_ENV === 'development' && req.body) {
        // Don't log sensitive data like passwords
        const sanitized = { ...req.body };
        if (sanitized.password)
            sanitized.password = '[REDACTED]';
        if (sanitized.token)
            sanitized.token = '[REDACTED]';
        return JSON.stringify(sanitized);
    }
    return '';
});
/**
 * Get appropriate morgan format based on environment
 */
const getLoggerMiddleware = () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
        // Detailed logging for development
        return (0, morgan_1.default)(':method :url :status :response-time ms - :body');
    }
    else {
        // Combined Apache-style logging for production
        return (0, morgan_1.default)('combined');
    }
};
exports.getLoggerMiddleware = getLoggerMiddleware;
