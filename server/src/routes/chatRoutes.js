const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendMessage, getChatHistory, clearHistory, evaluateUserAnswer } = require('../controllers/chatController');

router.use(auth);

router.post('/session/:sessionId', sendMessage);
router.get('/session/:sessionId', getChatHistory);
router.delete('/session/:sessionId', clearHistory);
router.post('/session/:sessionId/evaluate', evaluateUserAnswer);

module.exports = router;