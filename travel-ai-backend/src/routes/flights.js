// travel-ai-backend/src/routes/flights.js
const express = require('express');
const flightController = require('../controllers/flightController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth); // All flight routes require authentication

router.post('/search', flightController.searchFlights);
router.post('/book', flightController.bookFlight);
router.get('/status/:pnr', flightController.getFlightStatus);

module.exports = router;