const express = require('express');
const router = express.Router();
const {
  createOrganizer,
  getAllOrganizers,
  updateOrganizer,
  toggleOrganizer,
  deleteOrganizer,
  getPasswordResetRequests,
  approvePasswordReset,
  rejectPasswordReset,
  getAdminStats,
  getAllEvents
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect, isAdmin);

// Club/Organizer management
router.post('/clubs', createOrganizer);
router.get('/clubs', getAllOrganizers);
router.put('/clubs/:id', updateOrganizer);
router.put('/clubs/:id/toggle', toggleOrganizer);
router.delete('/clubs/:id', deleteOrganizer);

// Password reset requests
router.get('/password-reset-requests', getPasswordResetRequests);
router.post('/password-reset-requests/:id/approve', approvePasswordReset);
router.post('/password-reset-requests/:id/reject', rejectPasswordReset);

// Dashboard stats
router.get('/stats', getAdminStats);
router.get('/events', getAllEvents);

module.exports = router;
