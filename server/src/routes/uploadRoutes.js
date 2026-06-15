const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadFile,
  listMaterials,
  deleteMaterial,
} = require('../controllers/uploadController');

router.use(auth);

router.post('/:subjectId/upload', upload.single('file'), uploadFile);
router.get('/:subjectId/materials', listMaterials);
router.delete('/materials/:id', deleteMaterial);

module.exports = router;