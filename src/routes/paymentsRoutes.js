const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');
const authMiddleware = require("../middleware/authMiddleware");
// Create order
router.post('/create-order', paymentsController.createOrder);

// Verify order
router.post('/verify-order', paymentsController.verifyOrder);

module.exports = router;
