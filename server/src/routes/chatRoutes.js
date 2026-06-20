const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendMessage, getChatHistory, clearHistory, evaluateUserAnswer, startConversation } = require('../controllers/chatController');
const { getUsageStatus } = require('../services/llmService');

router.use(auth);

router.get('/usage', (req, res) => {
  res.json(getUsageStatus());
});

router.post('/session/:sessionId/start', startConversation);
router.post('/session/:sessionId/evaluate', evaluateUserAnswer);
router.post('/session/:sessionId', sendMessage);
router.get('/session/:sessionId', getChatHistory);
router.delete('/session/:sessionId', clearHistory);

module.exports = router;