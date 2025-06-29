const Itinerary = require('../models/Itinerary');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

class ItineraryController {
  async generateItinerary(req, res) {
    try {
      const { destination, startDate, endDate, totalBudget, travelers, preferences } = req.body;
      
      // Calculate total days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

      const tripData = {
        destination,
        startDate,
        endDate,
        totalDays,
        totalBudget,
        travelers: travelers || 1,
        preferences: { ...req.user.preferences, ...preferences }
      };

      // Generate itinerary using AI
      const aiGeneratedData = await aiService.generateItinerary(tripData);

      // Create and save itinerary
      const itinerary = new Itinerary({
        user_id: req.user._id,
        ...aiGeneratedData
      });

      await itinerary.save();

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

      const itineraries = await Itinerary.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Itinerary.countDocuments(query);

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
      const itinerary = await Itinerary.findOne({
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
      const itinerary = await Itinerary.findOneAndUpdate(
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
      const itinerary = await Itinerary.findOneAndDelete({
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
      
      const itinerary = await Itinerary.findOne({
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