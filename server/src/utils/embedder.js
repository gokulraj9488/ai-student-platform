const axios = require('axios');

const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

async function embedText(text) {
  try {
    const apiKey = process.env.HF_API_KEY;

    if (!apiKey) {
      throw new Error('HF_API_KEY is missing');
    }

    const url =
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`;

    console.log('Calling HF URL:', url);

    const response = await axios.post(
      url,
      {
        inputs: text.substring(0, 1000),
        options: {
          wait_for_model: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('HF Success');

    const embedding = response.data;

    if (Array.isArray(embedding[0])) {
      return embedding[0];
    }

    return embedding;
  } catch (err) {
    console.error('===== HF ERROR =====');
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