const groq = require('../config/groq');

const ITINERARY_PROMPT = `You are an expert travel planner. Based on the booking information provided, generate a detailed, practical, and exciting travel itinerary.

Create a day-by-day plan that:
- Starts with arrival/check-in and ends with departure
- Suggests must-see attractions and local experiences
- Recommends restaurants and local cuisine
- Accounts for travel times between locations
- Provides practical tips for each destination
- Estimates budget breakdown

Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "tripName": "Descriptive trip name",
  "tripSummary": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "destinations": ["City 1", "City 2"],
    "totalDays": 5,
    "overview": "Brief engaging overview of the trip"
  },
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "location": "City name",
      "theme": "Arrival & First Impressions",
      "activities": [
        {
          "time": "14:00",
          "activity": "Arrive at airport and check in to hotel",
          "duration": "2 hours",
          "location": "Hotel name / Airport",
          "type": "travel"
        }
      ],
      "meals": {
        "breakfast": { "restaurant": null, "cuisine": null, "time": null, "suggestion": null },
        "lunch": { "restaurant": "Local café name", "cuisine": "Local cuisine", "time": "13:00", "suggestion": "Try the local specialty" },
        "dinner": { "restaurant": "Restaurant name", "cuisine": "Italian", "time": "19:30", "suggestion": "Book in advance" }
      },
      "accommodation": {
        "name": "Hotel name from booking",
        "address": "Hotel address",
        "checkInTime": "14:00",
        "checkOutTime": null
      },
      "weatherNote": "Expected weather note"
    }
  ],
  "tips": [
    "Tip 1: Useful travel tip",
    "Tip 2: Another useful tip"
  ],
  "packingList": [
    "Passport and travel documents",
    "Local currency / travel card"
  ],
  "budget": {
    "currency": "INR",
    "estimatedTotal": 50000,
    "breakdown": {
      "flights": 20000,
      "accommodation": 15000,
      "food": 8000,
      "activities": 4000,
      "transport": 2000,
      "misc": 1000
    }
  }
}`;

async function generateItinerary(parsedBookings, tripName) {
  try {
    const bookingSummary = JSON.stringify(parsedBookings, null, 2);

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner who creates detailed, personalized travel itineraries. Always return valid JSON only.',
        },
        {
          role: 'user',
          content: `${ITINERARY_PROMPT}\n\nBooking Information:\n${bookingSummary}\n\nTrip Name hint: ${tripName || 'Auto-detect from bookings'}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const itineraryData = JSON.parse(response.choices[0].message.content);
    return { success: true, data: itineraryData };
  } catch (error) {
    console.error('AI generation error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { generateItinerary };
