const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Organizer = require('../models/Organizer');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const axios = require('axios');

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Organizers only)
const createEvent = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ userId: req.user._id });
    if (!organizer) {
      return res.status(403).json({ message: 'Organizer profile not found' });
    }

    const eventData = {
      ...req.body,
      organizer: organizer._id,
      status: 'published' // changed from 'draft' to 'published'
    };

    const event = await Event.create(eventData);

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all events (with filters)
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const { 
      search, 
      eventType, 
      eligibility, 
      startDate, 
      endDate, 
      organizer,
      status,
      followed,
      page = 1,
      limit = 10
    } = req.query;

    let query = { status: { $in: ['published', 'ongoing'] } };

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by event type
    if (eventType) {
      query.eventType = eventType;
    }

    // Filter by eligibility
    if (eligibility) {
      query.eligibility = eligibility;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Filter by organizer
    if (organizer) {
      query.organizer = organizer;
    }

    // Filter by status for organizers
    if (status) {
      query.status = status;
    }

    // Filter by followed organizers
    if (followed && req.user) {
      const followedOrganizers = req.user.followedOrganizers || [];
      query.organizer = { $in: followedOrganizers };
    }

    const skip = (page - 1) * limit;

    // Debug logging
    console.log('Event query:', JSON.stringify(query));

    const events = await Event.find(query)
      .populate('organizer', 'name category logo')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Events found:', events.map(e => ({ id: e._id, name: e.name, eventType: e.eventType, status: e.status })));

    const total = await Event.countDocuments(query);

    res.json({
      events,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get trending events (Top 5 in last 24 hours)
// @route   GET /api/events/trending
// @access  Public
const getTrendingEvents = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const events = await Event.aggregate([
      {
        $match: {
          status: { $in: ['published', 'ongoing'] },
          startDate: { $gte: new Date() }
        }
      },
      {
        $addFields: {
          recentViewCount: {
            $size: {
              $filter: {
                input: { $ifNull: ['$recentViews', []] },
                as: 'view',
                cond: { $gte: ['$$view.timestamp', twentyFourHoursAgo] }
              }
            }
          }
        }
      },
      { $sort: { recentViewCount: -1, registrationCount: -1 } },
      { $limit: 5 }
    ]);

    await Event.populate(events, { path: 'organizer', select: 'name category logo' });

    res.json(events);
  } catch (error) {
    console.error('Get trending events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name category description contactEmail logo');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Increment view count
    event.viewCount += 1;
    event.recentViews.push({ timestamp: new Date() });
    
    // Keep only last 1000 views for efficiency
    if (event.recentViews.length > 1000) {
      event.recentViews = event.recentViews.slice(-1000);
    }
    
    await event.save();

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Organizer owner only)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const organizer = await Organizer.findOne({ userId: req.user._id });
    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    // Check what can be edited based on status
    const { status } = event;
    const updates = req.body;

    if (status === 'draft') {
      // Free edits allowed
      Object.assign(event, updates);
    } else if (status === 'published') {
      // Limited edits: description, extend deadline, increase limit
      if (updates.description) event.description = updates.description;
      if (updates.registrationDeadline && new Date(updates.registrationDeadline) > event.registrationDeadline) {
        event.registrationDeadline = updates.registrationDeadline;
      }
      if (updates.registrationLimit && updates.registrationLimit > event.registrationLimit) {
        event.registrationLimit = updates.registrationLimit;
      }
      if (updates.status) event.status = updates.status;
    } else if (status === 'ongoing' || status === 'completed') {
      // Only status change allowed
      if (updates.status) event.status = updates.status;
    }

    await event.save();

    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Publish event
// @route   PUT /api/events/:id/publish
// @access  Private (Organizer owner only)
const publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const organizer = await Organizer.findOne({ userId: req.user._id });
    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (event.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft events can be published' });
    }

    event.status = 'published';
    await event.save();

    // Send Discord notification if webhook is configured
    if (organizer.discordWebhook) {
      try {
        await axios.post(organizer.discordWebhook, {
          embeds: [{
            title: ` New Event: ${event.name}`,
            description: event.description.substring(0, 200) + '...',
            color: 0x5865F2,
            fields: [
              { name: 'Type', value: event.eventType, inline: true },
              { name: 'Date', value: new Date(event.startDate).toLocaleDateString(), inline: true },
              { name: 'Registration Deadline', value: new Date(event.registrationDeadline).toLocaleDateString(), inline: true }
            ]
          }]
        });
      } catch (webhookError) {
        console.error('Discord webhook error:', webhookError);
      }
    }

    res.json(event);
  } catch (error) {
    console.error('Publish event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get organizer's events
// @route   GET /api/events/organizer/my-events
// @access  Private (Organizers only)
const getOrganizerEvents = async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ userId: req.user._id });
    if (!organizer) {
      return res.status(403).json({ message: 'Organizer profile not found' });
    }

    const events = await Event.find({ organizer: organizer._id })
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get event analytics
// @route   GET /api/events/:id/analytics
// @access  Private (Organizer owner only)
const getEventAnalytics = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const organizer = await Organizer.findOne({ userId: req.user._id });
    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const registrations = await Registration.find({ event: event._id });

    const analytics = {
      totalRegistrations: registrations.length,
      attended: registrations.filter(r => r.attended).length,
      pending: registrations.filter(r => r.status === 'registered' || r.status === 'pending-payment').length,
      confirmed: registrations.filter(r => r.status === 'confirmed' || r.status === 'payment-approved').length,
      cancelled: registrations.filter(r => r.status === 'cancelled' || r.status === 'rejected').length,
      revenue: 0
    };

    // Calculate revenue for merchandise
    if (event.eventType === 'merchandise') {
      analytics.revenue = registrations
        .filter(r => r.status === 'payment-approved' || r.status === 'confirmed')
        .reduce((sum, r) => sum + (r.merchandiseDetails?.totalAmount || 0), 0);
      
      analytics.pendingPayments = registrations.filter(
        r => r.merchandiseDetails?.paymentStatus === 'pending'
      ).length;
    } else {
      analytics.revenue = registrations.filter(
        r => r.status !== 'cancelled' && r.status !== 'rejected'
      ).length * event.registrationFee;
    }

    res.json(analytics);
  } catch (error) {
    console.error('Get event analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get event participants
// @route   GET /api/events/:id/participants
// @access  Private (Organizer owner only)
const getEventParticipants = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const organizer = await Organizer.findOne({ userId: req.user._id });
    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let query = { event: event._id };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    let registrations = await Registration.find(query)
      .populate('participant', 'firstName lastName email contactNumber collegeName')
      .populate('team', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Search filter
    if (search) {
      registrations = registrations.filter(r => 
        r.participant.firstName.toLowerCase().includes(search.toLowerCase()) ||
        r.participant.lastName.toLowerCase().includes(search.toLowerCase()) ||
        r.participant.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Registration.countDocuments(query);

    res.json({
      participants: registrations,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Export participants as CSV
// @route   GET /api/events/:id/export
// @access  Private (Organizer owner only)
const exportParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const organizer = await Organizer.findOne({ userId: req.user._id });
    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const registrations = await Registration.find({ event: event._id })
      .populate('participant', 'firstName lastName email contactNumber collegeName')
      .populate('team', 'name');

    // Generate CSV
    let csv = 'Ticket ID,First Name,Last Name,Email,Contact,College,Status,Attended,Registration Date';
    
    if (event.eventType === 'hackathon') {
      csv += ',Team Name';
    }
    csv += '\n';

    registrations.forEach(r => {
      let row = `${r.ticketId},${r.participant.firstName},${r.participant.lastName},${r.participant.email},${r.participant.contactNumber || ''},${r.participant.collegeName || ''},${r.status},${r.attended},${new Date(r.registeredAt).toISOString()}`;
      
      if (event.eventType === 'hackathon') {
        row += `,${r.team?.name || ''}`;
      }
      csv += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${event.name.replace(/\s+/g, '_')}_participants.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export participants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Organizer owner only)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const organizer = await Organizer.findOne({ userId: req.user._id });
    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (event.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft events can be deleted' });
    }

    await Event.deleteOne({ _id: event._id });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Debug route to list all events with key fields
const debugAllEvents = async (req, res) => {
  try {
    const events = await Event.find({}, { name: 1, eventType: 1, status: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Debug route error', error: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getTrendingEvents,
  getEvent,
  updateEvent,
  publishEvent,
  getOrganizerEvents,
  getEventAnalytics,
  getEventParticipants,
  exportParticipants,
  deleteEvent,
  debugAllEvents // <-- export the debug route
};
