const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getEventFeedback,
  exportFeedback,
  canSubmitFeedback
} = require('../controllers/feedbackController');
const { protect, isParticipant, isOrganizer } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Participant routes
router.get('/:eventId/can-submit', canSubmitFeedback);
router.post('/:eventId', isParticipant, submitFeedback);

// Organizer routes
router.get('/:eventId', isOrganizer, getEventFeedback);
router.get('/:eventId/export', isOrganizer, exportFeedback);

module.exports = router;
