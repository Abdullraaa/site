"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const db_1 = require("../db");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
/**
 * GET /api/reviews?productId={id}
 * Fetch all reviews for a specific product
 */
router.get('/', (0, express_validator_1.query)('productId').optional().isInt({ min: 1 }).withMessage('Product ID must be a positive integer'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Invalid query parameters', 400);
    }
    const { productId } = req.query;
    try {
        let query = 'SELECT id, product_id, author_name, rating, comment, created_at FROM reviews';
        const params = [];
        if (productId) {
            query += ' WHERE product_id = ?';
            params.push(productId);
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await db_1.pool.query(query, params);
        res.json({
            success: true,
            reviews: rows,
            count: rows.length
        });
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        throw new errorHandler_1.AppError('Failed to fetch reviews', 500);
    }
}));
/**
 * POST /api/reviews
 * Create a new review for a product
 */
router.post('/', [
    (0, express_validator_1.body)('productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
    (0, express_validator_1.body)('authorName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Author name must be between 2 and 100 characters')
        .escape(),
    (0, express_validator_1.body)('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    (0, express_validator_1.body)('comment')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Comment must be between 10 and 1000 characters')
        .escape()
], (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                statusCode: 400,
                errors: errors.array()
            }
        });
    }
    const { productId, authorName, rating, comment } = req.body;
    try {
        // Verify product exists
        const [productRows] = await db_1.pool.query('SELECT id FROM products WHERE id = ?', [productId]);
        if (productRows.length === 0) {
            throw new errorHandler_1.AppError('Product not found', 404);
        }
        // Insert review
        const [result] = await db_1.pool.query('INSERT INTO reviews (product_id, author_name, rating, comment) VALUES (?, ?, ?, ?)', [productId, authorName, rating, comment]);
        // Fetch the newly created review
        const [newReview] = await db_1.pool.query('SELECT id, product_id, author_name, rating, comment, created_at FROM reviews WHERE id = ?', [result.insertId]);
        res.status(201).json({
            success: true,
            review: newReview[0],
            message: 'Review created successfully'
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            throw error;
        }
        console.error('Error creating review:', error);
        throw new errorHandler_1.AppError('Failed to create review', 500);
    }
}));
exports.default = router;
