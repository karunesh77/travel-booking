const groq = require('../config/groq');

const PARSE_PROMPT = `You are a travel document parser. Extract structured information from the following travel document text.

Identify the document type (flight/hotel/train/bus/other) and extract all relevant fields.

Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "documentType": "flight|hotel|train|bus|other",
  "confidence": 0.0-1.0,
  "data": {
    "flightNumber": "",
    "airline": "",
    "departureAirport": "",
    "arrivalAirport": "",
    "departureCity": "",
    "arrivalCity": "",
    "departureDate": "YYYY-MM-DD",
    "departureTime": "HH:MM",
    "arrivalDate": "YYYY-MM-DD",
    "arrivalTime": "HH:MM",
    "passengerName": "",
    "seatNumber": "",
    "bookingReference": "",
    "hotelName": "",
    "address": "",
    "city": "",
    "checkInDate": "YYYY-MM-DD",
    "checkOutDate": "YYYY-MM-DD",
    "checkInTime": "",
    "checkOutTime": "",
    "roomType": "",
    "guestName": "",
    "nights": 0,
    "trainNumber": "",
    "operator": "",
    "departureStation": "",
    "arrivalStation": ""
  }
}

Only include fields relevant to the document type. Use null for missing values.
Document text:`;

async function parseBookingData(extractedText) {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: `${PARSE_PROMPT}\n\n${extractedText.substring(0, 4000)}` },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Data parsing error:', error);
    return {
      documentType: 'other',
      confidence: 0,
      data: { rawText: extractedText.substring(0, 500) },
    };
  }
}

module.exports = { parseBookingData };
