// travel-ai-backend/src/services/bookingService.js
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');
const Booking = require('../models/Booking');
const { v4: uuidv4 } = require('uuid');

class BookingService {
  constructor() {
    this.amadeusConfig = config.apis.amadeus;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get Amadeus access token
  async getAmadeusToken() {
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        'https://test.api.amadeus.com/v1/security/oauth2/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.amadeusConfig.clientId,
          client_secret: this.amadeusConfig.clientSecret
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      logger.error('Amadeus authentication failed:', error);
      throw new Error('Flight booking service unavailable');
    }
  }

  // Search real flights
  async searchFlights(searchParams) {
    try {
      const token = await this.getAmadeusToken();
      const { source, destination, departDate, returnDate, passengers, cabinClass = 'ECONOMY' } = searchParams;

      const response = await axios.get(
        'https://test.api.amadeus.com/v2/shopping/flight-offers',
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            originLocationCode: source,
            destinationLocationCode: destination,
            departureDate: departDate,
            returnDate: returnDate,
            adults: passengers,
            travelClass: cabinClass,
            currencyCode: 'USD',
            max: 20
          }
        }
      );

      return this.formatFlightOffers(response.data);
    } catch (error) {
      logger.error('Flight search error:', error);
      // Fallback to enhanced mock data
      return this.getEnhancedMockFlights(searchParams);
    }
  }

  // Format flight offers from Amadeus
  formatFlightOffers(amadeusData) {
    if (!amadeusData.data || amadeusData.data.length === 0) {
      return [];
    }

    return amadeusData.data.map(offer => {
      const outbound = offer.itineraries[0];
      const returnFlight = offer.itineraries[1];
      
      return {
        id: offer.id,
        source: offer.source,
        outbound: {
          departure: outbound.segments[0].departure,
          arrival: outbound.segments[outbound.segments.length - 1].arrival,
          duration: outbound.duration,
          segments: outbound.segments,
          carrierCode: outbound.segments[0].carrierCode
        },
        return: returnFlight ? {
          departure: returnFlight.segments[0].departure,
          arrival: returnFlight.segments[returnFlight.segments.length - 1].arrival,
          duration: returnFlight.duration,
          segments: returnFlight.segments,
          carrierCode: returnFlight.segments[0].carrierCode
        } : null,
        price: {
          total: parseFloat(offer.price.total),
          currency: offer.price.currency,
          base: parseFloat(offer.price.base)
        },
        validatingAirlineCodes: offer.validatingAirlineCodes,
        travelerPricings: offer.travelerPricings,
        bookingToken: offer.id // Use this for actual booking
      };
    });
  }

  // Enhanced mock flights with realistic data
  getEnhancedMockFlights(searchParams) {
    const { source, destination, departDate, returnDate, passengers } = searchParams;
    
    const airlines = [
      { code: 'AI', name: 'Air India', multiplier: 0.8 },
      { code: '6E', name: 'IndiGo', multiplier: 0.7 },
      { code: 'SG', name: 'SpiceJet', multiplier: 0.75 },
      { code: 'UK', name: 'Vistara', multiplier: 0.9 },
      { code: 'BA', name: 'British Airways', multiplier: 1.2 },
      { code: 'EK', name: 'Emirates', multiplier: 1.3 }
    ];

    // Calculate base price based on route distance and demand
    const basePrice = this.calculateBasePrice(source, destination);
    
    return airlines.map((airline, index) => {
      const price = Math.round(basePrice * airline.multiplier * (0.8 + Math.random() * 0.4));
      const flightNumber = `${airline.code}${Math.floor(Math.random() * 900) + 100}`;
      
      return {
        id: `flight_${index}_${Date.now()}`,
        airline: airline.name,
        flightNumber,
        outbound: {
          departure: {
            iataCode: source,
            at: `${departDate}T${this.getRandomTime()}`
          },
          arrival: {
            iataCode: destination,
            at: `${departDate}T${this.getRandomTime(true)}`
          },
          duration: this.calculateDuration(source, destination),
          stops: Math.random() > 0.7 ? 1 : 0
        },
        return: returnDate ? {
          departure: {
            iataCode: destination,
            at: `${returnDate}T${this.getRandomTime()}`
          },
          arrival: {
            iataCode: source,
            at: `${returnDate}T${this.getRandomTime(true)}`
          },
          duration: this.calculateDuration(destination, source),
          stops: Math.random() > 0.7 ? 1 : 0
        } : null,
        price: {
          total: price * passengers,
          currency: 'USD',
          base: price
        },
        bookingToken: `mock_${uuidv4()}`,
        bookable: true
      };
    });
  }

  // Book flight (real or simulated)
  async bookFlight(bookingData, userId) {
    try {
      const { flightOffer, travelerInfo, paymentInfo } = bookingData;
      
      // For demo purposes, simulate booking process
      // In production, you would call Amadeus Create Order API
      const bookingResult = await this.simulateFlightBooking(flightOffer, travelerInfo, paymentInfo);
      
      // Save booking to database
      const booking = new Booking({
        user_id: userId,
        booking_type: 'flight',
        booking_details: {
          confirmation_number: bookingResult.confirmationNumber,
          booking_reference: bookingResult.pnr,
          provider: 'Amadeus',
          total_price: flightOffer.price.total,
          currency: flightOffer.price.currency,
          booking_date: new Date(),
          service_date: new Date(flightOffer.outbound.departure.at),
          status: 'confirmed',
          flight_details: {
            outbound: flightOffer.outbound,
            return: flightOffer.return,
            passengers: travelerInfo.passengers
          }
        },
        payment_info: {
          payment_method: paymentInfo.method,
          transaction_id: bookingResult.transactionId,
          payment_status: 'paid'
        }
      });

      await booking.save();
      
      return {
        success: true,
        booking,
        confirmationNumber: bookingResult.confirmationNumber,
        pnr: bookingResult.pnr
      };
      
    } catch (error) {
      logger.error('Flight booking error:', error);
      throw new Error('Flight booking failed');
    }
  }

  // Simulate booking process
  async simulateFlightBooking(flightOffer, travelerInfo, paymentInfo) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success/failure (95% success rate)
    if (Math.random() < 0.95) {
      return {
        confirmationNumber: `TravelAI${Date.now()}`,
        pnr: `${this.generatePNR()}`,
        transactionId: `txn_${uuidv4()}`,
        status: 'confirmed'
      };
    } else {
      throw new Error('Payment processing failed');
    }
  }

  // Helper methods
  calculateBasePrice(source, destination) {
    const priceMap = {
      'HYD-VTZ': 150,
      'HYD-BOM': 120,
      'HYD-DEL': 180,
      'HYD-BLR': 80,
      'DEL-LON': 800,
      'BOM-LON': 850,
      'HYD-SIN': 600
    };
    
    const route = `${source}-${destination}`;
    const reverseRoute = `${destination}-${source}`;
    
    return priceMap[route] || priceMap[reverseRoute] || 200;
  }

  calculateDuration(source, destination) {
    const durationMap = {
      'HYD-VTZ': '1h 30m',
      'HYD-BOM': '1h 45m',
      'HYD-DEL': '2h 30m',
      'HYD-BLR': '1h 15m',
      'DEL-LON': '8h 30m',
      'BOM-LON': '9h 15m'
    };
    
    const route = `${source}-${destination}`;
    const reverseRoute = `${destination}-${source}`;
    
    return durationMap[route] || durationMap[reverseRoute] || '2h 00m';
  }

  getRandomTime(isArrival = false) {
    const hour = Math.floor(Math.random() * 24);
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
  }

  generatePNR() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

module.exports = new BookingService();