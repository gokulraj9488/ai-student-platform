const axios = require('axios');

const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

async function embedText(text) {
  console.log('HF KEY EXISTS:', !!process.env.HF_API_KEY);

  try {
    const response = await axios.get(
      'https://api-inference.huggingface.co'
    );

    console.log('HF RESPONSE STATUS:', response.status);

    // Return fake embedding so upload can continue
    return new Array(384).fill(0);

  } catch (err) {
    console.error('===== HF TEST FAILED =====');
    console.error('Message:', err.message);
    console.error('Code:', err.code);

    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    }

    throw err;
  }
}
async function embedMany(chunks) {
  const embeddings = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Embedding chunk ${i + 1} of ${chunks.length}...`);

    const embedding = await embedText(chunks[i]);
    embeddings.push(embedding);

    if (i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return embeddings;
}

module.exports = {
  embedText,
  embedMany,
};