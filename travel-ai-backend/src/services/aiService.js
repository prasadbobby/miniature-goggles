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
      const prompt = this.buildItineraryPrompt(tripData);
      
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      return this.parseItineraryResponse(aiResponse, tripData);
      
    } catch (error) {
      logger.error('AI Service Error:', error);
      throw new Error('Failed to generate itinerary');
    }
  }

  buildItineraryPrompt(tripData) {
    const { destination, startDate, endDate, totalDays, totalBudget, travelers, preferences } = tripData;
    
    return `
Create a detailed travel itinerary for the following trip:

Destination: ${destination}
Travel Dates: ${startDate} to ${endDate} (${totalDays} days)
Total Budget: $${totalBudget} USD
Number of Travelers: ${travelers}
Preferences: ${JSON.stringify(preferences)}

Please provide a comprehensive itinerary in JSON format with the following structure:

{
  "flights": [
    {
      "departure": "Origin Airport",
      "arrival": "Destination Airport", 
      "date": "YYYY-MM-DD",
      "price": 500,
      "airline": "Airline Name",
      "flight_number": "XX123",
      "duration": "5h 30m"
    }
  ],
  "accommodations": [
    {
      "name": "Hotel Name",
      "location": "Area/District",
      "check_in": "YYYY-MM-DD",
      "check_out": "YYYY-MM-DD", 
      "price_per_night": 150,
      "total_price": 600,
      "rating": 4.5,
      "amenities": ["WiFi", "Pool", "Gym"]
    }
  ],
  "activities": [
    {
      "day": 1,
      "time": "09:00",
      "activity": "Activity Name",
      "location": "Location",
      "price": 50,
      "duration": "2 hours",
      "description": "Detailed description"
    }
  ],
  "daily_itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "budget_allocated": 200,
      "morning": "Morning activity description",
      "afternoon": "Afternoon activity description", 
      "evening": "Evening activity description",
      "meals": {
        "breakfast": "Restaurant/meal suggestion",
        "lunch": "Restaurant/meal suggestion",
        "dinner": "Restaurant/meal suggestion"
      }
    }
  ],
  "budget_breakdown": {
    "flights": 1000,
    "accommodation": 600,
    "activities": 400,
    "food": 300,
    "transportation": 200,
    "miscellaneous": 100,
    "total_spent": 2600,
    "remaining_budget": 400
  }
}

Make sure the total budget allocation doesn't exceed the provided budget of $${totalBudget}. Include realistic prices and ensure the itinerary is practical and enjoyable.
`;
  }

  parseItineraryResponse(aiResponse, tripData) {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Validate and structure the response
      return {
        trip_details: {
          destination: tripData.destination,
          start_date: new Date(tripData.startDate),
          end_date: new Date(tripData.endDate),
          total_days: tripData.totalDays,
          total_budget: tripData.totalBudget,
          currency: 'USD',
          travelers: tripData.travelers
        },
        ai_generated_plan: parsedData,
        budget_breakdown: parsedData.budget_breakdown || {
          flights: 0,
          accommodation: 0,
          activities: 0,
          food: 0,
          transportation: 0,
          miscellaneous: 0,
          total_spent: 0,
          remaining_budget: tripData.totalBudget
        }
      };
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  async optimizeBudget(itinerary, newBudget) {
    try {
      const prompt = `
Optimize the following travel itinerary for a new budget of $${newBudget}:

Current Itinerary: ${JSON.stringify(itinerary.ai_generated_plan)}
Current Budget Breakdown: ${JSON.stringify(itinerary.budget_breakdown)}

Please provide an optimized version that fits the new budget while maintaining trip quality. Return in the same JSON format.
`;

      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      return this.parseItineraryResponse(aiResponse, { totalBudget: newBudget });
      
    } catch (error) {
      logger.error('Budget optimization error:', error);
      throw new Error('Failed to optimize budget');
    }
  }
}

module.exports = new AIService();