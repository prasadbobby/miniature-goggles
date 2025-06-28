const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trip_details: {
    destination: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    total_days: { type: Number, required: true },
    total_budget: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    travelers: { type: Number, default: 1 }
  },
  ai_generated_plan: {
    flights: [{
      departure: String,
      arrival: String,
      date: Date,
      price: Number,
      airline: String,
      flight_number: String,
      duration: String
    }],
    accommodations: [{
      name: String,
      location: String,
      check_in: Date,
      check_out: Date,
      price_per_night: Number,
      total_price: Number,
      rating: Number,
      amenities: [String]
    }],
    activities: [{
      day: Number,
      time: String,
      activity: String,
      location: String,
      price: Number,
      duration: String,
      description: String
    }],
    daily_itinerary: [{
      day: Number,
      date: Date,
      budget_allocated: Number,
      morning: String,
      afternoon: String,
      evening: String,
      meals: {
        breakfast: String,
        lunch: String,
        dinner: String
      }
    }]
  },
  budget_breakdown: {
    flights: Number,
    accommodation: Number,
    activities: Number,
    food: Number,
    transportation: Number,
    miscellaneous: Number,
    total_spent: Number,
    remaining_budget: Number
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Itinerary', itinerarySchema);