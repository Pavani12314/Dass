const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const Organizer = require('../models/Organizer');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'felicity.events@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Generate QR code
const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(JSON.stringify(data));
  } catch (error) {
    console.error('QR generation error:', error);
    return null;
  }
};

// Send ticket email
const sendTicketEmail = async (user, event, registration) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'felicity.events@gmail.com',
      to: user.email,
      subject: `Registration Confirmed - ${event.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #667eea;">🎉 Registration Confirmed!</h1>
          <p>Hello ${user.firstName},</p>
          <p>Your registration for <strong>${event.name}</strong> has been confirmed.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Ticket Details</h3>
            <p><strong>Ticket ID:</strong> ${registration.ticketId}</p>
            <p><strong>Event:</strong> ${event.name}</p>
            <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
            <p><strong>Venue:</strong> ${event.venue || 'TBA'}</p>
          </div>
          <p>Please present your QR code at the venue for entry.</p>
          <img src="${registration.qrCode}" alt="QR Code" style="max-width: 200px;"/>
          <p style="color: #888; font-size: 12px;">This is an automated email from Felicity Event Management System.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// @desc    Register for an event
// @route   POST /api/tickets/register/:eventId
// @access  Private (Participants only)
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('organizer');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is published
    if (event.status !== 'published' && event.status !== 'ongoing') {
      return res.status(400).json({ message: 'Event is not open for registration' });
    }

    // Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check registration limit
    if (event.registrationLimit && event.registrationCount >= event.registrationLimit) {
      return res.status(400).json({ message: 'Registration limit reached' });
    }

    // Check eligibility
    const user = await User.findById(req.user._id);
    if (event.eligibility === 'iiit-only' && user.participantType !== 'iiit') {
      return res.status(403).json({ message: 'This event is only for IIIT participants' });
    }
    if (event.eligibility === 'non-iiit-only' && user.participantType !== 'non-iiit') {
      return res.status(403).json({ message: 'This event is only for non-IIIT participants' });
    }

    // Check if already registered
    const existingReg = await Registration.findOne({
      event: event._id,
      participant: req.user._id
    });

    if (existingReg) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Generate ticket ID and QR code
    const ticketId = `FEL-${uuidv4().substring(0, 8).toUpperCase()}`;
    const qrData = {
      ticketId,
      eventId: event._id,
      participantId: req.user._id,
      eventName: event.name
    };
    const qrCode = await generateQRCode(qrData);

    // Create registration
    const registration = await Registration.create({
      event: event._id,
      participant: req.user._id,
      ticketId,
      qrCode,
      status: 'registered',
      formResponses: req.body.formResponses || {}
    });

    // Update event registration count
    event.registrationCount += 1;
    if (!event.formLocked && event.customFields.length > 0) {
      event.formLocked = true;
    }
    await event.save();

    // Send confirmation email
    await sendTicketEmail(user, event, registration);

    res.status(201).json({
      message: 'Registration successful',
      registration: {
        ticketId: registration.ticketId,
        qrCode: registration.qrCode,
        event: event.name,
        status: registration.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Purchase merchandise
// @route   POST /api/tickets/purchase/:eventId
// @access  Private (Participants only)
const purchaseMerchandise = async (req, res) => {
  try {
    const { variantId, quantity } = req.body;
    const event = await Event.findById(req.params.eventId).populate('organizer');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.eventType !== 'merchandise') {
      return res.status(400).json({ message: 'This is not a merchandise event' });
    }

    // Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Purchase deadline has passed' });
    }

    // Find variant
    const variant = event.merchandiseDetails.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    // Check stock
    if (variant.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Check purchase limit
    const existingPurchases = await Registration.find({
      event: event._id,
      participant: req.user._id,
      status: { $ne: 'cancelled' }
    });

    const totalPurchased = existingPurchases.reduce(
      (sum, r) => sum + (r.merchandiseDetails?.quantity || 0), 0
    );

    if (totalPurchased + quantity > event.merchandiseDetails.purchaseLimitPerParticipant) {
      return res.status(400).json({ 
        message: `Purchase limit is ${event.merchandiseDetails.purchaseLimitPerParticipant} per participant` 
      });
    }

    // Generate ticket ID
    const ticketId = `FEL-MERCH-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create registration with pending payment status
    const registration = await Registration.create({
      event: event._id,
      participant: req.user._id,
      ticketId,
      status: event.merchandiseDetails.requiresPaymentApproval ? 'pending-payment' : 'registered',
      merchandiseDetails: {
        variant: variant.toObject(),
        quantity,
        totalAmount: variant.price * quantity,
        paymentStatus: 'pending'
      }
    });

    // If no payment approval required, generate QR and decrement stock
    if (!event.merchandiseDetails.requiresPaymentApproval) {
      const qrData = {
        ticketId,
        eventId: event._id,
        participantId: req.user._id,
        variant: variant.variantName || `${variant.size} - ${variant.color}`,
        quantity
      };
      registration.qrCode = await generateQRCode(qrData);
      registration.status = 'confirmed';
      registration.merchandiseDetails.paymentStatus = 'approved';
      await registration.save();

      variant.stock -= quantity;
      event.registrationCount += 1;
      await event.save();

      const user = await User.findById(req.user._id);
      await sendTicketEmail(user, event, registration);
    }

    res.status(201).json({
      message: event.merchandiseDetails.requiresPaymentApproval 
        ? 'Order placed. Please upload payment proof.' 
        : 'Purchase successful',
      registration: {
        ticketId: registration.ticketId,
        status: registration.status,
        totalAmount: registration.merchandiseDetails.totalAmount
      }
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload payment proof
// @route   POST /api/tickets/:ticketId/payment-proof
// @access  Private (Participant owner only)
const uploadPaymentProof = async (req, res) => {
  try {
    const registration = await Registration.findOne({ ticketId: req.params.ticketId });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.participant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (registration.merchandiseDetails.paymentStatus !== 'pending') {
      return res.status(400).json({ message: 'Payment proof already submitted or processed' });
    }

    // Save payment proof path from uploaded file
    registration.merchandiseDetails.paymentProof = req.file ? req.file.path : req.body.paymentProofUrl;
    await registration.save();

    res.json({ message: 'Payment proof uploaded successfully' });
  } catch (error) {
    console.error('Upload payment proof error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pending payment approvals (for organizer)
// @route   GET /api/tickets/pending-payments/:eventId
// @access  Private (Organizer only)
const getPendingPayments = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const organizer = await Organizer.findOne({ userId: req.user._id });
    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const registrations = await Registration.find({
      event: event._id,
      'merchandiseDetails.paymentStatus': { $exists: true }
    }).populate('participant', 'firstName lastName email contactNumber');

    const grouped = {
      pending: registrations.filter(r => r.merchandiseDetails.paymentStatus === 'pending'),
      approved: registrations.filter(r => r.merchandiseDetails.paymentStatus === 'approved'),
      rejected: registrations.filter(r => r.merchandiseDetails.paymentStatus === 'rejected')
    };

    res.json(grouped);
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve/Reject payment
// @route   PUT /api/tickets/:ticketId/payment-status
// @access  Private (Organizer only)
const updatePaymentStatus = async (req, res) => {
  try {
    const { action, reason } = req.body;
    const registration = await Registration.findOne({ ticketId: req.params.ticketId })
      .populate('participant')
      .populate('event');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const event = await Event.findById(registration.event._id);
    const organizer = await Organizer.findOne({ userId: req.user._id });
    
    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (action === 'approve') {
      // Generate QR code
      const qrData = {
        ticketId: registration.ticketId,
        eventId: event._id,
        participantId: registration.participant._id,
        variant: registration.merchandiseDetails.variant.variantName || 
          `${registration.merchandiseDetails.variant.size} - ${registration.merchandiseDetails.variant.color}`,
        quantity: registration.merchandiseDetails.quantity
      };
      registration.qrCode = await generateQRCode(qrData);
      registration.status = 'payment-approved';
      registration.merchandiseDetails.paymentStatus = 'approved';
      registration.merchandiseDetails.paymentApprovedAt = new Date();

      // Decrement stock
      const variant = event.merchandiseDetails.variants.id(registration.merchandiseDetails.variant._id);
      if (variant) {
        variant.stock -= registration.merchandiseDetails.quantity;
        event.registrationCount += 1;
        await event.save();
      }

      await registration.save();

      // Send confirmation email
      await sendTicketEmail(registration.participant, event, registration);

      res.json({ message: 'Payment approved successfully' });
    } else if (action === 'reject') {
      registration.status = 'rejected';
      registration.merchandiseDetails.paymentStatus = 'rejected';
      registration.merchandiseDetails.rejectionReason = reason;
      await registration.save();

      res.json({ message: 'Payment rejected' });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's registrations
// @route   GET /api/tickets/my-registrations
// @access  Private (Participants only)
const getMyRegistrations = async (req, res) => {
  try {
    const { type, status } = req.query;

    let query = { participant: req.user._id };

    const registrations = await Registration.find(query)
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name category' }
      })
      .populate('team', 'name')
      .sort({ createdAt: -1 });

    // Categorize registrations
    const now = new Date();
    const categorized = {
      upcoming: [],
      normal: [],
      merchandise: [],
      completed: [],
      cancelled: []
    };

    registrations.forEach(reg => {
      if (reg.status === 'cancelled' || reg.status === 'rejected') {
        categorized.cancelled.push(reg);
      } else if (new Date(reg.event.endDate) < now || reg.event.status === 'completed') {
        categorized.completed.push(reg);
      } else if (reg.event.eventType === 'merchandise') {
        categorized.merchandise.push(reg);
      } else if (reg.event.eventType === 'normal' || reg.event.eventType === 'hackathon') {
        categorized.normal.push(reg);
        if (new Date(reg.event.startDate) > now) {
          categorized.upcoming.push(reg);
        }
      }
    });

    if (type) {
      res.json(categorized[type] || []);
    } else {
      res.json(categorized);
    }
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:ticketId
// @access  Private
const getTicket = async (req, res) => {
  try {
    const registration = await Registration.findOne({ ticketId: req.params.ticketId })
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name category contactEmail' }
      })
      .populate('participant', 'firstName lastName email contactNumber collegeName')
      .populate('team', 'name');

    if (!registration) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check access - participant owner or event organizer
    const organizer = await Organizer.findOne({ userId: req.user._id });
    const isOwner = registration.participant._id.toString() === req.user._id.toString();
    const isOrganizer = organizer && registration.event.organizer._id.toString() === organizer._id.toString();

    if (!isOwner && !isOrganizer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(registration);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel registration
// @route   DELETE /api/tickets/:ticketId
// @access  Private (Participant owner only)
const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findOne({ ticketId: req.params.ticketId });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.participant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration already cancelled' });
    }

    const event = await Event.findById(registration.event);
    
    // Check if event has started
    if (new Date() >= new Date(event.startDate)) {
      return res.status(400).json({ message: 'Cannot cancel after event has started' });
    }

    registration.status = 'cancelled';
    await registration.save();

    // Update event count
    event.registrationCount = Math.max(0, event.registrationCount - 1);

    // Restore stock for merchandise
    if (event.eventType === 'merchandise' && registration.merchandiseDetails?.variant) {
      const variant = event.merchandiseDetails.variants.id(registration.merchandiseDetails.variant._id);
      if (variant) {
        variant.stock += registration.merchandiseDetails.quantity;
      }
    }
    
    await event.save();

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Scan QR and mark attendance
// @route   POST /api/tickets/scan
// @access  Private (Organizer only)
const scanTicket = async (req, res) => {
  try {
    const { ticketId, eventId } = req.body;

    const registration = await Registration.findOne({ ticketId })
      .populate('participant', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({ message: 'Invalid ticket', valid: false });
    }

    // Verify event matches
    if (registration.event.toString() !== eventId) {
      return res.status(400).json({ message: 'Ticket is for a different event', valid: false });
    }

    const event = await Event.findById(eventId);
    const organizer = await Organizer.findOne({ userId: req.user._id });

    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to scan for this event' });
    }

    // Check if already attended
    if (registration.attended) {
      return res.status(400).json({ 
        message: 'Ticket already scanned', 
        valid: false,
        attendedAt: registration.attendedAt,
        participant: registration.participant
      });
    }

    // Check status
    if (!['registered', 'confirmed', 'payment-approved'].includes(registration.status)) {
      return res.status(400).json({ 
        message: `Invalid ticket status: ${registration.status}`, 
        valid: false 
      });
    }

    // Mark attendance
    registration.attended = true;
    registration.attendedAt = new Date();
    registration.attendanceMarkedBy = req.user._id;
    registration.status = 'attended';
    await registration.save();

    res.json({
      valid: true,
      message: 'Attendance marked successfully',
      participant: registration.participant,
      attendedAt: registration.attendedAt
    });
  } catch (error) {
    console.error('Scan ticket error:', error);
    res.status(500).json({ message: 'Server error', valid: false });
  }
};

// @desc    Manual override for attendance
// @route   POST /api/tickets/:ticketId/manual-override
// @access  Private (Organizer only)
const manualOverride = async (req, res) => {
  try {
    const { reason, markAttended } = req.body;
    const registration = await Registration.findOne({ ticketId: req.params.ticketId });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const event = await Event.findById(registration.event);
    const organizer = await Organizer.findOne({ userId: req.user._id });

    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    registration.manualOverride = true;
    registration.overrideReason = reason;
    registration.attended = markAttended;
    if (markAttended) {
      registration.attendedAt = new Date();
      registration.attendanceMarkedBy = req.user._id;
    }
    await registration.save();

    res.json({ message: 'Manual override applied successfully' });
  } catch (error) {
    console.error('Manual override error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get attendance stats for event
// @route   GET /api/tickets/attendance/:eventId
// @access  Private (Organizer only)
const getAttendanceStats = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const organizer = await Organizer.findOne({ userId: req.user._id });
    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const registrations = await Registration.find({
      event: event._id,
      status: { $in: ['registered', 'confirmed', 'payment-approved', 'attended'] }
    }).populate('participant', 'firstName lastName email contactNumber');

    const stats = {
      total: registrations.length,
      attended: registrations.filter(r => r.attended).length,
      notAttended: registrations.filter(r => !r.attended).length,
      attendedList: registrations.filter(r => r.attended),
      notAttendedList: registrations.filter(r => !r.attended)
    };

    res.json(stats);
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Export attendance report
// @route   GET /api/tickets/attendance/:eventId/export
// @access  Private (Organizer only)
const exportAttendance = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const organizer = await Organizer.findOne({ userId: req.user._id });
    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const registrations = await Registration.find({
      event: event._id
    }).populate('participant', 'firstName lastName email contactNumber collegeName');

    // Generate CSV
    let csv = 'Ticket ID,First Name,Last Name,Email,Contact,College,Status,Attended,Attended At,Manual Override,Override Reason\n';

    registrations.forEach(r => {
      csv += `${r.ticketId},${r.participant.firstName},${r.participant.lastName},${r.participant.email},${r.participant.contactNumber || ''},${r.participant.collegeName || ''},${r.status},${r.attended},${r.attendedAt ? new Date(r.attendedAt).toISOString() : ''},${r.manualOverride},${r.overrideReason || ''}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${event.name.replace(/\s+/g, '_')}_attendance.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};
