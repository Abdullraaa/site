const express = require('express');
const router = express.Router();

// @route   GET api/products
// @desc    Get all products
// @access  Public
router.get('/', (req, res) => {
  res.send('Products route');
});

module.exports = router;