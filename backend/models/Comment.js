const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  itineraryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itinerary',
    required: true,
    index: true,
  },
  shareToken: {
    type: String,
    required: true,
  },
  visitorName: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100,
  },
  visitorEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  message: {
    type: String,
    required: [true, 'Comment message is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
  },
  ipAddress: String,
}, {
  timestamps: true,
});

commentSchema.index({ itineraryId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
