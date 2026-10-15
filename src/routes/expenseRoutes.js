const express = require('express');

const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

const router = express.Router();


// All expense routes require authentication
router.use(authMiddleware.protect);


// --------------------------------------------------
// Create a new expense
// POST /expenses/create
// --------------------------------------------------

router.post(
    '/create',
    authorizeMiddleware('group:update'),
    expenseController.createExpense
);


// --------------------------------------------------
// Get all expenses of a particular group
// GET /expenses/group/:groupId
// --------------------------------------------------

router.get(
    '/group/:groupId',
    authorizeMiddleware('group:view'),
    expenseController.getGroupExpenses
);


module.exports = router;