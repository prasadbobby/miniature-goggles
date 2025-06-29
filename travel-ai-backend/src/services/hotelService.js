// travel-ai-backend/src/services/hotelService.js
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class HotelService {
  constructor() {
    this.bookingConfig = config.hotels.booking;
  }

  async searchHotels(searchParams) {
    try {
      const { destination, checkIn, checkOut, guests, rooms = 1, priceRange } = searchParams;
      
      // Using Booking.com API or similar
      const coordinates = await this.getDestinationCoordinates(destination);
      
      const response = await axios.get(
        `${this.bookingConfig.baseUrl}/2.4/hotels`,
        {
          headers: {
            'X-Booking-API-Key': this.bookingConfig.apiKey
          },
          params: {
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            checkin: checkIn,
            checkout: checkOut,
            guests: guests,
            rooms: rooms,
            currency: 'USD',
            language: 'en'
          }
        }
      );

      return this.formatHotelResults(response.data, checkIn, checkOut);
    } catch (error) {
      logger.error('Hotel search error:', error);
      return this.getMockHotels(searchParams);
    }
  }

  async getDestinationCoordinates(destination) {
    try {
      // Use Google Places API or OpenWeatherMap
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct`,
        {
          params: {
            q: destination,
            limit: 1,
            appid: config.weather.apiKey
          }
        }
      );

      if (response.data && response.data.length > 0) {
        return {
          lat: response.data[0].lat,
          lng: response.data[0].lon
        };
      }
      
      return { lat: 0, lng: 0 };
    } catch (error) {
      logger.warn('Coordinates lookup failed:', error);
      return { lat: 0, lng: 0 };
    }
  }

  formatHotelResults(hotelData, checkIn, checkOut) {
    if (!hotelData || !hotelData.result) {
      return [];
    }

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));

    return hotelData.result.map(hotel => ({
      name: hotel.hotel_name,
      type: this.getHotelType(hotel.hotel_facilities),
      location: {
        address: hotel.address,
        city: hotel.city,
        coordinates: {
          lat: parseFloat(hotel.latitude),
          lng: parseFloat(hotel.longitude)
        }
      },
      check_in: new Date(checkIn),
      check_out: new Date(checkOut),
      nights: nights,
      room_type: hotel.room_type_name || 'Standard Room',
      price_per_night: parseFloat(hotel.min_total_price) / nights,
      total_price: parseFloat(hotel.min_total_price),
      rating: parseFloat(hotel.review_score) / 2, // Convert from 10-point to 5-point scale
      amenities: this.parseAmenities(hotel.hotel_facilities),
      images: hotel.photos ? hotel.photos.slice(0, 5) : [],
      cancellation_policy: hotel.free_cancellation ? 'Free cancellation' : 'Non-refundable',
      reviews_count: hotel.review_nr || 0,
      distance_from_center: hotel.distance || 'Unknown'
    }));
  }

  getMockHotels(searchParams) {
    const { destination, checkIn, checkOut, guests, priceRange } = searchParams;
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    
    const hotelTypes = ['hotel', 'apartment', 'resort', 'hostel'];
    const hotelNames = [
      'Grand Palace Hotel',
      'Luxury Suites Downtown',
      'Boutique Garden Inn',
      'Modern City Apartment',
      'Seaside Resort & Spa',
      'Historic Heritage Hotel',
      'Business Executive Lodge',
      'Cozy Neighborhood B&B'
    ];

    const amenitiesList = [
      ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant'],
      ['WiFi', 'Kitchen', 'Parking', 'Balcony'],
      ['WiFi', 'Pool', 'Beach Access', 'All-Inclusive'],
      ['WiFi', 'Shared Kitchen', 'Common Area'],
      ['WiFi', 'Business Center', 'Meeting Rooms', 'Concierge']
    ];

    return Array.from({ length: 8 }, (_, i) => {
      const basePrice = priceRange === 'budget' ? 50 : priceRange === 'luxury' ? 300 : 150;
      const priceVariation = Math.random() * 100;
      const pricePerNight = Math.round(basePrice + priceVariation);
      
      return {
        name: hotelNames[i],
        type: hotelTypes[Math.floor(Math.random() * hotelTypes.length)],
        location: {
          address: `${Math.floor(Math.random() * 999) + 1} Main Street, ${destination}`,
          city: destination,
          coordinates: {
            lat: 40.7128 + (Math.random() - 0.5) * 0.1,
            lng: -74.0060 + (Math.random() - 0.5) * 0.1
          }
        },
        check_in: new Date(checkIn),
        check_out: new Date(checkOut),
        nights: nights,
        room_type: ['Standard Room', 'Deluxe Room', 'Suite', 'Studio Apartment'][Math.floor(Math.random() * 4)],
        price_per_night: pricePerNight,
        total_price: pricePerNight * nights,
        rating: 3.5 + Math.random() * 1.5,
        amenities: amenitiesList[Math.floor(Math.random() * amenitiesList.length)],
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
        ],
        cancellation_policy: Math.random() > 0.5 ? 'Free cancellation until 24 hours before check-in' : 'Non-refundable',
        reviews_count: Math.floor(Math.random() * 1000) + 50,
        distance_from_center: `${(Math.random() * 5).toFixed(1)} km`
      };
    });
  }

  getHotelType(facilities) {
    if (!facilities) return 'hotel';
    
    const facilityStr = facilities.join(' ').toLowerCase();
    if (facilityStr.includes('apartment') || facilityStr.includes('kitchen')) return 'apartment';
    if (facilityStr.includes('resort') || facilityStr.includes('beach')) return 'resort';
    if (facilityStr.includes('hostel') || facilityStr.includes('dorm')) return 'hostel';
    return 'hotel';
  }

  parseAmenities(facilities) {
    if (!facilities) return ['WiFi'];
    
    const amenityMap = {
      'wifi': 'WiFi',
      'pool': 'Pool',
      'gym': 'Gym',
      'spa': 'Spa',
      'restaurant': 'Restaurant',
      'parking': 'Parking',
      'air_conditioning': 'Air Conditioning',
      'room_service': 'Room Service',
      'concierge': 'Concierge',
      'business_center': 'Business Center'
    };

    return facilities
      .map(facility => amenityMap[facility.toLowerCase()] || facility)
      .filter(Boolean)
      .slice(0, 6);
  }
}

module.exports = new HotelService();