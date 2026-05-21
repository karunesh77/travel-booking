const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadDocuments, getDocument, deleteDocument } = require('../controllers/documentController');

router.use(verifyToken);

router.post('/booking/:bookingId', upload.array('documents', 10), uploadDocuments);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
