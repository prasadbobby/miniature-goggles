// travel-ai-backend/src/models/TripItinerary.js
const mongoose = require('mongoose');

const tripItinerarySchema = new mongoose.Schema({
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
  preferences: {
    budget_range: { type: String, enum: ['budget', 'mid-range', 'luxury'], default: 'mid-range' },
    travel_style: { type: String, enum: ['adventure', 'relaxation', 'cultural', 'business'], default: 'cultural' },
    accommodation_type: { type: String, enum: ['hotel', 'hostel', 'apartment', 'resort'], default: 'hotel' }
  },
  ai_generated_plan: {
    type: mongoose.Schema.Types.Mixed // This allows any structure
  },
  budget_breakdown: {
    type: mongoose.Schema.Types.Mixed // This allows any structure
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  metadata: {
    created_with_ai: { type: Boolean, default: true },
    generation_time: { type: Date, default: Date.now },
    last_updated: { type: Date, default: Date.now },
    ai_confidence_score: Number
  }
}, {
  timestamps: true,
  strict: false // This allows flexible schema
});

// Update the last_updated field before saving
tripItinerarySchema.pre('findOneAndUpdate', function() {
  this.set({ 'metadata.last_updated': new Date() });
});

module.exports = mongoose.model('TripItinerary', tripItinerarySchema);