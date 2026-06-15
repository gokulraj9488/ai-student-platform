const { ChromaClient } = require('chromadb');

let client;

function getClient() {
  if (!client) {
    client = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000',
    });
  }
  return client;
}

async function getOrCreateCollection(name) {
  try {
    const c = getClient();
    const collection = await c.getOrCreateCollection({
      name,
      embeddingFunction: null,
    });
    return collection;
  } catch (err) {
    console.error('ChromaDB error:', err.message);
    throw err;
  }
}

async function deleteCollection(name) {
  try {
    const c = getClient();
    await c.deleteCollection({ name });
  } catch (err) {
    console.error(`Failed to delete collection ${name}:`, err.message);
  }
}

module.exports = { getClient, getOrCreateCollection, deleteCollection };