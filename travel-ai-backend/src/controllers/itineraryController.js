// travel-ai-backend/src/controllers/itineraryController.js
const TripItinerary = require('../models/TripItinerary'); // Changed to new model
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

class ItineraryController {
  async generateItinerary(req, res) {
    try {
      const { source, destination, startDate, endDate, totalBudget, travelers, preferences } = req.body;
      
      // Validate required fields
      if (!source || !destination || !startDate || !endDate || !totalBudget || !travelers) {
        return res.status(400).json({
          message: 'Missing required fields',
          required: ['source', 'destination', 'startDate', 'endDate', 'totalBudget', 'travelers'],
          received: { source, destination, startDate, endDate, totalBudget, travelers }
        });
      }

      // Calculate total days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

      if (totalDays <= 0) {
        return res.status(400).json({
          message: 'Invalid date range',
          details: 'End date must be after start date'
        });
      }

      const tripData = {
        source: source.trim(),
        destination: destination.trim(),
        startDate,
        endDate,
        totalDays,
        totalBudget,
        travelers,
        preferences: preferences || {}
      };

      logger.info('Generating itinerary with data:', tripData);

      // Generate itinerary using AI
      const aiGeneratedData = await aiService.generateItinerary(tripData);

      // Create and save itinerary with new model
      const itinerary = new TripItinerary({
        user_id: req.user._id,
        ...aiGeneratedData
      });

      await itinerary.save();

      logger.info('Itinerary saved successfully:', itinerary._id);

      res.status(201).json({
        message: 'Itinerary generated successfully',
        itinerary
      });
    } catch (error) {
      logger.error('Generate itinerary error:', error);
      res.status(500).json({ 
        message: 'Failed to generate itinerary',
        error: error.message 
      });
    }
  }

  async getItineraries(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const query = { user_id: req.user._id };
      
      if (status) {
        query.status = status;
      }

      const itineraries = await TripItinerary.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await TripItinerary.countDocuments(query);

      res.json({
        itineraries,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      logger.error('Get itineraries error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getItinerary(req, res) {
    try {
      const itinerary = await TripItinerary.findOne({
        _id: req.params.id,
        user_id: req.user._id
      });

      if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found' });
      }

      res.json({ itinerary });
    } catch (error) {
      logger.error('Get itinerary error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async updateItinerary(req, res) {
    try {
      const itinerary = await TripItinerary.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user._id },
        req.body,
        { new: true, runValidators: true }
      );

      if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found' });
      }

      res.json({
        message: 'Itinerary updated successfully',
        itinerary
      });
    } catch (error) {
      logger.error('Update itinerary error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async deleteItinerary(req, res) {
    try {
      const itinerary = await TripItinerary.findOneAndDelete({
        _id: req.params.id,
        user_id: req.user._id
      });

      if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found' });
      }

      res.json({ message: 'Itinerary deleted successfully' });
    } catch (error) {
      logger.error('Delete itinerary error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  async optimizeBudget(req, res) {
    try {
      const { newBudget } = req.body;
      
      const itinerary = await TripItinerary.findOne({
        _id: req.params.id,
        user_id: req.user._id
      });

      if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found' });
      }

      // Use AI to optimize budget
      const optimizedData = await aiService.optimizeBudget(itinerary, newBudget);
      
      // Update itinerary
      itinerary.ai_generated_plan = optimizedData.ai_generated_plan;
      itinerary.budget_breakdown = optimizedData.budget_breakdown;
      itinerary.trip_details.total_budget = newBudget;
      
      await itinerary.save();

      res.json({
        message: 'Budget optimized successfully',
        itinerary
      });
    } catch (error) {
      logger.error('Optimize budget error:', error);
      res.status(500).json({ message: 'Failed to optimize budget' });
    }
  }
}

module.exports = new ItineraryController();