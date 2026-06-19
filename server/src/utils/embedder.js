const axios = require('axios');

const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const EMBED_DIM = 384;

async function embedText(text) {
  try {
    const apiKey = process.env.HF_API_KEY; // read fresh every call, not cached at module load

    if (!apiKey) {
      throw new Error('HF_API_KEY is not set in environment variables. Add it to .env or Railway variables.');
    }

    const response = await axios.post(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`,
      { inputs: text, options: { wait_for_model: true } },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const embedding = response.data;

    if (Array.isArray(embedding[0])) {
      return embedding[0];
    }
    return embedding;
  } catch (err) {
    console.error('Embed error:', err.message);
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
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return embeddings;
}

module.exports = { embedText, embedMany };