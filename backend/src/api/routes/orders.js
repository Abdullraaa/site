const express = require('express');
const router = express.Router();

// @route   POST api/orders
// @desc    Create an order
// @access  Public
router.post('/', (req, res) => {
  res.send('Orders route');
});

module.exports = router;