const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('./src/app');
const { initDB } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

console.log('RESEND:', process.env.RESEND_API_KEY ? 'FOUND' : 'MISSING');
console.log(
  'HF_API_KEY:',
  process.env.HF_API_KEY
    ? `FOUND (${process.env.HF_API_KEY.substring(0, 6)}...)`
    : 'MISSING'
);

console.log(
  'All env keys containing HF or API:',
  Object.keys(process.env).filter(
    k => k.includes('HF') || k.includes('API')
  )
);

async function testHuggingFaceConnection() {
  try {
    console.log('🔍 Testing Hugging Face connectivity...');

    const response = await axios.get('https://huggingface.co', {
      timeout: 10000,
    });

    console.log('✅ HF WEBSITE REACHABLE:', response.status);
  } catch (err) {
    console.error('❌ HF WEBSITE FAILED');
    console.error('Message:', err.message);

    if (err.code) {
      console.error('Code:', err.code);
    }

    if (err.response) {
      console.error('Status:', err.response.status);
    }
  }
}

async function startServer() {
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await testHuggingFaceConnection();

    await initDB();
    console.log('✅ Database initialised');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:');
    console.error(err);
  }
}

startServer();