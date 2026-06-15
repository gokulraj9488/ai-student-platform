 const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  sendMessage,
  getChatHistory,
  clearHistory,
} = require('../controllers/chatController');

router.use(auth);

router.post('/session/:sessionId', sendMessage);
router.get('/session/:sessionId', getChatHistory);
router.delete('/session/:sessionId', clearHistory);

module.exports = router;
