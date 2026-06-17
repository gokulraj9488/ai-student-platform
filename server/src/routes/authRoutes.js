const express = require('express');
const router = express.Router();
const { register, sendRegistrationOTP, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/send-otp', sendRegistrationOTP);
router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);

module.exports = router;