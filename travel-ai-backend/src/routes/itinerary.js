const express = require('express');
const itineraryController = require('../controllers/itineraryController');
const auth = require('../middleware/auth');
const { validateItineraryRequest } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(auth);

router.post('/generate', validateItineraryRequest, itineraryController.generateItinerary);
router.get('/', itineraryController.getItineraries);
router.get('/:id', itineraryController.getItinerary);
router.put('/:id', itineraryController.updateItinerary);
router.delete('/:id', itineraryController.deleteItinerary);
router.post('/:id/optimize-budget', itineraryController.optimizeBudget);

module.exports = router;