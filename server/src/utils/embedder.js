const axios = require('axios');

const EMBED_DIM = 1024; // Cohere embed-english-v3.0 dimension

async function embedText(text) {
  try {
    const apiKey = process.env.COHERE_API_KEY;

    if (!apiKey) {
      throw new Error('COHERE_API_KEY is not set in environment variables.');
    }

    const response = await axios.post(
      'https://api.cohere.com/v1/embed',
      {
        texts: [text],
        model: 'embed-english-v3.0',
        input_type: 'search_document',
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data.embeddings[0];
  } catch (err) {
    console.error('Embed error:', err.message);
    if (err.response) {
      console.error('Embed error response:', JSON.stringify(err.response.data));
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
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return embeddings;
}

module.exports = { embedText, embedMany };