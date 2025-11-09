"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
/**
 * Custom error class for application errors
 */
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Centralized error handling middleware
 * Catches all errors thrown in the application and formats them consistently
 */
const errorHandler = (err, req, res, next) => {
    // Default to 500 server error
    let statusCode = 500;
    let message = 'Internal server error';
    let isOperational = false;
    // If it's our custom AppError, use its properties
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
    }
    else if (err.name === 'ValidationError') {
        // Handle validation errors
        statusCode = 400;
        message = err.message || 'Validation failed';
    }
    else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
    }
    // Log error for debugging (in production, this should go to a logging service)
    if (!isOperational || statusCode >= 500) {
        console.error('[ERROR]', {
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
    }
    // Don't leak error details in production for non-operational errors
    const isDevelopment = process.env.NODE_ENV === 'development';
    const responseMessage = isOperational || isDevelopment ? message : 'Internal server error';
    const responseStack = isDevelopment ? err.stack : undefined;
    // Send structured error response
    res.status(statusCode).json({
        success: false,
        error: {
            message: responseMessage,
            statusCode,
            ...(responseStack && { stack: responseStack })
        }
    });
};
exports.errorHandler = errorHandler;
/**
 * Catch-all for 404 Not Found errors
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.path} not found`,
            statusCode: 404
        }
    });
};
exports.notFoundHandler = notFoundHandler;
/**
 * Async handler wrapper to catch async errors and pass them to error middleware
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
