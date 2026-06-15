const { ollamaEmbed } = require('../config/ollama');
const { getOrCreateCollection } = require('../config/chroma');

async function retrieveRelevantChunks(query, subjectId, topK = 5) {
  try {
    const collectionName = `subject_${subjectId}`;
    const collection = await getOrCreateCollection(collectionName);

    const queryEmbedding = await ollamaEmbed(query);

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
    });

    if (!results || !results.documents || results.documents[0].length === 0) {
      return [];
    }

    return results.documents[0].map((doc, i) => ({
      document: doc,
      metadata: results.metadatas[0][i],
      distance: results.distances[0][i],
    }));
  } catch (err) {
    console.error('Retrieval error:', err.message);
    return [];
  }
}

module.exports = { retrieveRelevantChunks }; 
