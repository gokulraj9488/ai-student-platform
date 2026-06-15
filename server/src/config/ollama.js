const axios = require('axios');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3';
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

async function ollamaChat(messages, stream = false) {
  const response = await axios.post(
    `${OLLAMA_BASE_URL}/api/chat`,
    { model: CHAT_MODEL, messages, stream },
    { responseType: stream ? 'stream' : 'json' }
  );
  return response.data;
}

async function ollamaEmbed(text) {
  const response = await axios.post(`${OLLAMA_BASE_URL}/api/embeddings`, {
    model: EMBED_MODEL,
    prompt: text,
  });
  return response.data.embedding;
}

module.exports = { ollamaChat, ollamaEmbed };