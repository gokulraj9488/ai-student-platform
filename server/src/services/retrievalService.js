const { embedText } = require('../utils/embedder');
const { getOrCreateCollection } = require('../config/chroma');

async function retrieveRelevantChunks(query, subjectId, topK = 3) {
  try {
    const collection = await getOrCreateCollection(`subject_${subjectId}`);
    const queryEmbedding = await embedText(query);

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
    });

    if (!results?.documents?.[0]?.length) {
      console.log('No chunks found for query');
      return [];
    }

    return results.documents[0].map((doc, i) => ({
      document: doc,
      metadata: results.metadatas?.[0]?.[i] || {},
      distance: results.distances?.[0]?.[i] || 0,
    }));
  } catch (err) {
    console.error('Retrieval error:', err.message);
    return [];
  }
}

module.exports = { retrieveRelevantChunks };