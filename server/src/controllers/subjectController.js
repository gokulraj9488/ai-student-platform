const { v4: uuidv4 } = require('uuid');
const { runQuery, getAll, getOne } = require('../config/db');
const { deleteCollection } = require('../config/chroma');

async function listSubjects(req, res, next) {
  try {
    const subjects = await getAll(
      'SELECT * FROM subjects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ subjects });
  } catch (err) { next(err); }
}

async function createSubject(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Subject name is required' });
    const id = uuidv4();
    await runQuery(
      'INSERT INTO subjects (id, user_id, name, description) VALUES ($1, $2, $3, $4)',
      [id, req.user.id, name, description || '']
    );
    const subject = await getOne('SELECT * FROM subjects WHERE id = $1', [id]);
    res.status(201).json({ subject });
  } catch (err) { next(err); }
}

async function getSubject(req, res, next) {
  try {
    const subject = await getOne(
      'SELECT * FROM subjects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    const materials = await getAll(
      'SELECT * FROM materials WHERE subject_id = $1 ORDER BY uploaded_at DESC',
      [req.params.id]
    );
    res.json({ subject, materials });
  } catch (err) { next(err); }
}

async function deleteSubject(req, res, next) {
  try {
    const subject = await getOne(
      'SELECT * FROM subjects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    await deleteCollection(`subject_${req.params.id}`);
    await runQuery('DELETE FROM subjects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) { next(err); }
}

module.exports = { listSubjects, createSubject, getSubject, deleteSubject };