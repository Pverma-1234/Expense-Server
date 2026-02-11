// const express = require('express');
// const router = express.Router();
// const paymentsController = require('../controllers/paymentsController');
// const authMiddleware = require("../middleware/authMiddleware");
// const authorizeMiddleware = require('../middlewares/authorizeMiddleware');
// const { route } = require('./rbacRoutes');
// // Create order
// router.post('/create-order', authorizeMiddleware('payment:create'),paymentsController.createOrder);

// // Verify order
// router.post('/verify-order', authorizeMiddleware('payment:create'),paymentsController.verifyOrder);
// route.post('/create-subscription',authorizeMiddleware('payment:create'),paymentsController.createSubscription);
// route.post('/capture-subscription',authorizeMiddleware('payment: create'),paymentsController.aptureSubscription);

// module.exports = router;
const express = require('express');
const router = express.Router();

const paymentsController = require('../controllers/paymentsController');
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

// Create order
router.post(
  '/create-order',
  authMiddleware.protect,
  authorizeMiddleware('payment:create'),
  paymentsController.createOrder
);

// Verify order
router.post(
  '/verify-order',
  authMiddleware.protect,
  authorizeMiddleware('payment:create'),
  paymentsController.verifyOrder
);

// Optional subscription routes (only if implemented)
router.post(
  '/create-subscription',
  authMiddleware.protect,
  authorizeMiddleware('payment:create'),
  paymentsController.createSubscription
);

router.post(
  '/capture-subscription',
  authMiddleware.protect,
  authorizeMiddleware('payment:create'),
  paymentsController.captureSubscription
);

module.exports = router;
