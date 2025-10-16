
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const feedbackController = require('../controllers/feedbackController');

router.post('/', authenticateToken, feedbackController.submitFeedback);
router.get('/list', authenticateToken, feedbackController.listFeedback);

module.exports = router;
