const express = require('express');
const rbacController = require('../controllers/rbacController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

const router = express.Router();

// All RBAC routes require a valid JWT
router.use(authMiddleware.protect);

// GET  /users/           → list users created by this admin
router.get('/',  authorizeMiddleware('user:view'),   rbacController.getAllUsers);

// POST /users/           → create a new user under this admin
router.post('/', authorizeMiddleware('user:create'), rbacController.create);

// PATCH /users/          → update an existing user
router.patch('/', authorizeMiddleware('user:update'), rbacController.update);

// POST /users/delete     → delete a user
router.post('/delete', authorizeMiddleware('user:delete'), rbacController.delete);

module.exports = router;