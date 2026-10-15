const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

const router = express.Router();

// All analytics routes require authentication
router.use(authMiddleware.protect);

// --------------------------------------------------
// GET ANALYTICS SUMMARY FOR THE LOGGED-IN USER
// GET /analytics/summary
// --------------------------------------------------
router.get(
    '/summary',
    authorizeMiddleware('group:view'),
    analyticsController.getSummary
);

module.exports = router;
