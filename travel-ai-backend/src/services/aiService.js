// travel-ai-backend/src/services/aiService.js
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.apiKey = config.gemini.apiKey;
    this.baseUrl = config.gemini.baseUrl;
  }

  async generateItinerary(tripData) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key is required but not configured');
      }

      if (!tripData.source || !tripData.destination) {
        throw new Error('Source and destination are required');
      }

      logger.info('Starting itinerary generation for:', {
        source: tripData.source,
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate
      });

      const prompt = this.buildItineraryPrompt(tripData);
      
      logger.info('Calling Gemini API...');
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 8192
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000
        }
      );

      if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('No response from AI service');
      }

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      logger.info('AI Response received, parsing...');
      
      return this.parseItineraryResponse(aiResponse, tripData);
      
    } catch (error) {
      logger.error('AI Service Error:', error);
      throw new Error(`Failed to generate itinerary: ${error.message}`);
    }
  }


buildItineraryPrompt(tripData) {
  const { source, destination, startDate, endDate, totalDays, totalBudget, travelers, preferences } = tripData;
  
  // Ensure we have valid dates
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  // Generate daily prompts with valid ISO dates
  const dailyPrompts = [];
  for (let day = 1; day <= totalDays; day++) {
    const currentDate = new Date(startDateObj);
    currentDate.setDate(startDateObj.getDate() + (day - 1));
    const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    dailyPrompts.push(`
  {
    "day": ${day},
    "date": "${dateStr}",
    "weather": {
      "temperature": ${20 + Math.floor(Math.random() * 10)},
      "condition": "Partly Cloudy",
      "humidity": ${60 + Math.floor(Math.random() * 20)}
    },
    "budget_allocated": ${Math.round(totalBudget / totalDays)},
    "morning": {
      "activity": "${day === 1 ? 'Arrival and hotel check-in' : 'Morning sightseeing activity'}",
      "location": "${day === 1 ? 'Hotel' : 'Tourist area'}",
      "duration": "2-3 hours",
      "cost": ${day === 1 ? 0 : 20 + Math.floor(Math.random() * 20)}
    },
    "afternoon": {
      "activity": "Afternoon exploration of ${destination}",
      "location": "Main attractions",
      "duration": "3-4 hours",
      "cost": ${30 + Math.floor(Math.random() * 30)}
    },
    "evening": {
      "activity": "Evening dining and entertainment",
      "location": "Local restaurant district",
      "duration": "2-3 hours",
      "cost": ${40 + Math.floor(Math.random() * 40)}
    },
    "meals": {
      "breakfast": {
        "restaurant": "Hotel Restaurant",
        "cuisine": "Continental",
        "estimated_cost": 15,
        "location": "Hotel"
      },
      "lunch": {
        "restaurant": "Local Bistro",
        "cuisine": "Local",
        "estimated_cost": 25,
        "location": "City center"
      },
      "dinner": {
        "restaurant": "Traditional Restaurant",
        "cuisine": "Local",
        "estimated_cost": 50,
        "location": "Downtown"
      }
    },
    "transportation": {
      "type": "Public transport + Walking",
      "cost": 10,
      "details": "Metro day pass and walking"
    }
  }`);
  }
  
  return `
You are a professional travel planner. Create a detailed travel itinerary in STRICT JSON format.

TRIP DETAILS:
- Source: ${source}
- Destination: ${destination}
- Travel Dates: ${startDate} to ${endDate} (${totalDays} days)
- Budget: $${totalBudget} USD
- Travelers: ${travelers}
- Preferences: ${JSON.stringify(preferences || {})}

IMPORTANT: 
1. Return ONLY valid JSON without any comments, explanations, markdown formatting, or additional text.
2. All dates must be in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)
3. Use only valid date strings that can be parsed by JavaScript Date constructor

{
  "flights": [
    {
      "type": "outbound",
      "departure_city": "${source}",
      "departure_airport": "XXX",
      "arrival_city": "${destination}",
      "arrival_airport": "YYY",
      "departure_time": "${startDateObj.toISOString()}",
      "arrival_time": "${new Date(startDateObj.getTime() + 8 * 60 * 60 * 1000).toISOString()}",
      "duration": "8h 00m",
      "airline": "Major Airline",
      "flight_number": "MA123",
      "price": ${Math.round(totalBudget * 0.175)},
      "booking_class": "Economy",
      "stops": 0,
      "layover_info": []
    },
    {
      "type": "return",
      "departure_city": "${destination}",
      "departure_airport": "YYY",
      "arrival_city": "${source}",
      "arrival_airport": "XXX",
      "departure_time": "${endDateObj.toISOString()}",
      "arrival_time": "${new Date(endDateObj.getTime() + 8 * 60 * 60 * 1000).toISOString()}",
      "duration": "8h 00m",
      "airline": "Major Airline",
      "flight_number": "MA456",
      "price": ${Math.round(totalBudget * 0.175)},
      "booking_class": "Economy",
      "stops": 0,
      "layover_info": []
    }
  ],
  "accommodations": [
    {
      "name": "Grand Hotel ${destination}",
      "type": "hotel",
      "location": {
        "address": "123 Main Street, ${destination}",
        "city": "${destination}",
        "coordinates": {"lat": 48.8566, "lng": 2.3522}
      },
      "check_in": "${startDateObj.toISOString()}",
      "check_out": "${endDateObj.toISOString()}",
      "nights": ${totalDays - 1},
      "room_type": "Standard Room",
      "price_per_night": ${Math.round(totalBudget * 0.3 / (totalDays - 1))},
      "total_price": ${Math.round(totalBudget * 0.3)},
      "rating": 4.2,
      "amenities": ["WiFi", "Pool", "Gym", "Restaurant"],
      "cancellation_policy": "Free cancellation until 24 hours before check-in"
    }
  ],
  "activities": [
    {
      "day": 1,
      "time": "14:00",
      "activity": "City Walking Tour",
      "category": "sightseeing",
      "location": {
        "name": "Historic Center",
        "address": "Downtown ${destination}",
        "coordinates": {"lat": 48.8566, "lng": 2.3522}
      },
      "price": 25,
      "duration": "3 hours",
      "description": "Explore the historic city center with a local guide",
      "booking_required": true,
      "rating": 4.5,
      "reviews_count": 1250
    }
  ],
  "daily_itinerary": [${dailyPrompts.join(',')}],
  "budget_breakdown": {
    "flights": ${Math.round(totalBudget * 0.35)},
    "accommodation": ${Math.round(totalBudget * 0.30)},
    "activities": ${Math.round(totalBudget * 0.15)},
    "food": ${Math.round(totalBudget * 0.15)},
    "transportation": ${Math.round(totalBudget * 0.05)},
    "shopping": 0,
    "miscellaneous": 0,
    "total_spent": ${Math.round(totalBudget * 0.95)},
    "remaining_budget": ${Math.round(totalBudget * 0.05)},
    "daily_average": ${Math.round(totalBudget / totalDays)}
  }
}

Remember: ALL dates must be valid ISO format strings that can be parsed by JavaScript Date constructor.
`;
}

  parseItineraryResponse(aiResponse, tripData) {
    try {
      logger.info('Parsing AI response...');
      
      let cleanedResponse = aiResponse.trim();
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      cleanedResponse = cleanedResponse.replace(/\/\/.*$/gm, '');
      cleanedResponse = cleanedResponse.replace(/\/\*[\s\S]*?\*\//g, '');
      
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No valid JSON structure found in AI response');
      }
      
      cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      
      logger.info('Attempting to parse cleaned JSON...');
      const parsedData = JSON.parse(cleanedResponse);
      
      logger.info('Successfully parsed AI response');
      
      if (!parsedData) {
        throw new Error('AI response is empty');
      }

      // Process dates in the response
      const processedData = this.processResponseData(parsedData);
      
      return {
        trip_details: {
          source: tripData.source,
          destination: tripData.destination,
          start_date: new Date(tripData.startDate),
          end_date: new Date(tripData.endDate),
          total_days: tripData.totalDays,
          total_budget: tripData.totalBudget,
          currency: 'USD',
          travelers: tripData.travelers,
          trip_type: tripData.tripType || 'round-trip'
        },
        ai_generated_plan: processedData,
        budget_breakdown: processedData.budget_breakdown || {},
        metadata: {
          created_with_ai: true,
          generation_time: new Date(),
          ai_confidence_score: 0.95
        }
      };
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      logger.error('Raw AI response (first 500 chars):', aiResponse.substring(0, 500));
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  processResponseData(data) {
    try {
      // Convert date strings to Date objects where needed
      if (data.flights && Array.isArray(data.flights)) {
        data.flights.forEach(flight => {
          if (flight.departure_time && typeof flight.departure_time === 'string') {
            flight.departure_time = new Date(flight.departure_time);
          }
          if (flight.arrival_time && typeof flight.arrival_time === 'string') {
            flight.arrival_time = new Date(flight.arrival_time);
          }
        });
      }

      if (data.accommodations && Array.isArray(data.accommodations)) {
        data.accommodations.forEach(accommodation => {
          if (accommodation.check_in && typeof accommodation.check_in === 'string') {
            accommodation.check_in = new Date(accommodation.check_in);
          }
          if (accommodation.check_out && typeof accommodation.check_out === 'string') {
            accommodation.check_out = new Date(accommodation.check_out);
          }
        });
      }

      if (data.daily_itinerary && Array.isArray(data.daily_itinerary)) {
        data.daily_itinerary.forEach(day => {
          if (day.date && typeof day.date === 'string') {
            day.date = new Date(day.date);
          }
        });
      }

      return data;
    } catch (error) {
      logger.warn('Error processing response data:', error);
      return data;
    }
  }
}

module.exports = new AIService();