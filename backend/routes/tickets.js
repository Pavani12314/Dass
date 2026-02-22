const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  purchaseMerchandise,
  uploadPaymentProof,
  getPendingPayments,
  updatePaymentStatus,
  getMyRegistrations,
  getTicket,
  cancelRegistration,
  scanTicket,
  manualOverride,
  getAttendanceStats,
  exportAttendance
} = require('../controllers/ticketController');
const { protect, isParticipant, isOrganizer } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Participant routes
router.get('/my-registrations', protect, isParticipant, getMyRegistrations);
router.post('/register/:eventId', protect, isParticipant, registerForEvent);
router.post('/purchase/:eventId', protect, isParticipant, purchaseMerchandise);
router.post('/:ticketId/payment-proof', protect, isParticipant, upload.single('paymentProof'), uploadPaymentProof);
router.delete('/:ticketId', protect, isParticipant, cancelRegistration);

// Ticket access (participant or organizer)
router.get('/:ticketId', protect, getTicket);

// Organizer routes
router.get('/pending-payments/:eventId', protect, isOrganizer, getPendingPayments);
router.put('/:ticketId/payment-status', protect, isOrganizer, updatePaymentStatus);
router.post('/scan', protect, isOrganizer, scanTicket);
router.post('/:ticketId/manual-override', protect, isOrganizer, manualOverride);
router.get('/attendance/:eventId', protect, isOrganizer, getAttendanceStats);
router.get('/attendance/:eventId/export', protect, isOrganizer, exportAttendance);

module.exports = router;
