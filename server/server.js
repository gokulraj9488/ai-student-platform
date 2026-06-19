const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('./src/app');
const { initDB } = require('./src/config/db');
const fs = require('fs');

const PORT = process.env.PORT || 5000;

console.log('RESEND:', process.env.RESEND_API_KEY ? 'FOUND' : 'MISSING');
console.log('HF_API_KEY:', process.env.HF_API_KEY ? `FOUND (${process.env.HF_API_KEY.substring(0,6)}...)` : 'MISSING');
console.log('All env keys containing HF or API:', Object.keys(process.env).filter(k => k.includes('HF') || k.includes('API')));
async function startServer() {
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

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