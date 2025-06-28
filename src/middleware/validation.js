const Joi = require('joi');

const validateItineraryRequest = (req, res, next) => {
  const schema = Joi.object({
    destination: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')).required(),
    totalBudget: Joi.number().positive().required(),
    travelers: Joi.number().integer().min(1).max(20).default(1),
    preferences: Joi.object({
      budget_range: Joi.string().valid('budget', 'mid-range', 'luxury'),
      travel_style: Joi.string().valid('adventure', 'relaxation', 'cultural', 'business'),
      accommodation_type: Joi.string().valid('hotel', 'hostel', 'apartment', 'resort')
    }).optional()
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

const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
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