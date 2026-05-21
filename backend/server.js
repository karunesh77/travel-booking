require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

connectDB();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Travel Bookings API is running', timestamp: new Date() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/itineraries', require('./routes/itineraries'));
app.use('/api/share', require('./routes/share'));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
