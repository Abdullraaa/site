import { Router } from 'express'
import { body, query, validationResult } from 'express-validator'
import { pool } from '../db'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { ResultSetHeader, RowDataPacket } from 'mysql2'

const router = Router()

/**
 * GET /api/reviews?productId={id}
 * Fetch all reviews for a specific product
 */
router.get(
  '/',
  query('productId').optional().isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError('Invalid query parameters', 400)
    }

    const { productId } = req.query

    try {
      let query = 'SELECT id, product_id, author_name, rating, comment, created_at FROM reviews'
      const params: any[] = []

      if (productId) {
        query += ' WHERE product_id = ?'
        params.push(productId)
      }

      query += ' ORDER BY created_at DESC'

      const [rows] = await pool.query<RowDataPacket[]>(query, params)

      res.json({
        success: true,
        reviews: rows,
        count: rows.length
      })
    } catch (error) {
      console.error('Error fetching reviews:', error)
      throw new AppError('Failed to fetch reviews', 500)
    }
  })
)

/**
 * POST /api/reviews
 * Create a new review for a product
 */
router.post(
  '/',
  [
    body('productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
    body('authorName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Author name must be between 2 and 100 characters')
      .escape(),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Comment must be between 10 and 1000 characters')
      .escape()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          errors: errors.array()
        }
      })
    }

    const { productId, authorName, rating, comment } = req.body

    try {
      // Verify product exists
      const [productRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM products WHERE id = ?',
        [productId]
      )

      if (productRows.length === 0) {
        throw new AppError('Product not found', 404)
      }

      // Insert review
      const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO reviews (product_id, author_name, rating, comment) VALUES (?, ?, ?, ?)',
        [productId, authorName, rating, comment]
      )

      // Fetch the newly created review
      const [newReview] = await pool.query<RowDataPacket[]>(
        'SELECT id, product_id, author_name, rating, comment, created_at FROM reviews WHERE id = ?',
        [result.insertId]
      )

      res.status(201).json({
        success: true,
        review: newReview[0],
        message: 'Review created successfully'
      })
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error creating review:', error)
      throw new AppError('Failed to create review', 500)
    }
  })
)

export default router
