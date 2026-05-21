const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const {
  createBooking, listBookings, getBooking, updateBooking, deleteBooking,
} = require('../controllers/bookingController');

router.use(verifyToken);

router.route('/')
  .get(listBookings)
  .post(createBooking);

router.route('/:id')
  .get(getBooking)
  .put(updateBooking)
  .delete(deleteBooking);

module.exports = router;
