const express = require('express');
const router = express.Router();
const {
  getOrganizers,
  getOrganizer,
  getOrganizerPublicEvents,
  getOrganizerProfile,
  getOrganizerEvents,
  getOrganizerRegistrations,
  updateOrganizerProfile,
  getDashboardStats,
  requestPasswordReset,
  getCompletedEventsStats
} = require('../controllers/organizerController');
const { protect, isOrganizer } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Organizer only routes (must be before :id routes to avoid conflicts)
router.get('/profile', protect, isOrganizer, getOrganizerProfile);
router.put('/profile', protect, isOrganizer, upload.single('logo'), updateOrganizerProfile);
router.get('/stats', protect, isOrganizer, getDashboardStats);
router.get('/events', protect, isOrganizer, getOrganizerEvents);
router.get('/registrations', protect, isOrganizer, getOrganizerRegistrations);
router.get('/completed-stats', protect, isOrganizer, getCompletedEventsStats);
router.post('/request-password-reset', protect, isOrganizer, requestPasswordReset);

// Public routes
router.get('/', getOrganizers);
router.get('/:id', getOrganizer);
router.get('/:id/events', getOrganizerPublicEvents);

module.exports = router;
