const Booking = require('../models/Booking');
const Itinerary = require('../models/Itinerary');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class BookingController {
  async createBooking(req, res) {
    try {
      const { itinerary_id, booking_type, booking_details, payment_info } = req.body;

      // Verify itinerary belongs to user
      const itinerary = await Itinerary.findOne({
        _id: itinerary_id,
        user_id: req.user._id
      });

      if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found' });
      }

      // Create booking
      const booking = new Booking({
        user_id: req.user._id,
        itinerary_id,
        booking_type,
        booking_details: {
          ...booking_details,
          confirmation_number: uuidv4(),
          booking_date: new Date()
        },
        payment_info
      });

      await booking.save();

      res.status(201).json({
        message: 'Booking created successfully',
        booking
      });
    } catch (error) {
      logger.error('Create booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getBookings(req, res) {
    try {
      const { page = 1, limit = 10, booking_type, status } = req.query;
      const query = { user_id: req.user._id };
      
      if (booking_type) query.booking_type = booking_type;
      if (status) query['booking_details.status'] = status;

      const bookings = await Booking.find(query)
        .populate('itinerary_id', 'trip_details')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Booking.countDocuments(query);

      res.json({
        bookings,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      logger.error('Get bookings error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getBooking(req, res) {
    try {
      const booking = await Booking.findOne({
        _id: req.params.id,
        user_id: req.user._id
      }).populate('itinerary_id');

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      res.json({ booking });
    } catch (error) {
      logger.error('Get booking error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async updateBookingStatus(req, res) {
    try {
      const { status } = req.body;
      
      const booking = await Booking.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user._id },
        { 'booking_details.status': status },
        { new: true }
      );

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      res.json({
        message: 'Booking status updated successfully',
       booking
     });
   } catch (error) {
     logger.error('Update booking status error:', error);
     res.status(500).json({ message: 'Server error' });
   }
 }

 async cancelBooking(req, res) {
   try {
     const booking = await Booking.findOneAndUpdate(
       { _id: req.params.id, user_id: req.user._id },
       { 
         'booking_details.status': 'cancelled',
         'payment_info.payment_status': 'refunded'
       },
       { new: true }
     );

     if (!booking) {
       return res.status(404).json({ message: 'Booking not found' });
     }

     res.json({
       message: 'Booking cancelled successfully',
       booking
     });
   } catch (error) {
     logger.error('Cancel booking error:', error);
     res.status(500).json({ message: 'Server error' });
   }
 }

 async processPayment(req, res) {
   try {
     const { payment_method, amount } = req.body;
     
     // Simulate payment processing
     const transactionId = uuidv4();
     const paymentStatus = Math.random() > 0.1 ? 'paid' : 'failed';

     const booking = await Booking.findOneAndUpdate(
       { _id: req.params.id, user_id: req.user._id },
       {
         'payment_info.payment_method': payment_method,
         'payment_info.transaction_id': transactionId,
         'payment_info.payment_status': paymentStatus,
         'booking_details.status': paymentStatus === 'paid' ? 'confirmed' : 'pending'
       },
       { new: true }
     );

     if (!booking) {
       return res.status(404).json({ message: 'Booking not found' });
     }

     res.json({
       message: paymentStatus === 'paid' ? 'Payment processed successfully' : 'Payment failed',
       booking,
       payment_status: paymentStatus,
       transaction_id: transactionId
     });
   } catch (error) {
     logger.error('Process payment error:', error);
     res.status(500).json({ message: 'Payment processing failed' });
   }
 }
}

module.exports = new BookingController();