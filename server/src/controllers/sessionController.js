const { v4: uuidv4 } = require('uuid');
const { runQuery, getAll, getOne } = require('../config/db');

async function listSessions(req, res, next) {
  try {
    const sessions = await getAll(
      'SELECT * FROM study_sessions WHERE user_id = $1 ORDER BY started_at DESC',
      [req.user.id]
    );
    res.json({ sessions });
  } catch (err) { next(err); }
}

async function createSession(req, res, next) {
  try {
    const { title, subjectId } = req.body;
    if (!title || !subjectId) return res.status(400).json({ error: 'title and subjectId are required' });
    const subject = await getOne(
      'SELECT * FROM subjects WHERE id = $1 AND user_id = $2',
      [subjectId, req.user.id]
    );
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    const id = uuidv4();
    await runQuery(
      'INSERT INTO study_sessions (id, user_id, subject_id, title) VALUES ($1,$2,$3,$4)',
      [id, req.user.id, subjectId, title]
    );
    const session = await getOne('SELECT * FROM study_sessions WHERE id = $1', [id]);
    res.status(201).json({ session });
  } catch (err) { next(err); }
}

async function getSession(req, res, next) {
  try {
    const session = await getOne(
      'SELECT * FROM study_sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const messages = await getAll(
      'SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ session, messages });
  } catch (err) { next(err); }
}

async function endSession(req, res, next) {
  try {
    const session = await getOne(
      'SELECT * FROM study_sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    await runQuery(
      "UPDATE study_sessions SET status = 'completed', ended_at = NOW() WHERE id = $1",
      [req.params.id]
    );
    res.json({ message: 'Session ended successfully' });
  } catch (err) { next(err); }
}

async function deleteSession(req, res, next) {
  try {
    const session = await getOne(
      'SELECT * FROM study_sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    await runQuery('DELETE FROM study_sessions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Session deleted successfully' });
  } catch (err) { next(err); }
}

module.exports = { listSessions, createSession, getSession, endSession, deleteSession };