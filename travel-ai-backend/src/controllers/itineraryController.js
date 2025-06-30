// travel-ai-backend/src/controllers/itineraryController.js
const TripItinerary = require('../models/TripItinerary');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const updateItineraryStatus = (itinerary) => {
  const now = new Date();
  const startDate = new Date(itinerary.trip_details.start_date);
  const endDate = new Date(itinerary.trip_details.end_date);
  
  let newStatus = itinerary.status;
  
  if (itinerary.status !== 'cancelled') {
    if (now < startDate) {
      newStatus = 'confirmed';
    } else if (now >= startDate && now <= endDate) {
      newStatus = 'in_progress';
    } else if (now > endDate) {
      newStatus = 'completed';
    }
  }
  
  // Update status if it changed
  if (newStatus !== itinerary.status) {
    itinerary.status = newStatus;
    itinerary.metadata.last_updated = new Date();
  }
  
  return itinerary;
};

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
        totalBudget: Number(totalBudget),
        travelers: Number(travelers),
        preferences: preferences || {}
      };

      logger.info('Generating itinerary with data:', tripData);

      // Generate itinerary using AI service
      const aiGeneratedData = await aiService.generateItinerary(tripData);

      // Ensure all required fields are present
      if (!aiGeneratedData || !aiGeneratedData.trip_details) {
        throw new Error('Invalid data structure returned from AI service');
      }

      // Create and save itinerary
      const itinerary = new TripItinerary({
        user_id: req.user._id,
        trip_details: aiGeneratedData.trip_details,
        ai_generated_plan: aiGeneratedData.ai_generated_plan || {},
        budget_breakdown: aiGeneratedData.budget_breakdown || {},
        status: 'draft',
        metadata: aiGeneratedData.metadata || {
          created_with_ai: true,
          generation_time: new Date(),
          ai_confidence_score: 0.95
        }
      });

      const savedItinerary = await itinerary.save();
      logger.info('Itinerary saved successfully:', savedItinerary._id);

      res.status(201).json({
        message: 'Itinerary generated successfully',
        itinerary: savedItinerary
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
    
    if (status && status !== 'all') {
      query.status = status;
    }

    let itineraries = await TripItinerary.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Update statuses dynamically
    const updatedItineraries = [];
    for (let itinerary of itineraries) {
      const updatedItinerary = updateItineraryStatus(itinerary);
      if (updatedItinerary.isModified()) {
        await updatedItinerary.save();
      }
      updatedItineraries.push(updatedItinerary);
    }

    const total = await TripItinerary.countDocuments(query);

    res.json({
      itineraries: updatedItineraries,
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
      const { id } = req.params;
      const updateData = { ...req.body };
      
      console.log('Received update data:', JSON.stringify(updateData, null, 2));
      
      // Handle metadata update separately to avoid conflicts
      const metadataUpdate = {};
      if (updateData.metadata) {
        // Preserve existing metadata and update specific fields
        metadataUpdate['metadata.last_updated'] = new Date();
        if (updateData.metadata.created_with_ai !== undefined) {
          metadataUpdate['metadata.created_with_ai'] = updateData.metadata.created_with_ai;
        }
        if (updateData.metadata.generation_time) {
          metadataUpdate['metadata.generation_time'] = updateData.metadata.generation_time;
        }
        if (updateData.metadata.ai_confidence_score !== undefined) {
          metadataUpdate['metadata.ai_confidence_score'] = updateData.metadata.ai_confidence_score;
        }
        
        // Remove metadata from main update data to avoid conflicts
        delete updateData.metadata;
      } else {
        // Just update the last_updated field
        metadataUpdate['metadata.last_updated'] = new Date();
      }

      // Combine the update operations
      const finalUpdateData = {
        ...updateData,
        ...metadataUpdate
      };

      console.log('Final update data:', JSON.stringify(finalUpdateData, null, 2));

      // Find and update the itinerary
      const itinerary = await TripItinerary.findOneAndUpdate(
        { _id: id, user_id: req.user._id },
        { $set: finalUpdateData },
        { 
          new: true, 
          runValidators: true,
          upsert: false
        }
      );

      if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found' });
      }

      console.log('Updated itinerary successfully:', itinerary._id);

      res.json({
        message: 'Itinerary updated successfully',
        itinerary
      });
    } catch (error) {
      console.error('Update itinerary error:', error);
      
      // Provide more specific error messages
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
          message: 'Validation failed', 
          details: validationErrors,
          error: error.message 
        });
      }
      
      if (error.code === 40) { // ConflictingUpdateOperators
        return res.status(400).json({
          message: 'Update conflict detected',
          error: 'Cannot update nested fields with conflicting operations'
        });
      }
      
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
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
      
      if (!newBudget || newBudget <= 0) {
        return res.status(400).json({ message: 'Invalid budget amount' });
      }

      const itinerary = await TripItinerary.findOne({
        _id: req.params.id,
        user_id: req.user._id
      });

      if (!itinerary) {
        return res.status(404).json({ message: 'Itinerary not found' });
      }

      // Use AI to optimize budget
      const optimizedData = await aiService.optimizeBudget(itinerary, newBudget);
      
      // Update itinerary with proper field updates
      const updateData = {
        'ai_generated_plan': optimizedData.ai_generated_plan,
        'budget_breakdown': optimizedData.budget_breakdown,
        'trip_details.total_budget': newBudget,
        'metadata.last_updated': new Date()
      };
      
      const updatedItinerary = await TripItinerary.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user._id },
        { $set: updateData },
        { new: true }
      );

      res.json({
        message: 'Budget optimized successfully',
        itinerary: updatedItinerary
      });
    } catch (error) {
      logger.error('Optimize budget error:', error);
      res.status(500).json({ message: 'Failed to optimize budget' });
    }
  }
}

module.exports = new ItineraryController();