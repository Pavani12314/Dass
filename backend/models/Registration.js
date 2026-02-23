const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // For team-based events
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  qrCode: {
    type: String
  },
  status: {
    type: String,
    enum: ['registered', 'confirmed', 'attended', 'cancelled', 'rejected', 'pending-payment', 'payment-approved', 'completed'],
    default: 'registered'
  },
  // Custom form responses
  formResponses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // For merchandise
  merchandiseDetails: {
    variant: {
      type: mongoose.Schema.Types.Mixed
    },
    quantity: {
      type: Number,
      default: 1
    },
    totalAmount: {
      type: Number
    },
    paymentProof: {
      type: String
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    paymentApprovedAt: {
      type: Date
    },
    rejectionReason: {
      type: String
    }
  },
  // Attendance tracking
  attended: {
    type: Boolean,
    default: false
  },
  attendedAt: {
    type: Date
  },
  attendanceMarkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // For manual override
  manualOverride: {
    type: Boolean,
    default: false
  },
  overrideReason: {
    type: String
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique registration per event
registrationSchema.index({ event: 1, participant: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
