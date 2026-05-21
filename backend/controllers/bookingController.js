const Booking = require('../models/Booking');
const Document = require('../models/Document');
const Itinerary = require('../models/Itinerary');

exports.createBooking = async (req, res) => {
  try {
    const { tripName } = req.body;
    if (!tripName) {
      return res.status(400).json({ success: false, error: 'Trip name is required' });
    }

    const booking = await Booking.create({ userId: req.user.id, tripName });

    res.status(201).json({
      success: true,
      message: 'Booking created',
      data: { booking },
    });
  } catch (error) {
    console.error('CreateBooking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.listBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find({ userId: req.user.id })
        .populate('documents', 'fileName fileType processingStatus')
        .populate('itinerary', 'tripName tripSummary isShared')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: { total, page, pages: Math.ceil(total / limit), limit },
      },
    });
  } catch (error) {
    console.error('ListBookings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('documents')
      .populate('itinerary');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, data: { booking } });
  } catch (error) {
    console.error('GetBooking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const { tripName } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { tripName },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, message: 'Booking updated', data: { booking } });
  } catch (error) {
    console.error('UpdateBooking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    await Promise.all([
      Document.deleteMany({ bookingId: booking._id }),
      booking.itinerary && Itinerary.findByIdAndDelete(booking.itinerary),
      Booking.findByIdAndDelete(booking._id),
    ]);

    res.json({ success: true, message: 'Booking and all associated data deleted' });
  } catch (error) {
    console.error('DeleteBooking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
