// travel-ai-backend/src/services/flightService.js
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class FlightService {
  constructor() {
    this.amadeusConfig = config.flights.amadeus;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    try {
     const response = await axios.post(
       `${this.amadeusConfig.baseUrl}/v1/security/oauth2/token`,
       new URLSearchParams({
         grant_type: 'client_credentials',
         client_id: this.amadeusConfig.clientId,
         client_secret: this.amadeusConfig.clientSecret
       }),
       {
         headers: {
           'Content-Type': 'application/x-www-form-urlencoded'
         }
       }
     );

     this.accessToken = response.data.access_token;
     this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
     
     return this.accessToken;
   } catch (error) {
     logger.error('Failed to get Amadeus access token:', error);
     throw new Error('Flight service authentication failed');
   }
 }

 async searchFlights(searchParams) {
   try {
     const token = await this.getAccessToken();
     const { source, destination, departDate, returnDate, passengers, cabinClass = 'ECONOMY' } = searchParams;

     // Search for flights using Amadeus Flight Offers Search API
     const response = await axios.get(
       `${this.amadeusConfig.baseUrl}/v2/shopping/flight-offers`,
       {
         headers: {
           Authorization: `Bearer ${token}`
         },
         params: {
           originLocationCode: await this.getAirportCode(source),
           destinationLocationCode: await this.getAirportCode(destination),
           departureDate: departDate,
           returnDate: returnDate,
           adults: passengers,
           travelClass: cabinClass,
           currencyCode: 'USD',
           max: 10
         }
       }
     );

     return this.formatFlightResults(response.data);
   } catch (error) {
     logger.error('Flight search error:', error);
     // Fallback to mock data if API fails
     return this.getMockFlights(searchParams);
   }
 }

 async getAirportCode(cityName) {
   try {
     const token = await this.getAccessToken();
     
     const response = await axios.get(
       `${this.amadeusConfig.baseUrl}/v1/reference-data/locations`,
       {
         headers: {
           Authorization: `Bearer ${token}`
         },
         params: {
           keyword: cityName,
           subType: 'AIRPORT',
           'page[limit]': 1
         }
       }
     );

     if (response.data.data && response.data.data.length > 0) {
       return response.data.data[0].iataCode;
     }
     
     // Fallback to common airport codes
     const commonCodes = {
       'new york': 'JFK',
       'london': 'LHR',
       'paris': 'CDG',
       'tokyo': 'NRT',
       'dubai': 'DXB',
       'singapore': 'SIN',
       'los angeles': 'LAX',
       'chicago': 'ORD',
       'madrid': 'MAD',
       'rome': 'FCO'
     };
     
     return commonCodes[cityName.toLowerCase()] || 'JFK';
   } catch (error) {
     logger.warn('Airport code lookup failed:', error);
     return 'JFK'; // Default fallback
   }
 }

 formatFlightResults(amadeusData) {
   if (!amadeusData.data || amadeusData.data.length === 0) {
     return [];
   }

   return amadeusData.data.map(offer => {
     const outbound = offer.itineraries[0];
     const returnFlight = offer.itineraries[1];
     
     return {
       outbound: {
         type: 'outbound',
         departure_city: outbound.segments[0].departure.iataCode,
         departure_airport: outbound.segments[0].departure.iataCode,
         arrival_city: outbound.segments[outbound.segments.length - 1].arrival.iataCode,
         arrival_airport: outbound.segments[outbound.segments.length - 1].arrival.iataCode,
         departure_time: new Date(outbound.segments[0].departure.at),
         arrival_time: new Date(outbound.segments[outbound.segments.length - 1].arrival.at),
         duration: outbound.duration,
         airline: outbound.segments[0].carrierCode,
         flight_number: `${outbound.segments[0].carrierCode}${outbound.segments[0].number}`,
         price: parseFloat(offer.price.total),
         booking_class: outbound.segments[0].cabin,
         stops: outbound.segments.length - 1,
         layover_info: this.getLayoverInfo(outbound.segments)
       },
       return: returnFlight ? {
         type: 'return',
         departure_city: returnFlight.segments[0].departure.iataCode,
         departure_airport: returnFlight.segments[0].departure.iataCode,
         arrival_city: returnFlight.segments[returnFlight.segments.length - 1].arrival.iataCode,
         arrival_airport: returnFlight.segments[returnFlight.segments.length - 1].arrival.iataCode,
         departure_time: new Date(returnFlight.segments[0].departure.at),
         arrival_time: new Date(returnFlight.segments[returnFlight.segments.length - 1].arrival.at),
         duration: returnFlight.duration,
         airline: returnFlight.segments[0].carrierCode,
         flight_number: `${returnFlight.segments[0].carrierCode}${returnFlight.segments[0].number}`,
         price: parseFloat(offer.price.total) / 2, // Approximate split
         booking_class: returnFlight.segments[0].cabin,
         stops: returnFlight.segments.length - 1,
         layover_info: this.getLayoverInfo(returnFlight.segments)
       } : null,
       totalPrice: parseFloat(offer.price.total),
       currency: offer.price.currency,
       validatingAirlineCodes: offer.validatingAirlineCodes,
       travelerPricings: offer.travelerPricings
     };
   });
 }

 getLayoverInfo(segments) {
   const layovers = [];
   for (let i = 0; i < segments.length - 1; i++) {
     const currentArrival = new Date(segments[i].arrival.at);
     const nextDeparture = new Date(segments[i + 1].departure.at);
     const layoverDuration = Math.round((nextDeparture - currentArrival) / (1000 * 60));
     
     layovers.push({
       airport: segments[i].arrival.iataCode,
       duration: `${Math.floor(layoverDuration / 60)}h ${layoverDuration % 60}m`
     });
   }
   return layovers;
 }

 getMockFlights(searchParams) {
   const { source, destination, departDate, returnDate, passengers } = searchParams;
   
   // Generate realistic mock flight data
   const airlines = ['AA', 'DL', 'UA', 'BA', 'LH', 'AF', 'KL', 'SQ'];
   const basePrice = 300 + Math.random() * 800;
   
   return Array.from({ length: 5 }, (_, i) => {
     const airline = airlines[Math.floor(Math.random() * airlines.length)];
     const flightNumber = `${airline}${Math.floor(Math.random() * 9000) + 1000}`;
     
     return {
       outbound: {
         type: 'outbound',
         departure_city: source,
         departure_airport: this.getCityAirport(source),
         arrival_city: destination,
         arrival_airport: this.getCityAirport(destination),
         departure_time: new Date(`${departDate}T${this.getRandomTime()}`),
         arrival_time: new Date(`${departDate}T${this.getRandomTime(true)}`),
         duration: this.getFlightDuration(source, destination),
         airline: this.getAirlineName(airline),
         flight_number: flightNumber,
         price: Math.round(basePrice + (i * 50)),
         booking_class: 'Economy',
         stops: Math.random() > 0.7 ? 1 : 0,
         layover_info: []
       },
       return: returnDate ? {
         type: 'return',
         departure_city: destination,
         departure_airport: this.getCityAirport(destination),
         arrival_city: source,
         arrival_airport: this.getCityAirport(source),
         departure_time: new Date(`${returnDate}T${this.getRandomTime()}`),
         arrival_time: new Date(`${returnDate}T${this.getRandomTime(true)}`),
         duration: this.getFlightDuration(destination, source),
         airline: this.getAirlineName(airline),
         flight_number: `${airline}${Math.floor(Math.random() * 9000) + 1000}`,
         price: Math.round(basePrice + (i * 50)),
         booking_class: 'Economy',
         stops: Math.random() > 0.7 ? 1 : 0,
         layover_info: []
       } : null,
       totalPrice: Math.round((basePrice + (i * 50)) * (returnDate ? 2 : 1) * passengers),
       currency: 'USD'
     };
   });
 }

 getCityAirport(city) {
   const airports = {
     'new york': 'JFK',
     'london': 'LHR',
     'paris': 'CDG',
     'tokyo': 'NRT',
     'dubai': 'DXB',
     'singapore': 'SIN',
     'los angeles': 'LAX',
     'chicago': 'ORD'
   };
   return airports[city.toLowerCase()] || 'XXX';
 }

 getAirlineName(code) {
   const airlines = {
     'AA': 'American Airlines',
     'DL': 'Delta Air Lines',
     'UA': 'United Airlines',
     'BA': 'British Airways',
     'LH': 'Lufthansa',
     'AF': 'Air France',
     'KL': 'KLM',
     'SQ': 'Singapore Airlines'
   };
   return airlines[code] || 'Unknown Airline';
 }

 getRandomTime(isArrival = false) {
   const hour = Math.floor(Math.random() * 24);
   const minute = Math.floor(Math.random() * 60);
   return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
 }

 getFlightDuration(source, destination) {
   // Approximate flight durations based on distance
   const durations = {
     short: ['2h 30m', '3h 15m', '3h 45m'],
     medium: ['5h 30m', '6h 15m', '7h 00m'],
     long: ['9h 30m', '11h 15m', '13h 45m']
   };
   
   const distance = this.calculateDistance(source, destination);
   if (distance < 1000) return durations.short[Math.floor(Math.random() * 3)];
   if (distance < 5000) return durations.medium[Math.floor(Math.random() * 3)];
   return durations.long[Math.floor(Math.random() * 3)];
 }

 calculateDistance(source, destination) {
   // Simplified distance calculation for demo
   return Math.random() * 10000;
 }
}

module.exports = new FlightService();