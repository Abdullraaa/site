import morgan from 'morgan'
import { Request, Response } from 'express'

/**
 * Custom morgan token to log request body (for debugging)
 * Only logs in development mode
 */
morgan.token('body', (req: Request) => {
  if (process.env.NODE_ENV === 'development' && req.body) {
    // Don't log sensitive data like passwords
    const sanitized = { ...req.body }
    if (sanitized.password) sanitized.password = '[REDACTED]'
    if (sanitized.token) sanitized.token = '[REDACTED]'
    return JSON.stringify(sanitized)
  }
  return ''
})

/**
 * Get appropriate morgan format based on environment
 */
export const getLoggerMiddleware = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    // Detailed logging for development
    return morgan(':method :url :status :response-time ms - :body')
  } else {
    // Combined Apache-style logging for production
    return morgan('combined')
  }
}
