const express = require('express');
const groupController = require('../controllers/groupController');
<<<<<<< HEAD
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);
router.post('/create',groupController.createGroup);


router.put('/update', groupController.updateGroup);

router.post('/add-members', groupController.addMembers);

router.post('/remove-members', groupController.removeMembers);

router.get('/email/:email', groupController.getGroupByEmail);

router.get('/status/:status', groupController.getGroupByStatus);

router.get('/audit/:groupId', groupController.getAuditLog);
=======

const router = express.Router();
router.post('/create', groupController.createGroup);
>>>>>>> 0edac7fcac93e712791cc2e891396da2c45d9bb9

module.exports = router;