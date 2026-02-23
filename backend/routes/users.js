const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  completeOnboarding,
  followOrganizer,
  unfollowOrganizer,
  getFollowedOrganizers,
  getUserRegistrations
} = require('../controllers/userController');
const { protect, isParticipant } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/onboarding', isParticipant, completeOnboarding);
router.get('/following', getFollowedOrganizers);
router.get('/registrations', getUserRegistrations);
router.post('/follow/:organizerId', isParticipant, followOrganizer);
router.delete('/follow/:organizerId', isParticipant, unfollowOrganizer);

module.exports = router;
