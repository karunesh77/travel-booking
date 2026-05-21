const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const {
  shareItinerary, revokeShare, getSharedItinerary, addComment, getComments,
} = require('../controllers/shareController');

// Protected routes
router.post('/itineraries/:id', verifyToken, shareItinerary);
router.delete('/itineraries/:id', verifyToken, revokeShare);

// Public routes
router.get('/:shareToken', getSharedItinerary);
router.get('/:shareToken/comments', getComments);
router.post('/:shareToken/comments', addComment);

module.exports = router;
