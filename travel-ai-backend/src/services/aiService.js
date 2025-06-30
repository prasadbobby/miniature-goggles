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
      logger.info('Starting AI itinerary generation for:', {
        source: tripData.source,
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate
      });

      if (!this.apiKey) {
        throw new Error('Gemini API key is required but not configured');
      }

      const prompt = this.buildItineraryPrompt(tripData);
      
      logger.info('Calling Gemini API with real data...');
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 8192
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000 // 2 minutes timeout
        }
      );

      if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('No valid response from Gemini API');
      }

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      logger.info('AI Response received successfully, parsing...');
      
      return this.parseItineraryResponse(aiResponse, tripData);
      
    } catch (error) {
      logger.error('AI Service Error:', error);
      
      // If API fails, provide detailed error
      if (error.response) {
        logger.error('API Response Error:', error.response.data);
        throw new Error(`Gemini API Error: ${error.response.data.error?.message || 'Unknown API error'}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to reach Gemini API');
      } else {
        throw new Error(`AI Service Error: ${error.message}`);
      }
    }
  }

  buildItineraryPrompt(tripData) {
    const { source, destination, startDate, endDate, totalDays, totalBudget, travelers, preferences } = tripData;
    
    // Calculate dates for daily itinerary
    const dailyPrompts = [];
    const startDateObj = new Date(startDate);
    
    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(startDateObj);
      currentDate.setDate(startDateObj.getDate() + (day - 1));
      const dateStr = currentDate.toISOString().split('T')[0];
      
      dailyPrompts.push(`Day ${day} (${dateStr})`);
    }
    
    return `
You are an expert travel planner with deep knowledge of global destinations, local culture, and travel logistics. Create a comprehensive, realistic travel itinerary in STRICT JSON format.

TRIP REQUIREMENTS:
- Source: ${source}
- Destination: ${destination} 
- Travel Dates: ${startDate} to ${endDate} (${totalDays} days)
- Budget: $${totalBudget} USD total
- Travelers: ${travelers}
- Preferences: ${JSON.stringify(preferences)}

IMPORTANT FORMATTING RULES:
1. Return ONLY valid JSON without markdown formatting, comments, or explanations
2. All dates must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
3. All prices must be realistic numbers based on current market rates
4. Use real airline codes, airport codes, and hotel names when possible
5. Ensure all data is logically consistent (dates, prices, locations)

Required JSON Structure:
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
      "airline": "Real Airline Name",
      "flight_number": "XX123",
      "price": realistic_price_number,
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
      "departure_time": "${new Date(endDate).toISOString()}",
      "arrival_time": "${new Date(new Date(endDate).getTime() + 8 * 60 * 60 * 1000).toISOString()}",
      "duration": "8h 00m",
      "airline": "Real Airline Name",
      "flight_number": "XX456",
      "price": realistic_price_number,
      "booking_class": "Economy", 
      "stops": 0,
      "layover_info": []
    }
  ],
  "accommodations": [
    {
      "name": "Real Hotel Name in ${destination}",
      "type": "${preferences?.accommodation_type || 'hotel'}",
      "location": {
        "address": "Real address in ${destination}",
        "city": "${destination}",
        "coordinates": {"lat": real_latitude, "lng": real_longitude}
      },
      "check_in": "${startDateObj.toISOString()}",
      "check_out": "${new Date(endDate).toISOString()}",
      "nights": ${totalDays - 1},
      "room_type": "Standard Room",
      "price_per_night": realistic_price_per_night,
      "total_price": realistic_total_price,
      "rating": realistic_rating_between_3_and_5,
      "amenities": ["WiFi", "Pool", "Gym", "Restaurant"],
      "cancellation_policy": "Free cancellation until 24 hours before check-in"
    }
  ],
  "activities": [
    ${Array.from({ length: Math.min(totalDays, 10) }, (_, i) => `
    {
      "day": ${i + 1},
      "time": "realistic_time",
      "activity": "Real activity/attraction in ${destination}",
      "category": "sightseeing/cultural/adventure/etc",
      "location": {
        "name": "Real location name", 
        "address": "Real address in ${destination}",
        "coordinates": {"lat": real_latitude, "lng": real_longitude}
      },
      "price": realistic_price,
      "duration": "realistic_duration", 
      "description": "Detailed description of the activity",
      "booking_required": true_or_false,
      "rating": realistic_rating,
      "reviews_count": realistic_number
    }`).join(',\n')}
  ],
  "daily_itinerary": [
    ${dailyPrompts.map((dayStr, index) => {
      const currentDate = new Date(startDateObj);
      currentDate.setDate(startDateObj.getDate() + index);
      return `
    {
      "day": ${index + 1},
      "date": "${currentDate.toISOString()}",
      "weather": {
        "temperature": realistic_temperature_for_${destination}_in_${new Date(startDate).toLocaleString('default', { month: 'long' })},
        "condition": "realistic_weather_condition",
        "humidity": realistic_humidity_percentage
      },
      "budget_allocated": ${Math.round(totalBudget / totalDays)},
      "morning": "Specific morning activity/sightseeing in ${destination}",
      "afternoon": "Specific afternoon activity/exploration in ${destination}", 
      "evening": "Specific evening activity/dining in ${destination}",
      "meals": {
        "breakfast": "Specific breakfast recommendation with restaurant name in ${destination}",
        "lunch": "Specific lunch recommendation with restaurant name in ${destination}",
        "dinner": "Specific dinner recommendation with restaurant name in ${destination}"
      },
      "transportation": {
        "type": "realistic_transport_method",
        "cost": realistic_daily_transport_cost,
        "details": "specific_transport_details_for_${destination}"
      }
    }`;
    }).join(',\n')}
  ],
  "budget_breakdown": {
    "flights": realistic_flight_cost_for_${travelers}_travelers,
    "accommodation": realistic_accommodation_cost_for_${totalDays - 1}_nights,
    "activities": realistic_activities_cost,
    "food": realistic_food_cost_for_${totalDays}_days,
    "transportation": realistic_local_transport_cost,
    "shopping": realistic_shopping_allowance,
    "miscellaneous": realistic_misc_expenses,
    "total_spent": sum_of_all_above_categories,
    "remaining_budget": ${totalBudget}_minus_total_spent,
    "daily_average": total_spent_divided_by_${totalDays}
  }
}

RESEARCH REQUIREMENTS:
- Use your knowledge of ${destination} to suggest real attractions, restaurants, and activities
- Provide realistic pricing based on current market rates for ${destination}
- Consider seasonal factors for ${new Date(startDate).toLocaleString('default', { month: 'long' })} travel
- Factor in travel style: ${preferences?.travel_style || 'cultural'}
- Budget level: ${preferences?.budget_range || 'mid-range'}
- Accommodation type: ${preferences?.accommodation_type || 'hotel'}

Generate realistic, actionable travel plans that a traveler could actually book and follow.
`;
  }

  parseItineraryResponse(aiResponse, tripData) {
    try {
      logger.info('Parsing AI response...');
      
      // Clean the response
      let cleanedResponse = aiResponse.trim();
      
      // Remove markdown formatting
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Remove comments
      cleanedResponse = cleanedResponse.replace(/\/\/.*$/gm, '');
      cleanedResponse = cleanedResponse.replace(/\/\*[\s\S]*?\*\//g, '');
      
      // Find JSON boundaries
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No valid JSON structure found in AI response');
      }
      
      cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      
      // Parse JSON
      const parsedData = JSON.parse(cleanedResponse);
      
      // Validate required fields
      if (!parsedData.flights || !parsedData.accommodations || !parsedData.daily_itinerary) {
        throw new Error('Missing required fields in AI response');
      }

      // Process and validate dates
      const processedData = this.processAndValidateData(parsedData, tripData);
      
      logger.info('Successfully parsed and validated AI response');
      
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
        budget_breakdown: processedData.budget_breakdown || this.generateFallbackBudget(tripData.totalBudget, tripData.totalDays),
        metadata: {
          created_with_ai: true,
          generation_time: new Date(),
          ai_confidence_score: 0.95
        }
      };
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      logger.error('Raw AI response (first 1000 chars):', aiResponse.substring(0, 1000));
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  processAndValidateData(data, tripData) {
    try {
      // Process flights
      if (data.flights && Array.isArray(data.flights)) {
        data.flights.forEach(flight => {
          if (flight.departure_time && typeof flight.departure_time === 'string') {
            flight.departure_time = new Date(flight.departure_time);
          }
          if (flight.arrival_time && typeof flight.arrival_time === 'string') {
            flight.arrival_time = new Date(flight.arrival_time);
          }
          // Ensure price is a number
          flight.price = Number(flight.price) || 0;
        });
      }

      // Process accommodations
      if (data.accommodations && Array.isArray(data.accommodations)) {
        data.accommodations.forEach(accommodation => {
          if (accommodation.check_in && typeof accommodation.check_in === 'string') {
            accommodation.check_in = new Date(accommodation.check_in);
          }
          if (accommodation.check_out && typeof accommodation.check_out === 'string') {
            accommodation.check_out = new Date(accommodation.check_out);
          }
          // Ensure prices are numbers
          accommodation.price_per_night = Number(accommodation.price_per_night) || 0;
          accommodation.total_price = Number(accommodation.total_price) || 0;
          accommodation.rating = Number(accommodation.rating) || 4.0;
        });
      }

      // Process activities
      if (data.activities && Array.isArray(data.activities)) {
        data.activities.forEach(activity => {
          activity.price = Number(activity.price) || 0;
          activity.rating = Number(activity.rating) || 4.0;
          activity.reviews_count = Number(activity.reviews_count) || 100;
        });
      }

      // Process daily itinerary
      if (data.daily_itinerary && Array.isArray(data.daily_itinerary)) {
        data.daily_itinerary.forEach(day => {
          if (day.date && typeof day.date === 'string') {
            day.date = new Date(day.date);
          }
          day.budget_allocated = Number(day.budget_allocated) || Math.round(tripData.totalBudget / tripData.totalDays);
          
          // Ensure weather data is valid
          if (day.weather) {
            day.weather.temperature = Number(day.weather.temperature) || 20;
            day.weather.humidity = Number(day.weather.humidity) || 60;
          }
          
          // Ensure transportation cost is a number
          if (day.transportation) {
            day.transportation.cost = Number(day.transportation.cost) || 10;
          }
        });
      }

      // Process budget breakdown
      if (data.budget_breakdown) {
        Object.keys(data.budget_breakdown).forEach(key => {
          data.budget_breakdown[key] = Number(data.budget_breakdown[key]) || 0;
        });
      }

      return data;
    } catch (error) {
      logger.warn('Error processing data, using fallback:', error);
      return data;
    }
  }

  generateFallbackBudget(totalBudget, totalDays) {
    return {
      flights: Math.round(totalBudget * 0.35),
      accommodation: Math.round(totalBudget * 0.30),
      activities: Math.round(totalBudget * 0.15),
      food: Math.round(totalBudget * 0.15),
      transportation: Math.round(totalBudget * 0.05),
      shopping: 0,
      miscellaneous: 0,
      total_spent: Math.round(totalBudget * 0.95),
      remaining_budget: Math.round(totalBudget * 0.05),
      daily_average: Math.round(totalBudget / totalDays)
    };
  }

  async optimizeBudget(itinerary, newBudget) {
    try {
      logger.info(`Optimizing budget from ${itinerary.trip_details.total_budget} to ${newBudget}`);
      
      if (!this.apiKey) {
        throw new Error('Gemini API key required for budget optimization');
      }

      const prompt = `
You are a travel budget optimization expert. Adjust this existing itinerary to fit a new budget of $${newBudget}.

EXISTING ITINERARY:
${JSON.stringify(itinerary.ai_generated_plan, null, 2)}

NEW BUDGET: $${newBudget}
ORIGINAL BUDGET: $${itinerary.trip_details.total_budget}

REQUIREMENTS:
1. Maintain the same destinations and dates
2. Adjust accommodation, activities, and dining to fit the new budget
3. Keep the same flight routing but adjust class/airline if needed
4. Return ONLY the updated budget_breakdown object in JSON format
5. Ensure all costs are realistic and add up to the new budget

Return this exact JSON structure:
{
  "flights": updated_flight_cost,
  "accommodation": updated_accommodation_cost,
  "activities": updated_activities_cost,
  "food": updated_food_cost,
  "transportation": updated_transport_cost,
  "shopping": updated_shopping_allowance,
  "miscellaneous": updated_misc_cost,
  "total_spent": sum_of_all_categories,
  "remaining_budget": ${newBudget}_minus_total_spent,
  "daily_average": total_spent_divided_by_days
}
`;

      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000
        }
      );

      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('No valid response from Gemini API for budget optimization');
      }

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      
      // Parse the budget breakdown
      let cleanedResponse = aiResponse.trim();
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No valid JSON in budget optimization response');
      }
      
      const budgetData = JSON.parse(cleanedResponse.substring(jsonStart, jsonEnd + 1));
      
      // Validate budget data
      Object.keys(budgetData).forEach(key => {
        budgetData[key] = Number(budgetData[key]) || 0;
      });

      return {
        ai_generated_plan: itinerary.ai_generated_plan,
        budget_breakdown: budgetData
      };

    } catch (error) {
      logger.error('Budget optimization error:', error);
      
      // Fallback to proportional scaling
      const scaleFactor = newBudget / itinerary.trip_details.total_budget;
      const originalBudget = itinerary.budget_breakdown;
      
      const optimizedBudget = {
        flights: Math.round(originalBudget.flights * scaleFactor),
        accommodation: Math.round(originalBudget.accommodation * scaleFactor),
        activities: Math.round(originalBudget.activities * scaleFactor),
        food: Math.round(originalBudget.food * scaleFactor),
        transportation: Math.round(originalBudget.transportation * scaleFactor),
        shopping: Math.round(originalBudget.shopping * scaleFactor),
        miscellaneous: Math.round(originalBudget.miscellaneous * scaleFactor),
        total_spent: Math.round(newBudget * 0.95),
        remaining_budget: Math.round(newBudget * 0.05),
        daily_average: Math.round(newBudget / itinerary.trip_details.total_days)
      };

      return {
        ai_generated_plan: itinerary.ai_generated_plan,
        budget_breakdown: optimizedBudget
      };
    }
  }
}

module.exports = new AIService();