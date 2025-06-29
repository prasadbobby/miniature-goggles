const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validateRegistration } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);

module.exports = router;