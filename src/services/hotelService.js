const axios = require('axios');
const logger = require('../utils/logger');

class HotelService {
  constructor() {
    this.mockHotels = [
      {
        name: "Grand Plaza Hotel",
        location: "Downtown",
        price_per_night: 150,
        rating: 4.5,
        amenities: ["WiFi", "Pool", "Gym", "Spa"]
      },
      {
        name: "Budget Inn",
        location: "Airport Area",
        price_per_night: 80,
        rating: 3.5,
        amenities: ["WiFi", "Parking"]
      }
    ];
  }

  async searchHotels(destination, checkIn, checkOut, guests, priceRange) {
    try {
      logger.info(`Searching hotels in ${destination}`);
      
      const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
      
      return this.mockHotels.map(hotel => ({
        ...hotel,
        check_in: checkIn,
        check_out: checkOut,
        total_price: hotel.price_per_night * nights,
        nights,
        guests
      }));
    } catch (error) {
      logger.error('Hotel search error:', error);
      throw new Error('Failed to search hotels');
    }
  }

  async bookHotel(hotelDetails, guestInfo) {
    try {
      const bookingReference = `HT${Date.now()}`;
      
      return {
        booking_reference: bookingReference,
        status: 'confirmed',
        confirmation_number: bookingReference,
        ...hotelDetails
      };
    } catch (error) {
      logger.error('Hotel booking error:', error);
      throw new Error('Failed to book hotel');
    }
  }
}

module.exports = new HotelService();