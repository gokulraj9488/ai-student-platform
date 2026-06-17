const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getOne } = require('../config/db');
const { generateOTP, sendOTP } = require('../services/emailService');

// Step 1: Send OTP
async function sendRegistrationOTP(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const existing = await getOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await runQuery(
      'DELETE FROM otp_verifications WHERE email = $1',
      [email]
    );

    await runQuery(
      'INSERT INTO otp_verifications (id, email, otp, expires_at) VALUES ($1, $2, $3, $4)',
      [uuidv4(), email, otp, expires]
    );

    await sendOTP(email, otp);
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('OTP send error:', err.message);
    next(err);
  }
}

// Step 2: Verify OTP + complete registration
async function register(req, res, next) {
  try {
    const { name, email, password, otp } = req.body;
    if (!name || !email || !password || !otp) {
      return res.status(400).json({ error: 'All fields including OTP are required' });
    }

    const otpRecord = await getOne(
      'SELECT * FROM otp_verifications WHERE email = $1 AND otp = $2',
      [email, otp]
    );

    if (!otpRecord) return res.status(400).json({ error: 'Invalid OTP' });

    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    const existing = await getOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await runQuery(
      'INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)',
      [id, name, email, hashed]
    );

    await runQuery('DELETE FROM otp_verifications WHERE email = $1', [email]);

    const token = jwt.sign({ id, name, email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.status(201).json({ token, user: { id, name, email } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await getOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
}

function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, sendRegistrationOTP, login, getMe };