// travel-ai-backend/src/middleware/validation.js
const Joi = require('joi');

const validateItineraryRequest = (req, res, next) => {
  const schema = Joi.object({
    source: Joi.string().min(2).max(100).required(),
    destination: Joi.string().min(2).max(100).required(),
    startDate: Joi.date().min('now').required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    totalBudget: Joi.number().positive().min(100).max(100000).required(),
    travelers: Joi.number().integer().min(1).max(20).default(1),
    tripType: Joi.string().valid('round-trip', 'one-way', 'multi-city').default('round-trip'),
    preferences: Joi.object({
      budget_range: Joi.string().valid('budget', 'mid-range', 'luxury'),
      travel_style: Joi.string().valid('adventure', 'relaxation', 'cultural', 'business'),
      accommodation_type: Joi.string().valid('hotel', 'hostel', 'apartment', 'resort'),
      interests: Joi.array().items(Joi.string()).default([]),
      dietary_restrictions: Joi.array().items(Joi.string()).default([]),
      mobility_requirements: Joi.string().default('none')
    }).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation error', 
      details: error.details[0].message 
    });
  }

  // Additional validation
  const { startDate, endDate } = req.body;
  const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  
  if (daysDiff > 365) {
    return res.status(400).json({
      message: 'Trip duration cannot exceed 365 days'
    });
  }

  if (daysDiff < 1) {
    return res.status(400).json({
      message: 'Trip must be at least 1 day long'
    });
  }

  next();
};

const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
      })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation error', 
      details: error.details[0].message 
    });
  }
  next();
};

module.exports = {
  validateItineraryRequest,
  validateRegistration
};