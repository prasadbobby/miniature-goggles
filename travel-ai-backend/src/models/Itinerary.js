// travel-ai-backend/src/models/Itinerary.js
const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trip_details: {
    source: { type: String, required: true },
    destination: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    total_days: { type: Number, required: true },
    total_budget: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    travelers: { type: Number, default: 1 },
    trip_type: { type: String, enum: ['round-trip', 'one-way', 'multi-city'], default: 'round-trip' }
  },
  ai_generated_plan: {
    flights: [{
      type: { type: String, enum: ['outbound', 'return'], required: true },
      departure_city: String,
      departure_airport: String,
      arrival_city: String,
      arrival_airport: String,
      departure_time: Date,
      arrival_time: Date,
      duration: String,
      airline: String,
      flight_number: String,
      price: Number,
      booking_class: String,
      stops: Number,
      layover_info: [String]
    }],
    accommodations: [{
      name: String,
      type: { type: String, enum: ['hotel', 'apartment', 'hostel', 'resort'] },
      location: {
        address: String,
        city: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
      check_in: Date,
      check_out: Date,
      nights: Number,
      room_type: String,
      price_per_night: Number,
      total_price: Number,
      rating: Number,
      amenities: [String],
      images: [String],
      cancellation_policy: String
    }],
    activities: [{
      day: Number,
      time: String,
      activity: String,
      category: String,
      location: {
        name: String,
        address: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
      price: Number,
      duration: String,
      description: String,
      booking_required: Boolean,
      rating: Number,
      reviews_count: Number
    }],
    daily_itinerary: [{
      day: Number,
      date: Date,
      weather: {
        temperature: Number,
        condition: String,
        humidity: Number
      },
      budget_allocated: Number,
      morning: {
        activity: String,
        location: String,
        duration: String,
        cost: Number
      },
      afternoon: {
        activity: String,
        location: String,
        duration: String,
        cost: Number
      },
      evening: {
        activity: String,
        location: String,
        duration: String,
        cost: Number
      },
      meals: {
        breakfast: {
          restaurant: String,
          cuisine: String,
          estimated_cost: Number,
          location: String
        },
        lunch: {
          restaurant: String,
          cuisine: String,
          estimated_cost: Number,
          location: String
        },
        dinner: {
          restaurant: String,
          cuisine: String,
          estimated_cost: Number,
          location: String
        }
      },
      transportation: {
        type: String,
        cost: Number,
        details: String
      }
    }]
  },
  budget_breakdown: {
    flights: Number,
    accommodation: Number,
    activities: Number,
    food: Number,
    transportation: Number,
    shopping: Number,
    miscellaneous: Number,
    total_spent: Number,
    remaining_budget: Number,
    daily_average: Number
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  metadata: {
    created_with_ai: { type: Boolean, default: true },
    generation_time: Date,
    last_updated: Date,
    ai_confidence_score: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Itinerary', itinerarySchema);