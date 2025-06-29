const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itinerary_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itinerary',
    required: true
  },
  booking_type: {
    type: String,
    enum: ['flight', 'accommodation', 'activity', 'package'],
    required: true
  },
  booking_details: {
    provider: String,
    confirmation_number: String,
    booking_reference: String,
    total_price: Number,
    currency: String,
    booking_date: Date,
    service_date: Date,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending'
    }
  },
  payment_info: {
    payment_method: String,
    transaction_id: String,
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);