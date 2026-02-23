const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Registration = require('../models/Registration');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('followedOrganizers', 'name category');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email.split('@')[0],
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.contactNumber,
      college: user.collegeName,
      interests: user.interests || [],
      bio: user.bio || '',
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, firstName, lastName, phone, contactNumber, college, collegeName, interests, bio } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields - handle both naming conventions
    if (name) {
      const nameParts = name.split(' ');
      user.firstName = nameParts[0];
      user.lastName = nameParts.slice(1).join(' ') || '';
    }
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone || contactNumber) user.contactNumber = phone || contactNumber;
    if (college || collegeName) user.collegeName = college || collegeName;
    if (interests) user.interests = interests;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.json({
      _id: user._id,
      name: `${user.firstName} ${user.lastName || ''}`.trim(),
      email: user.email,
      phone: user.contactNumber,
      college: user.collegeName,
      interests: user.interests,
      bio: user.bio
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Complete onboarding (set preferences)
// @route   POST /api/users/onboarding
// @access  Private (Participants only)
const completeOnboarding = async (req, res) => {
  try {
    const { interests, followedOrganizers, skip } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!skip) {
      if (interests) user.interests = interests;
      if (followedOrganizers) user.followedOrganizers = followedOrganizers;
    }

    user.onboardingCompleted = true;
    await user.save();

    res.json({
      message: 'Onboarding completed',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        interests: user.interests,
        followedOrganizers: user.followedOrganizers,
        onboardingCompleted: user.onboardingCompleted
      }
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Follow an organizer
// @route   POST /api/users/follow/:organizerId
// @access  Private (Participants only)
const followOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const organizer = await Organizer.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    const user = await User.findById(req.user._id);

    if (user.followedOrganizers.includes(organizerId)) {
      return res.status(400).json({ message: 'Already following this organizer' });
    }

    user.followedOrganizers.push(organizerId);
    await user.save();

    organizer.followersCount += 1;
    await organizer.save();

    res.json({ message: 'Organizer followed successfully' });
  } catch (error) {
    console.error('Follow organizer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unfollow an organizer
// @route   DELETE /api/users/follow/:organizerId
// @access  Private (Participants only)
const unfollowOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user.followedOrganizers.includes(organizerId)) {
      return res.status(400).json({ message: 'Not following this organizer' });
    }

    user.followedOrganizers = user.followedOrganizers.filter(
      id => id.toString() !== organizerId
    );
    await user.save();

    const organizer = await Organizer.findById(organizerId);
    if (organizer && organizer.followersCount > 0) {
      organizer.followersCount -= 1;
      await organizer.save();
    }

    res.json({ message: 'Organizer unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow organizer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's followed organizers
// @route   GET /api/users/following
// @access  Private
const getFollowedOrganizers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('followedOrganizers', 'name category description');
    res.json(user.followedOrganizers || []);
  } catch (error) {
    console.error('Get followed organizers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's registrations
// @route   GET /api/users/registrations
// @access  Private
const getUserRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.user._id })
      .populate('event', 'title startDate endDate venue organizer status')
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name' }
      })
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    console.error('Get user registrations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  completeOnboarding,
  followOrganizer,
  unfollowOrganizer,
  getFollowedOrganizers,
  getUserRegistrations
};
