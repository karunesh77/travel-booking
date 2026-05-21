const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ['pdf', 'image'],
    required: true,
  },
  mimeType: String,
  fileSize: Number,
  cloudinaryUrl: String,
  cloudinaryPublicId: String,
  extractedText: {
    type: String,
    default: '',
  },
  parsedData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'extracting', 'extracted', 'parsed', 'error'],
    default: 'pending',
  },
  errorMessage: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

documentSchema.index({ bookingId: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
