const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getTrendingEvents,
  getEvent,
  updateEvent,
  publishEvent,
  getOrganizerEvents,
  getEventAnalytics,
  getEventParticipants,
  exportParticipants,
  deleteEvent,
  debugAllEvents
} = require('../controllers/eventController');
const { protect, isOrganizer } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getEvents);
router.get('/trending', getTrendingEvents);
router.get('/:id', getEvent);

// Organizer routes
router.post('/', protect, isOrganizer, upload.single('banner'), createEvent);
router.put('/:id', protect, isOrganizer, updateEvent);
router.put('/:id/publish', protect, isOrganizer, publishEvent);
router.delete('/:id', protect, isOrganizer, deleteEvent);

// Organizer dashboard routes
router.get('/organizer/my-events', protect, isOrganizer, getOrganizerEvents);
router.get('/:id/analytics', protect, isOrganizer, getEventAnalytics);
router.get('/:id/participants', protect, isOrganizer, getEventParticipants);
router.get('/:id/export', protect, isOrganizer, exportParticipants);

// Debug route to list all events with key fields
router.get('/debug/all', debugAllEvents);

module.exports = router;
