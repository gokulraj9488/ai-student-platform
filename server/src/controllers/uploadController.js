const { v4: uuidv4 } = require('uuid');
const { runQuery, getAll, getOne } = require('../config/db');
const { ingestFile } = require('../services/ingestService');
const fs = require('fs');

async function uploadFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { subjectId } = req.params;
    const subject = await getOne(
      'SELECT * FROM subjects WHERE id = $1 AND user_id = $2',
      [subjectId, req.user.id]
    );
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    const materialId = uuidv4();
    const collectionName = `subject_${subjectId}`;
    await runQuery(
      `INSERT INTO materials
        (id, subject_id, user_id, filename, original_name, mime_type, file_size, storage_path, chroma_collection, parse_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')`,
      [materialId, subjectId, req.user.id, req.file.filename, req.file.originalname,
       req.file.mimetype, req.file.size, req.file.path, collectionName]
    );
    const material = await getOne('SELECT * FROM materials WHERE id = $1', [materialId]);
    res.status(202).json({ message: 'File uploaded, ingestion started', material });
    ingestFile(material).catch(err => console.error('Background ingest error:', err.message));
  } catch (err) { next(err); }
}

async function listMaterials(req, res, next) {
  try {
    const materials = await getAll(
      'SELECT * FROM materials WHERE subject_id = $1 AND user_id = $2 ORDER BY uploaded_at DESC',
      [req.params.subjectId, req.user.id]
    );
    res.json({ materials });
  } catch (err) { next(err); }
}

async function deleteMaterial(req, res, next) {
  try {
    const material = await getOne(
      'SELECT * FROM materials WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!material) return res.status(404).json({ error: 'Material not found' });
    if (fs.existsSync(material.storage_path)) fs.unlinkSync(material.storage_path);
    await runQuery('DELETE FROM materials WHERE id = $1', [material.id]);
    res.json({ message: 'Material deleted successfully' });
  } catch (err) { next(err); }
}

module.exports = { uploadFile, listMaterials, deleteMaterial };