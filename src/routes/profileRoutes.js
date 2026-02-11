const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const usersController = require('../controllers/profileController');

router.use(authMiddleware.protect);

router.post('/get-user-info', usersController.getUserInfo);

module.exports = router;
