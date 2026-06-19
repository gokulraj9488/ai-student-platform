const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendMessage, getChatHistory, clearHistory, evaluateUserAnswer, startConversation } = require('../controllers/chatController');

router.use(auth);

router.post('/session/:sessionId/start', startConversation);
router.get('/session/:sessionId', getChatHistory);
router.delete('/session/:sessionId', clearHistory);
router.post('/session/:sessionId/evaluate', evaluateUserAnswer);

module.exports = router;