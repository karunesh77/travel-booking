const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const {
  generate, listItineraries, getItinerary, updateItinerary, deleteItinerary,
} = require('../controllers/itineraryController');

router.use(verifyToken);

router.get('/', listItineraries);
router.post('/generate/:bookingId', generate);

router.route('/:id')
  .get(getItinerary)
  .put(updateItinerary)
  .delete(deleteItinerary);

module.exports = router;
