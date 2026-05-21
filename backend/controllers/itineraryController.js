const Booking = require('../models/Booking');
const Document = require('../models/Document');
const Itinerary = require('../models/Itinerary');
const { generateItinerary } = require('../utils/aiProcessor');

exports.generate = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, userId: req.user.id })
      .populate('documents');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const processedDocs = booking.documents.filter(d => d.processingStatus === 'parsed');
    if (processedDocs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No processed documents found. Please wait for documents to finish processing.',
      });
    }

    const parsedBookings = processedDocs.map(d => d.parsedData).filter(Boolean);
    const result = await generateItinerary(parsedBookings, booking.tripName);

    if (!result.success) {
      return res.status(500).json({ success: false, error: 'Failed to generate itinerary: ' + result.error });
    }

    const itineraryData = result.data;

    if (booking.itinerary) {
      await Itinerary.findByIdAndDelete(booking.itinerary);
    }

    const itinerary = await Itinerary.create({
      userId: req.user.id,
      bookingId: booking._id,
      tripName: itineraryData.tripName || booking.tripName,
      tripSummary: itineraryData.tripSummary,
      days: itineraryData.days || [],
      tips: itineraryData.tips || [],
      packingList: itineraryData.packingList || [],
      budget: itineraryData.budget,
    });

    await Booking.findByIdAndUpdate(booking._id, {
      itinerary: itinerary._id,
      status: 'itinerary-generated',
      'extractedData.destinations': itineraryData.tripSummary?.destinations || [],
      'extractedData.startDate': itineraryData.tripSummary?.startDate,
      'extractedData.endDate': itineraryData.tripSummary?.endDate,
    });

    res.status(201).json({
      success: true,
      message: 'Itinerary generated successfully',
      data: { itinerary },
    });
  } catch (error) {
    console.error('Generate itinerary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.listItineraries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [itineraries, total] = await Promise.all([
      Itinerary.find({ userId: req.user.id })
        .select('-days')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Itinerary.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      success: true,
      data: {
        itineraries,
        pagination: { total, page, pages: Math.ceil(total / limit), limit },
      },
    });
  } catch (error) {
    console.error('ListItineraries error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({ _id: req.params.id, userId: req.user.id });
    if (!itinerary) {
      return res.status(404).json({ success: false, error: 'Itinerary not found' });
    }
    res.json({ success: true, data: { itinerary } });
  } catch (error) {
    console.error('GetItinerary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateItinerary = async (req, res) => {
  try {
    const { tripName, tips, packingList, budget } = req.body;
    const updates = {};
    if (tripName) updates.tripName = tripName;
    if (tips) updates.tips = tips;
    if (packingList) updates.packingList = packingList;
    if (budget) updates.budget = budget;

    const itinerary = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updates,
      { new: true }
    );

    if (!itinerary) {
      return res.status(404).json({ success: false, error: 'Itinerary not found' });
    }

    res.json({ success: true, message: 'Itinerary updated', data: { itinerary } });
  } catch (error) {
    console.error('UpdateItinerary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({ _id: req.params.id, userId: req.user.id });
    if (!itinerary) {
      return res.status(404).json({ success: false, error: 'Itinerary not found' });
    }

    await Promise.all([
      Itinerary.findByIdAndDelete(itinerary._id),
      Booking.findByIdAndUpdate(itinerary.bookingId, {
        itinerary: null,
        status: 'processed',
      }),
    ]);

    res.json({ success: true, message: 'Itinerary deleted' });
  } catch (error) {
    console.error('DeleteItinerary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
