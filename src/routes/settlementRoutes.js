const express = require('express');

const settlementController = require('../controllers/settlementController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

const router = express.Router();


// --------------------------------------------------
// All settlement routes require authentication
// --------------------------------------------------

router.use(authMiddleware.protect);


// --------------------------------------------------
// GET SETTLEMENT SUMMARY
//
// GET /settlements/group/:groupId
//
// Returns:
// - Member balances
// - Who owes money
// - Who should receive money
// - Suggested settlements
// - Previous settlements
// --------------------------------------------------

router.get(
    '/group/:groupId',
    authorizeMiddleware('group:view'),
    settlementController.getSettlementSummary
);


// --------------------------------------------------
// MARK A SETTLEMENT AS PAID
//
// POST /settlements/mark-paid
//
// Example body:
// {
//     "groupId": "...",
//     "from": "rahul@example.com",
//     "to": "prince@example.com",
//     "amount": 600
// }
// --------------------------------------------------
router.post(
    '/create-order',
    authorizeMiddleware('group:view'),
    settlementController.createSettlementOrder
);
router.post(
    '/verify-payment',
    authorizeMiddleware('group:view'),
    settlementController.verifySettlementPayment
);
router.post(
    '/mark-paid',
    authorizeMiddleware('group:update'),
    settlementController.markAsPaid
);


module.exports = router;