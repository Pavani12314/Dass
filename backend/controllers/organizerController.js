const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const PasswordResetRequest = require('../models/PasswordResetRequest');

// @desc    Get all organizers
// @route   GET /api/organizers
// @access  Public
const getOrganizers = async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const organizers = await Organizer.find(query).sort({ name: 1 });

    res.json(organizers);
  } catch (error) {
    console.error('Get organizers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single organizer
// @route   GET /api/organizers/:id
// @access  Public
const getOrganizer = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    res.json(organizer);
  } catch (error) {
    console.error('Get organizer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get organizer's events
// @route   GET /api/organizers/:id/events
// @access  Public
const getOrganizerPublicEvents = async (req, res) => {
  try {
    const { type } = req.query; // 'upcoming' or 'past'
    
    let query = { 
      organizer: req.params.id,
      status: { $in: ['published', 'ongoing', 'completed'] }
    };

    if (type === 'upcoming') {
      query.startDate = { $gte: new Date() };
    } else if (type === 'past') {
      query.endDate = { $lt: new Date() };
    }

    const events = await Event.find(query)
      .sort({ startDate: type === 'past' ? -1 : 1 })
      .limit(20);

    res.json(events);
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update organizer profile
// @route   PUT /api/organizers/profile
// @access  Private (Organizer only)
const updateOrganizerProfile = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ userId: req.user._id });

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    const { name, category, description, contactEmail, contactNumber, discordWebhook } = req.body;

    if (name) organizer.name = name;
    if (category) organizer.category = category;
    if (description) organizer.description = description;
    if (contactEmail) organizer.contactEmail = contactEmail;
    if (contactNumber) organizer.contactNumber = contactNumber;
    if (discordWebhook !== undefined) organizer.discordWebhook = discordWebhook;

    await organizer.save();

    res.json(organizer);
  } catch (error) {
    console.error('Update organizer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get organizer dashboard stats
// @route   GET /api/organizers/stats
// @access  Private (Organizer only)
const getDashboardStats = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ userId: req.user._id });

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    const events = await Event.find({ organizer: organizer._id });
    const eventIds = events.map(e => e._id);
    
    const totalRegistrations = await Registration.countDocuments({ event: { $in: eventIds } });
    const approvedRegistrations = await Registration.find({ 
      event: { $in: eventIds },
      status: 'approved'
    });
    
    const totalRevenue = approvedRegistrations.reduce((sum, reg) => sum + (reg.amountPaid || 0), 0);

    const stats = {
      totalEvents: events.length,
      totalRegistrations,
      totalRevenue,
      followers: organizer.followersCount || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get organizer profile
// @route   GET /api/organizers/profile
// @access  Private (Organizer only)
const getOrganizerProfile = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ userId: req.user._id });

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    res.json(organizer);
  } catch (error) {
    console.error('Get organizer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get organizer's events
// @route   GET /api/organizers/events
// @access  Private (Organizer only)
const getOrganizerEvents = async (req, res) => {
  try {
    const { type, limit } = req.query;
    const organizer = await Organizer.findOne({ userId: req.user._id });

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    let query = { organizer: organizer._id };
    const now = new Date();

    if (type === 'upcoming') {
      query.startDate = { $gt: now };
    } else if (type === 'ongoing') {
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (type === 'past') {
      query.endDate = { $lt: now };
    }

    let eventsQuery = Event.find(query).sort({ startDate: type === 'past' ? -1 : 1 });
    
    if (limit) {
      eventsQuery = eventsQuery.limit(parseInt(limit));
    }

    const events = await eventsQuery;
    res.json(events);
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get organizer's registrations
// @route   GET /api/organizers/registrations
// @access  Private (Organizer only)
const getOrganizerRegistrations = async (req, res) => {
  try {
    const { limit } = req.query;
    const organizer = await Organizer.findOne({ userId: req.user._id });

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    const events = await Event.find({ organizer: organizer._id });
    const eventIds = events.map(e => e._id);

    let regQuery = Registration.find({ event: { $in: eventIds } })
      .populate('user', 'name email')
      .populate('event', 'title')
      .sort({ createdAt: -1 });

    if (limit) {
      regQuery = regQuery.limit(parseInt(limit));
    }

    const registrations = await regQuery;
    res.json(registrations);
  } catch (error) {
    console.error('Get organizer registrations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Request password reset
// @route   POST /api/organizers/request-password-reset
// @access  Private (Organizer only)
const requestPasswordReset = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ userId: req.user._id });

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    // Check for existing pending request
    const existingRequest = await PasswordResetRequest.findOne({
      organizer: organizer._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending password reset request' });
    }

    await PasswordResetRequest.create({
      organizer: organizer._id,
      user: organizer.userId, // Add this line to fix the validation error
      reason: req.body.reason || 'Password reset requested'
    });

    res.json({ message: 'Password reset request submitted. An admin will process it shortly.' });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get completed events stats for analytics
// @route   GET /api/organizers/completed-stats
// @access  Private (Organizer only)
const getCompletedEventsStats = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ userId: req.user._id });

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    const completedEvents = await Event.find({ 
      organizer: organizer._id,
      status: 'completed'
    });

    const statsPromises = completedEvents.map(async (event) => {
      const registrations = await Registration.find({ event: event._id });
      const attendance = registrations.filter(r => r.attended).length;
      const revenue = registrations.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
      const sales = event.eventType === 'merchandise' 
        ? registrations.reduce((sum, r) => sum + (r.merchandiseDetails?.quantity || 0), 0)
        : 0;

      return {
        _id: event._id,
        name: event.name,
        eventType: event.eventType,
        registrations: registrations.length,
        attendance,
        revenue,
        sales
      };
    });

    const stats = await Promise.all(statsPromises);
    res.json(stats);
  } catch (error) {
    console.error('Get completed events stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Follow an organizer
// @route   POST /api/organizers/:id/follow
// @access  Private (Participant only)
const followOrganizer = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }
    // Add user to followers array if not already present
    if (!organizer.followers) organizer.followers = [];
    if (!organizer.followers.includes(req.user._id)) {
      organizer.followers.push(req.user._id);
      organizer.followersCount = organizer.followers.length;
      await organizer.save();
    }
    res.json({ message: 'Followed organizer', followersCount: organizer.followersCount });
  } catch (error) {
    console.error('Follow organizer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unfollow an organizer
// @route   POST /api/organizers/:id/unfollow
// @access  Private (Participant only)
const unfollowOrganizer = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }
    // Remove user from followers array if present
    if (organizer.followers && organizer.followers.includes(req.user._id)) {
      organizer.followers = organizer.followers.filter(id => id.toString() !== req.user._id.toString());
      organizer.followersCount = organizer.followers.length;
      await organizer.save();
    }
    res.json({ message: 'Unfollowed organizer', followersCount: organizer.followersCount });
  } catch (error) {
    console.error('Unfollow organizer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getOrganizers,
  getOrganizer,
  getOrganizerPublicEvents,
  getOrganizerProfile,
  getOrganizerEvents,
  getOrganizerRegistrations,
  updateOrganizerProfile,
  getDashboardStats,
  requestPasswordReset,
  getCompletedEventsStats,
  followOrganizer,
  unfollowOrganizer
};
