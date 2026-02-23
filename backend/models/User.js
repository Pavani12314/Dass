const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['participant', 'organizer', 'admin'],
    default: 'participant'
  },
  participantType: {
    type: String,
    enum: ['iiit', 'non-iiit'],
    required: function() { return this.role === 'participant'; }
  },
  collegeName: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  // Preferences for participants
  interests: [{
    type: String
  }],
  followedOrganizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  }],
  // Organizer specific fields
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  },
  // For admin/organizer password reset
  passwordResetRequested: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Prevent role switching (role is immutable after creation)
  if (!this.isNew && this.isModified('role')) {
    const error = new Error('Role switching is not allowed');
    return next(error);
  }
  
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
