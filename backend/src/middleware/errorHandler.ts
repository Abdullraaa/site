import { Request, Response, NextFunction } from 'express'

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Centralized error handling middleware
 * Catches all errors thrown in the application and formats them consistently
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default to 500 server error
  let statusCode = 500
  let message = 'Internal server error'
  let isOperational = false

  // If it's our custom AppError, use its properties
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
    isOperational = err.isOperational
  } else if (err.name === 'ValidationError') {
    // Handle validation errors
    statusCode = 400
    message = err.message || 'Validation failed'
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401
    message = 'Unauthorized'
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
    })
  }

  // Don't leak error details in production for non-operational errors
  const isDevelopment = process.env.NODE_ENV === 'development'
  const responseMessage = isOperational || isDevelopment ? message : 'Internal server error'
  const responseStack = isDevelopment ? err.stack : undefined

  // Send structured error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: responseMessage,
      statusCode,
      ...(responseStack && { stack: responseStack })
    }
  })
}

/**
 * Catch-all for 404 Not Found errors
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404
    }
  })
}

/**
 * Async handler wrapper to catch async errors and pass them to error middleware
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
