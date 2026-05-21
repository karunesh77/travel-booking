const mongoose = require('mongoose');

const travelerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tripName: {
    type: String,
    required: [true, 'Trip name is required'],
    trim: true,
    maxlength: [200, 'Trip name cannot exceed 200 characters'],
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  }],
  itinerary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itinerary',
    default: null,
  },
  extractedData: {
    destinations: [String],
    startDate: Date,
    endDate: Date,
    travelers: [travelerSchema],
  },
  status: {
    type: String,
    enum: ['created', 'uploaded', 'processed', 'itinerary-generated'],
    default: 'created',
  },
}, {
  timestamps: true,
});

bookingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
