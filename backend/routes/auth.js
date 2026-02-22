const express = require('express');
const router = express.Router();
const { 
  registerParticipant, 
  loginUser, 
  getMe, 
  updatePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerParticipant);
router.post('/login', loginUser);

// Protected routes
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

module.exports = router;
