const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['technical', 'cultural', 'sports', 'literary', 'gaming', 'fest-team', 'council', 'social', 'other']
  },
  description: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  contactNumber: {
    type: String
  },
  logo: {
    type: String
  },
  // User account linked to this organizer
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Discord webhook for notifications
  discordWebhook: {
    type: String
  },
  // Followers count
  followersCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Organizer', organizerSchema);
