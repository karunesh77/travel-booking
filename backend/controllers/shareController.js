const Itinerary = require('../models/Itinerary');
const Comment = require('../models/Comment');

exports.shareItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({ _id: req.params.id, userId: req.user.id });
    if (!itinerary) {
      return res.status(404).json({ success: false, error: 'Itinerary not found' });
    }

    if (!itinerary.shareToken) {
      itinerary.generateShareToken();
    }

    const { allowComments, allowDownload, expiresAt } = req.body;
    itinerary.isShared = true;
    if (allowComments !== undefined) itinerary.shareSettings.allowComments = allowComments;
    if (allowDownload !== undefined) itinerary.shareSettings.allowDownload = allowDownload;
    if (expiresAt) itinerary.shareSettings.expiresAt = new Date(expiresAt);

    await itinerary.save();

    const shareUrl = `${process.env.CLIENT_URL}/shared/${itinerary.shareToken}`;

    res.json({
      success: true,
      message: 'Itinerary shared successfully',
      data: {
        shareToken: itinerary.shareToken,
        shareUrl,
        shareSettings: itinerary.shareSettings,
      },
    });
  } catch (error) {
    console.error('ShareItinerary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.revokeShare = async (req, res) => {
  try {
    const itinerary = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isShared: false, shareToken: null },
      { new: true }
    );

    if (!itinerary) {
      return res.status(404).json({ success: false, error: 'Itinerary not found' });
    }

    res.json({ success: true, message: 'Share link revoked' });
  } catch (error) {
    console.error('RevokeShare error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSharedItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({
      shareToken: req.params.shareToken,
      isShared: true,
    });

    if (!itinerary) {
      return res.status(404).json({ success: false, error: 'Shared itinerary not found or link has expired' });
    }

    if (itinerary.shareSettings.expiresAt && new Date() > itinerary.shareSettings.expiresAt) {
      return res.status(410).json({ success: false, error: 'This share link has expired' });
    }

    res.json({
      success: true,
      data: {
        itinerary,
        shareSettings: itinerary.shareSettings,
      },
    });
  } catch (error) {
    console.error('GetSharedItinerary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({
      shareToken: req.params.shareToken,
      isShared: true,
      'shareSettings.allowComments': true,
    });

    if (!itinerary) {
      return res.status(404).json({ success: false, error: 'Itinerary not found or comments are disabled' });
    }

    const { visitorName, visitorEmail, message } = req.body;
    if (!visitorName || !message) {
      return res.status(400).json({ success: false, error: 'Name and message are required' });
    }

    const comment = await Comment.create({
      itineraryId: itinerary._id,
      shareToken: req.params.shareToken,
      visitorName,
      visitorEmail,
      message,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Comment added', data: { comment } });
  } catch (error) {
    console.error('AddComment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ shareToken: req.params.shareToken })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: { comments } });
  } catch (error) {
    console.error('GetComments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
