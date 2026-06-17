const { getAll } = require('../config/db');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { listSessions, createSession, getSession, endSession, deleteSession } = require('../controllers/sessionController');
const { getWeakTopics, getStrongTopics, getAllTopics, markTopicStrong } = require('../services/memoryService');

router.use(auth);

router.get('/', listSessions);
router.post('/', createSession);
router.get('/:id', getSession);
router.patch('/:id/end', endSession);
router.delete('/:id', deleteSession);

router.get('/memory/:subjectId/weak', async (req, res, next) => {
  try {
    const topics = await getWeakTopics(req.user.id, req.params.subjectId);
    res.json({ weakTopics: topics });
  } catch (err) { next(err); }
});

router.get('/memory/:subjectId/strong', async (req, res, next) => {
  try {
    const topics = await getStrongTopics(req.user.id, req.params.subjectId);
    res.json({ strongTopics: topics });
  } catch (err) { next(err); }
});

router.get('/memory/:subjectId/all', async (req, res, next) => {
  try {
    const topics = await getAllTopics(req.user.id, req.params.subjectId);
    res.json({ topics });
  } catch (err) { next(err); }
});

router.patch('/memory/:subjectId/strong/:topic', async (req, res, next) => {
  try {
    await markTopicStrong(req.user.id, req.params.subjectId, req.params.topic);
    res.json({ message: `Topic marked as strong` });
  } catch (err) { next(err); }
});
router.get('/analytics/:subjectId', async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const userId = req.user.id;

    const materials = await getAll(
      'SELECT COUNT(*) as count FROM materials WHERE subject_id = $1 AND user_id = $2',
      [subjectId, userId]
    );

    const sessions = await getAll(
      'SELECT COUNT(*) as count FROM study_sessions WHERE subject_id = $1 AND user_id = $2',
      [subjectId, userId]
    );

    const messages = await getAll(
      `SELECT COUNT(*) as count FROM messages m
       JOIN study_sessions s ON m.session_id = s.id
       WHERE s.subject_id = $1 AND s.user_id = $2 AND m.role = 'user'`,
      [subjectId, userId]
    );

    const questions = await getAll(
      `SELECT COUNT(*) as count FROM questions q
       JOIN study_sessions s ON q.session_id = s.id
       WHERE s.subject_id = $1 AND s.user_id = $2`,
      [subjectId, userId]
    );

    const weakTopics = await getAll(
      "SELECT topic, ask_count FROM topic_memory WHERE user_id = $1 AND subject_id = $2 AND strength = 'weak' ORDER BY ask_count DESC LIMIT 5",
      [userId, subjectId]
    );

    const strongTopics = await getAll(
      "SELECT topic FROM topic_memory WHERE user_id = $1 AND subject_id = $2 AND strength = 'strong' ORDER BY last_seen DESC LIMIT 5",
      [userId, subjectId]
    );

    const allTopics = await getAll(
  'SELECT strength, COUNT(*) as count FROM topic_memory WHERE user_id = $1 AND subject_id = $2 GROUP BY strength',
  [userId, subjectId]
);

const totalTopics = allTopics.reduce((sum, t) => sum + parseInt(t.count), 0);
const strongCount = parseInt(allTopics.find(t => t.strength === 'strong')?.count || 0);
const developingCount = parseInt(allTopics.find(t => t.strength === 'developing')?.count || 0);
const unknownCount = parseInt(allTopics.find(t => t.strength === 'unknown')?.count || 0);
const weakCount = parseInt(allTopics.find(t => t.strength === 'weak')?.count || 0);

let accuracy = 0;
if (totalTopics > 0) {
  const weightedScore = (strongCount * 100) + (developingCount * 60) + (unknownCount * 40) + (weakCount * 10);
  accuracy = Math.round(weightedScore / totalTopics);
}

    res.json({
      pdfsUploaded: parseInt(materials[0]?.count || 0),
      totalSessions: parseInt(sessions[0]?.count || 0),
      questionsAnswered: parseInt(messages[0]?.count || 0),
      questionsAsked: parseInt(questions[0]?.count || 0),
      accuracyPercent: accuracy,
      weakTopics,
      strongTopics,
    });
  } catch (err) { next(err); }
});
module.exports = router;