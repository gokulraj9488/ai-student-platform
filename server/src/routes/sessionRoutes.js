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

module.exports = router;