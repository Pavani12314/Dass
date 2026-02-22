const User = require('../models/User');
const Organizer = require('../models/Organizer');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new participant
// @route   POST /api/auth/register
// @access  Public
const registerParticipant = async (req, res) => {
  try {
    const { firstName, lastName, email, password, participantType, collegeName, contactNumber } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Validate IIIT email for IIIT participants
    if (participantType === 'iiit') {
      const iiitDomains = ['iiit.ac.in', 'students.iiit.ac.in', 'research.iiit.ac.in'];
      const emailDomain = email.split('@')[1];
      if (!iiitDomains.some(domain => emailDomain.endsWith(domain))) {
        return res.status(400).json({ message: 'IIIT participants must use an IIIT email address' });
      }
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'participant',
      participantType,
      collegeName: participantType === 'non-iiit' ? collegeName : 'IIIT Hyderabad',
      contactNumber
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        participantType: user.participantType,
        onboardingCompleted: user.onboardingCompleted,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Get organizer details if user is an organizer
    let organizerData = null;
    if (user.role === 'organizer' && user.organizerId) {
      organizerData = await Organizer.findById(user.organizerId);
    }

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      participantType: user.participantType,
      onboardingCompleted: user.onboardingCompleted,
      organizerId: user.organizerId,
      organizer: organizerData,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('followedOrganizers');

    let organizerData = null;
    if (user.role === 'organizer' && user.organizerId) {
      organizerData = await Organizer.findById(user.organizerId);
    }

    res.json({
      ...user.toObject(),
      organizer: organizerData
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerParticipant,
  loginUser,
  getMe,
  updatePassword
};
