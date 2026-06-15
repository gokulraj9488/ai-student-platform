const { ollamaEmbed } = require('../config/ollama');

async function embedText(text) {
  try {
    const embedding = await ollamaEmbed(text);
    if (!embedding) throw new Error('Ollama returned empty embedding');
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
  }
  return embeddings;
}

module.exports = { embedText, embedMany };