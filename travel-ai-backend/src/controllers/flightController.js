// travel-ai-backend/src/controllers/flightController.js
const bookingService = require('../services/bookingService');
const logger = require('../utils/logger');

class FlightController {
  async searchFlights(req, res) {
    try {
      const { source, destination, departDate, returnDate, passengers, cabinClass } = req.body;
      
      // Validate required fields
      if (!source || !destination || !departDate || !passengers) {
        return res.status(400).json({
          message: 'Missing required fields',
          required: ['source', 'destination', 'departDate', 'passengers']
        });
      }

      const searchParams = {
        source: source.toUpperCase(),
        destination: destination.toUpperCase(),
        departDate,
        returnDate,
        passengers: parseInt(passengers),
        cabinClass: cabinClass || 'ECONOMY'
      };

      logger.info('Searching flights:', searchParams);
      
      const flights = await bookingService.searchFlights(searchParams);
      
      res.json({
        success: true,
        flights,
        searchParams,
        count: flights.length
      });
      
    } catch (error) {
      logger.error('Flight search error:', error);
      res.status(500).json({
        success: false,
        message: 'Flight search failed',
        error: error.message
      });
    }
  }

  async bookFlight(req, res) {
    try {
      const { flightOffer, travelerInfo, paymentInfo } = req.body;
      
      // Validate booking data
      if (!flightOffer || !travelerInfo || !paymentInfo) {
        return res.status(400).json({
          message: 'Missing booking information',
          required: ['flightOffer', 'travelerInfo', 'paymentInfo']
        });
      }

      logger.info('Processing flight booking for user:', req.user._id);
      
      const bookingResult = await bookingService.bookFlight(
        { flightOffer, travelerInfo, paymentInfo },
        req.user._id
      );
      
      res.status(201).json({
        success: true,
        message: 'Flight booked successfully',
        booking: bookingResult.booking,
        confirmationNumber: bookingResult.confirmationNumber,
        pnr: bookingResult.pnr
      });
      
    } catch (error) {
      logger.error('Flight booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Flight booking failed',
        error: error.message
      });
    }
  }

  async getFlightStatus(req, res) {
    try {
      const { pnr } = req.params;
      
      // In a real implementation, you would call airline APIs to get flight status
      // For demo, return mock status
      const status = {
        pnr,
        status: 'Confirmed',
        departure: {
          scheduled: '2025-07-03T08:00:00Z',
          estimated: '2025-07-03T08:15:00Z',
          gate: 'A12',
          terminal: '3'
        },
        arrival: {
          scheduled: '2025-07-03T14:30:00Z',
          estimated: '2025-07-03T14:45:00Z',
          gate: 'B8',
          terminal: '2'
        }
      };
      
      res.json({
        success: true,
        flightStatus: status
      });
      
    } catch (error) {
      logger.error('Flight status error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to fetch flight status'
      });
    }
  }
}

module.exports = new FlightController();