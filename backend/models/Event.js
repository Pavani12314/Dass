const mongoose = require('mongoose');
// Custom form field schema for dynamic form builder
const formFieldSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true
  },
  fieldType: {
    type: String,
    enum: ['text', 'textarea', 'number', 'email', 'dropdown', 'checkbox', 'radio', 'file', 'date'],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  placeholder: {
    type: String
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [{
    type: String
  }],
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

// Merchandise variant schema
const merchandiseVariantSchema = new mongoose.Schema({
  size: {
    type: String
  },
  color: {
    type: String
  },
  variantName: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: true });

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: ['normal', 'merchandise', 'hackathon'],
    required: true
  },
  eligibility: {
    type: String,
    enum: ['all', 'iiit-only', 'non-iiit-only'],
    default: 'all'
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  registrationLimit: {
    type: Number,
    default: null
  },
  registrationFee: {
    type: Number,
    default: 0
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'closed', 'cancelled'],
    default: 'draft'
  },
  // For normal events - custom form fields
  customFields: [formFieldSchema],
  formLocked: {
    type: Boolean,
    default: false
  },
  // For merchandise events
  merchandiseDetails: {
    itemName: String,
    itemDescription: String,
    variants: [merchandiseVariantSchema],
    purchaseLimitPerParticipant: {
      type: Number,
      default: 1
    },
    requiresPaymentApproval: {
      type: Boolean,
      default: true
    }
  },
  // For hackathon events
  hackathonDetails: {
    minTeamSize: {
      type: Number,
      default: 1
    },
    maxTeamSize: {
      type: Number,
      default: 4
    }
  },
  // Event images
  bannerImage: {
    type: String
  },
  venue: {
    type: String
  },
  // Registration stats
  registrationCount: {
    type: Number,
    default: 0
  },
  // View count for trending
  viewCount: {
    type: Number,
    default: 0
  },
  // Recent views for trending calculation
  recentViews: [{
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for search
eventSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Event', eventSchema);
