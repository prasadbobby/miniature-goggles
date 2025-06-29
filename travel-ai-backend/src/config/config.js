// travel-ai-backend/src/config/config.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-ai'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: '7d'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
  },
  weather: {
    apiKey: process.env.OPENWEATHER_API_KEY || null,
    baseUrl: 'https://api.openweathermap.org/data/2.5'
  },
  places: {
    apiKey: process.env.GOOGLE_PLACES_API_KEY || null,
    baseUrl: 'https://maps.googleapis.com/maps/api/place'
  },
  apis: {
    amadeus: {
      clientId: process.env.AMADEUS_CLIENT_ID || null,
      clientSecret: process.env.AMADEUS_CLIENT_SECRET || null
    }
  }
};