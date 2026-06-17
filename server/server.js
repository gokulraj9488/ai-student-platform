const app = require('./src/app');
const { initDB } = require('./src/config/db');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

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
  process.exit(1);
}
  }
}

startServer();