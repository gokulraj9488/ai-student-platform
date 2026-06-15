const express = require('express');
const router = express.Router();
const {
  listSubjects,
  createSubject,
  getSubject,
  deleteSubject,
} = require('../controllers/subjectController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', listSubjects);
router.post('/', createSubject);
router.get('/:id', getSubject);
router.delete('/:id', deleteSubject);

module.exports = router;