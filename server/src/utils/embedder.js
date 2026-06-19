const axios = require('axios');

const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const EMBED_DIM = 384;

async function embedText(text) {
  try {
    if (!HF_API_KEY) {
      throw new Error('HF_API_KEY is not set in environment variables. Add it to .env or Railway variables.');
    }

    const response = await axios.post(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`,
      { inputs: text, options: { wait_for_model: true } },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const embedding = response.data;

    // HF returns nested array for batches, flat array for single input
    if (Array.isArray(embedding[0])) {
      return embedding[0];
    }
    return embedding;
  } catch (err) {
    console.error('Embed error:', err.message);
    // Return zero vector so ingest doesn't crash — file still gets stored
    return new Array(EMBED_DIM).fill(0);
  }
}

async function embedMany(chunks) {
  const embeddings = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Embedding chunk ${i + 1} of ${chunks.length}...`);
    const embedding = await embedText(chunks[i]);
    embeddings.push(embedding);
    // Small delay to avoid HF rate limits
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return embeddings;
}

module.exports = { embedText, embedMany };