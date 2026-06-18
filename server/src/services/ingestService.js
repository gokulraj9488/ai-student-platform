const { parseFile } = require('./parserService');
const { chunkText } = require('../utils/chunker');
const { embedMany } = require('../utils/embedder');
const { getOrCreateCollection } = require('../config/chroma');
const { runQuery } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function ingestFile(material) {
  const {
    id: materialId,
    subject_id,
    user_id,
    storage_path,
    mime_type,
    original_name,
  } = material;

  try {
    await runQuery(
      "UPDATE materials SET parse_status = 'processing' WHERE id = $1",
      [materialId]
    );

    const text = await parseFile(storage_path, mime_type);

    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the file');
    }

    const chunks = chunkText(text);
    console.log(`📄 ${original_name}: ${chunks.length} chunks created`);

    const embeddings = await embedMany(chunks);
    console.log(`🔢 ${original_name}: embeddings generated`);

    const collectionName = `subject_${subject_id}`;
    const collection = await getOrCreateCollection(collectionName);

    const ids = chunks.map((_, i) => `${materialId}_chunk_${i}`);
    const metadatas = chunks.map((_, i) => ({
      material_id: materialId,
      subject_id,
      user_id,
      filename: original_name,
      chunk_index: i,
    }));

    await collection.add({
      ids,
      embeddings,
      documents: chunks,
      metadatas,
    });

    console.log(`✅ ${original_name}: stored in ChromaDB collection ${collectionName}`);

    await runQuery(
      "UPDATE materials SET parse_status = 'done', chroma_collection = $1 WHERE id = $2",
      [collectionName, materialId]
    );

    console.log(`✅ ${original_name}: database updated to done`);

  } catch (err) {
    console.error(`❌ Ingest failed for ${original_name}:`);
console.error(err);
console.error(JSON.stringify(err, null, 2));
    try {
      await runQuery(
        "UPDATE materials SET parse_status = 'failed' WHERE id = $1",
        [materialId]
      );
    } catch (dbErr) {
      console.error('Failed to update status:', dbErr.message);
    }
    throw err;
  }
}

module.exports = { ingestFile };