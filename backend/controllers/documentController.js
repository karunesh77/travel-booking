const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const Booking = require('../models/Booking');
const Document = require('../models/Document');
const { extractText } = require('../utils/documentExtractor');
const { parseBookingData } = require('../utils/dataParser');

const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

exports.uploadDocuments = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, userId: req.user.id });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const savedDocs = [];

    for (const file of req.files) {
      const fileType = file.mimetype === 'application/pdf' ? 'pdf' : 'image';
      const resourceType = fileType === 'pdf' ? 'raw' : 'image';

      const uploadResult = await uploadToCloudinary(file.buffer, {
        folder: `travel-bookings/${req.user.id}/${booking._id}`,
        resource_type: resourceType,
        public_id: `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`,
      });

      const doc = await Document.create({
        bookingId: booking._id,
        userId: req.user.id,
        fileName: uploadResult.public_id,
        originalName: file.originalname,
        fileType,
        mimeType: file.mimetype,
        fileSize: file.size,
        cloudinaryUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        processingStatus: 'pending',
      });

      savedDocs.push(doc);

      await Booking.findByIdAndUpdate(booking._id, {
        $push: { documents: doc._id },
        status: 'uploaded',
      });

      setImmediate(() => processDocument(doc._id, file.buffer, file.mimetype));
    }

    res.status(201).json({
      success: true,
      message: `${savedDocs.length} document(s) uploaded and processing started`,
      data: { documents: savedDocs },
    });
  } catch (error) {
    console.error('UploadDocuments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

async function processDocument(docId, buffer, mimeType) {
  try {
    await Document.findByIdAndUpdate(docId, { processingStatus: 'extracting' });

    const extractedText = await extractText(buffer, mimeType);
    await Document.findByIdAndUpdate(docId, {
      extractedText,
      processingStatus: 'extracted',
    });

    const parsedData = await parseBookingData(extractedText);
    await Document.findByIdAndUpdate(docId, {
      parsedData,
      processingStatus: 'parsed',
    });

    const doc = await Document.findById(docId);
    await Booking.findByIdAndUpdate(doc.bookingId, { status: 'processed' });
  } catch (error) {
    console.error('Background processing error:', error);
    await Document.findByIdAndUpdate(docId, {
      processingStatus: 'error',
      errorMessage: error.message,
    });
  }
}

exports.getDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, data: { document: doc } });
  } catch (error) {
    console.error('GetDocument error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    if (doc.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(doc.cloudinaryPublicId, {
        resource_type: doc.fileType === 'pdf' ? 'raw' : 'image',
      });
    }

    await Promise.all([
      Document.findByIdAndDelete(doc._id),
      Booking.findByIdAndUpdate(doc.bookingId, { $pull: { documents: doc._id } }),
    ]);

    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    console.error('DeleteDocument error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
