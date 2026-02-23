const ForumMessage = require('../models/ForumMessage');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Organizer = require('../models/Organizer');

// @desc    Get forum messages for an event
// @route   GET /api/forum/:eventId
// @access  Private (Registered participants or organizer)
const getForumMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check access
    const registration = await Registration.findOne({
      event: event._id,
      participant: req.user._id,
      status: { $nin: ['cancelled', 'rejected'] }
    });

    const organizer = await Organizer.findOne({ userId: req.user._id });
    const isOrganizer = organizer && event.organizer.toString() === organizer._id.toString();

    if (!registration && !isOrganizer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Must be registered or organizer to view forum' });
    }

    const skip = (page - 1) * limit;

    const messages = await ForumMessage.find({
      event: event._id,
      isDeleted: false
    })
      .populate('sender', 'firstName lastName role')
      .populate({
        path: 'parentMessage',
        populate: { path: 'sender', select: 'firstName lastName' }
      })
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ForumMessage.countDocuments({
      event: event._id,
      isDeleted: false
    });

    res.json({
      messages,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get forum messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Post a forum message
// @route   POST /api/forum/:eventId
// @access  Private (Registered participants or organizer)
const postMessage = async (req, res) => {
  try {
    const { message, parentMessageId, isAnnouncement } = req.body;
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check access
    const registration = await Registration.findOne({
      event: event._id,
      participant: req.user._id,
      status: { $nin: ['cancelled', 'rejected'] }
    });

    const organizer = await Organizer.findOne({ userId: req.user._id });
    const isOrganizer = organizer && event.organizer.toString() === organizer._id.toString();

    if (!registration && !isOrganizer) {
      return res.status(403).json({ message: 'Must be registered or organizer to post' });
    }

    // Only organizers can post announcements
    if (isAnnouncement && !isOrganizer) {
      return res.status(403).json({ message: 'Only organizers can post announcements' });
    }

    const forumMessage = await ForumMessage.create({
      event: event._id,
      sender: req.user._id,
      message,
      parentMessage: parentMessageId || null,
      isAnnouncement: isAnnouncement && isOrganizer
    });

    const populatedMessage = await ForumMessage.findById(forumMessage._id)
      .populate('sender', 'firstName lastName role');

    // Emit via socket
    const io = req.app.get('io');
    io.to(`event_${event._id}`).emit('newForumMessage', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Post message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Pin/Unpin a message
// @route   PUT /api/forum/:messageId/pin
// @access  Private (Organizer only)
const togglePin = async (req, res) => {
  try {
    const forumMessage = await ForumMessage.findById(req.params.messageId);

    if (!forumMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const event = await Event.findById(forumMessage.event);
    const organizer = await Organizer.findOne({ userId: req.user._id });

    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Only organizers can pin messages' });
    }

    forumMessage.isPinned = !forumMessage.isPinned;
    await forumMessage.save();

    res.json({ message: `Message ${forumMessage.isPinned ? 'pinned' : 'unpinned'}` });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a message
// @route   DELETE /api/forum/:messageId
// @access  Private (Sender or Organizer)
const deleteMessage = async (req, res) => {
  try {
    const forumMessage = await ForumMessage.findById(req.params.messageId);

    if (!forumMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const event = await Event.findById(forumMessage.event);
    const organizer = await Organizer.findOne({ userId: req.user._id });
    const isOrganizer = organizer && event.organizer.toString() === organizer._id.toString();
    const isSender = forumMessage.sender.toString() === req.user._id.toString();

    if (!isSender && !isOrganizer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    forumMessage.isDeleted = true;
    forumMessage.deletedBy = req.user._id;
    await forumMessage.save();

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    React to a message
// @route   POST /api/forum/:messageId/react
// @access  Private (Registered participants or organizer)
const reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const forumMessage = await ForumMessage.findById(req.params.messageId);

    if (!forumMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if already reacted with same emoji
    const existingReaction = forumMessage.reactions.find(
      r => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      forumMessage.reactions = forumMessage.reactions.filter(
        r => !(r.user.toString() === req.user._id.toString() && r.emoji === emoji)
      );
    } else {
      // Add reaction
      forumMessage.reactions.push({
        user: req.user._id,
        emoji
      });
    }

    await forumMessage.save();

    res.json(forumMessage.reactions);
  } catch (error) {
    console.error('React to message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getForumMessages,
  postMessage,
  togglePin,
  deleteMessage,
  reactToMessage
};
