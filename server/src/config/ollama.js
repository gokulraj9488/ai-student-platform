console.log('=== OLLAMA FILE LOADED ===');
console.log('Commit: 32aa069');
const axios = require('axios');

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

const EMBED_MODEL =
  process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

async function ollamaEmbed(text) {
  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/embeddings`,
      {
        model: EMBED_MODEL,
        prompt: text,
      }
    );

    return response.data.embedding;
  } catch (err) {
    console.error('OLLAMA ERROR:', err.message);

    if (err.response) {
      console.error('Response:', err.response.data);
    }

    throw err;
  }
}

module.exports = {
  ollamaEmbed,
};