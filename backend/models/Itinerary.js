const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const activitySchema = new mongoose.Schema({
  time: String,
  activity: { type: String, required: true },
  duration: String,
  location: String,
  type: {
    type: String,
    default: 'other',
  },
}, { _id: false });

const mealSchema = new mongoose.Schema({
  restaurant: String,
  cuisine: String,
  time: String,
  suggestion: String,
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  date: Date,
  location: String,
  theme: String,
  activities: [activitySchema],
  meals: {
    breakfast: mealSchema,
    lunch: mealSchema,
    dinner: mealSchema,
  },
  accommodation: {
    name: String,
    address: String,
    checkInTime: String,
    checkOutTime: String,
  },
  weatherNote: String,
}, { _id: false });

const itinerarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  tripName: {
    type: String,
    required: true,
  },
  tripSummary: {
    startDate: Date,
    endDate: Date,
    destinations: [String],
    totalDays: Number,
    coverImage: String,
    overview: String,
  },
  days: [daySchema],
  tips: [String],
  packingList: [String],
  budget: {
    currency: { type: String, default: 'INR' },
    estimatedTotal: Number,
    breakdown: {
      flights: Number,
      accommodation: Number,
      food: Number,
      activities: Number,
      transport: Number,
      misc: Number,
    },
  },
  isShared: {
    type: Boolean,
    default: false,
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true,
    default: null,
  },
  shareSettings: {
    allowComments: { type: Boolean, default: true },
    allowDownload: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
  },
}, {
  timestamps: true,
});

itinerarySchema.index({ userId: 1, createdAt: -1 });
itinerarySchema.index({ shareToken: 1 });

itinerarySchema.methods.generateShareToken = function () {
  this.shareToken = uuidv4().replace(/-/g, '').substring(0, 16);
  this.isShared = true;
  return this.shareToken;
};

module.exports = mongoose.model('Itinerary', itinerarySchema);
