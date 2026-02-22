const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Generate random password
const generatePassword = () => {
  return crypto.randomBytes(8).toString('hex');
};

// @desc    Create organizer account
// @route   POST /api/admin/organizers
// @access  Private (Admin only)
const createOrganizer = async (req, res) => {
  try {
    const name = req.body.clubName || req.body.name;
    const contactEmail = req.body.email || req.body.contactEmail;
    const password = req.body.password || generatePassword();
    const category = req.body.category;
    const description = req.body.description || '';
    const contactNumber = req.body.contactNumber || '';

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Club name is required' });
    }
    if (!contactEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }

    // Check if organizer email already exists
    const existingUser = await User.findOne({ email: contactEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    // Password hashed by User model

    // Create user account for organizer
    const user = await User.create({
      firstName: name,
      lastName: 'Club',
      email: contactEmail.toLowerCase(),
      password: password,
      role: 'organizer',
      isActive: true
    });

    // Create organizer profile
    const organizer = await Organizer.create({
      name,
      clubName: name,
      category,
      description,
      contactEmail: contactEmail.toLowerCase(),
      contactNumber,
      userId: user._id,
      isActive: true
    });

    // Link organizer to user
    user.organizerId = organizer._id;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Organizer created successfully',
      data: {
        id: organizer._id,
        clubName: name,
        email: contactEmail.toLowerCase(),
        password: password,
        category: category
      },
      organizer,
      credentials: {
        email: contactEmail.toLowerCase(),
        password
      }
    });
  } catch (error) {
    console.error('Create organizer error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Get all organizers (admin view)
// @route   GET /api/admin/organizers
// @access  Private (Admin only)
const getAllOrganizers = async (req, res) => {
  try {
    const organizers = await Organizer.find()
      .populate('userId', 'email isActive')
      .sort({ createdAt: -1 });

    res.json(organizers);
  } catch (error) {
    console.error('Get all organizers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Disable/Enable organizer
// @route   PUT /api/admin/organizers/:id/toggle
// @access  Private (Admin only)
const toggleOrganizer = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    organizer.isActive = !organizer.isActive;
    await organizer.save();

    // Also toggle user account
    await User.findByIdAndUpdate(organizer.userId, { isActive: organizer.isActive });

    res.json({ 
      message: `Organizer ${organizer.isActive ? 'enabled' : 'disabled'} successfully`,
      organizer 
    });
  } catch (error) {
    console.error('Toggle organizer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete organizer
// @route   DELETE /api/admin/organizers/:id
// @access  Private (Admin only)
const deleteOrganizer = async (req, res) => {
  try {
    const { archive } = req.query;
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    if (archive === 'true') {
      // Archive (soft delete)
      organizer.isActive = false;
      await organizer.save();
      await User.findByIdAndUpdate(organizer.userId, { isActive: false });
      res.json({ message: 'Organizer archived successfully' });
    } else {
      // Permanent delete
      await User.findByIdAndDelete(organizer.userId);
      // Delete all events created by this organizer
      await Event.deleteMany({ organizer: organizer._id });
      await Organizer.findByIdAndDelete(req.params.id);
      res.json({ message: 'Organizer and all their events permanently deleted' });
    }
  } catch (error) {
    console.error('Delete organizer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get password reset requests
// @route   GET /api/admin/password-requests
// @access  Private (Admin only)
const getPasswordResetRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const requests = await PasswordResetRequest.find(query)
      .populate('organizer', 'name category')
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get password reset requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Handle password reset request
// @route   PUT /api/admin/password-requests/:id
// @access  Private (Admin only)
const handlePasswordResetRequest = async (req, res) => {
  try {
    const { action, comment } = req.body;
    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    if (action === 'approve') {
      const newPassword = generatePassword();
      
      // Update user password
      const user = await User.findById(request.user);
      user.password = newPassword;
      await user.save();

      request.status = 'approved';
      request.newPasswordGenerated = newPassword;
      request.adminComment = comment;
      request.resolvedBy = req.user._id;
      request.resolvedAt = new Date();
      await request.save();

      res.json({
        message: 'Password reset approved',
        newPassword // Admin should share this securely
      });
    } else if (action === 'reject') {
      request.status = 'rejected';
      request.adminComment = comment;
      request.resolvedBy = req.user._id;
      request.resolvedAt = new Date();
      await request.save();

      res.json({ message: 'Password reset rejected' });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Handle password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res) => {
  try {
    const totalClubs = await Organizer.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'participant' });
    const totalEvents = await Event.countDocuments();
    const pendingResets = await PasswordResetRequest.countDocuments({ status: 'pending' });

    res.json({
      totalClubs,
      totalUsers,
      totalEvents,
      pendingResets
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update organizer
// @route   PUT /api/admin/clubs/:id
// @access  Private (Admin only)
const updateOrganizer = async (req, res) => {
  try {
    const { name, description, category, password } = req.body;
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    organizer.name = name || organizer.name;
    organizer.description = description || organizer.description;
    organizer.category = category || organizer.category;
    await organizer.save();

    // Update password if provided
    if (password) {
      const user = await User.findById(organizer.userId);
      if (user) {
        user.password = password;
        await user.save();
      }
    }

    res.json({ message: 'Organizer updated successfully', organizer });
  } catch (error) {
    console.error('Update organizer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve password reset
// @route   POST /api/admin/password-reset-requests/:id/approve
// @access  Private (Admin only)
const approvePasswordReset = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update organizer password
    const organizer = await Organizer.findById(request.organizer);
    if (organizer && organizer.userId) {
      const user = await User.findById(organizer.userId);
      if (user) {
        user.password = newPassword;
        await user.save();
      }
    }

    request.status = 'approved';
    request.resolvedBy = req.user._id;
    request.resolvedAt = new Date();
    await request.save();

    res.json({ message: 'Password reset approved successfully' });
  } catch (error) {
    console.error('Approve password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject password reset
// @route   POST /api/admin/password-reset-requests/:id/reject
// @access  Private (Admin only)
const rejectPasswordReset = async (req, res) => {
  try {
    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    request.status = 'rejected';
    request.resolvedBy = req.user._id;
    request.resolvedAt = new Date();
    await request.save();

    res.json({ message: 'Password reset rejected' });
  } catch (error) {
    console.error('Reject password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all events (admin view)
// @route   GET /api/admin/events
// @access  Private (Admin only)
const getAllEvents = async (req, res) => {
  try {
    const { limit } = req.query;
    let query = Event.find()
      .populate('organizer', 'name')
      .sort({ createdAt: -1 });
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const events = await query;
    res.json(events);
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrganizer,
  getAllOrganizers,
  updateOrganizer,
  toggleOrganizer,
  deleteOrganizer,
  getPasswordResetRequests,
  handlePasswordResetRequest,
  approvePasswordReset,
  rejectPasswordReset,
  getAdminStats,
  getAllEvents
};
