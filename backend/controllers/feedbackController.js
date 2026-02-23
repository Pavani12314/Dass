const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Organizer = require('../models/Organizer');

// @desc    Submit feedback for an event
// @route   POST /api/feedback/:eventId
// @access  Private (Participants who attended)
const submitFeedback = async (req, res) => {
  try {
    const { rating, comment, isAnonymous = true } = req.body;
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user attended the event
    const registration = await Registration.findOne({
      event: event._id,
      participant: req.user._id,
      $or: [
        { attended: true },
        { status: 'completed' }
      ]
    });

    // Also allow feedback if event is completed and user was registered
    const wasRegistered = await Registration.findOne({
      event: event._id,
      participant: req.user._id,
      status: { $nin: ['cancelled', 'rejected'] }
    });

    if (!registration && !wasRegistered) {
      return res.status(403).json({ message: 'You must have attended this event to submit feedback' });
    }

    // Check if already submitted feedback
    const existingFeedback = await Feedback.findOne({
      event: event._id,
      participant: req.user._id
    });

    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already submitted feedback for this event' });
    }

    const feedback = await Feedback.create({
      event: event._id,
      participant: req.user._id,
      rating,
      comment,
      isAnonymous
    });

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: {
        rating: feedback.rating,
        comment: feedback.comment
      }
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get feedback for an event (organizer view)
// @route   GET /api/feedback/:eventId
// @access  Private (Organizer only)
const getEventFeedback = async (req, res) => {
  try {
    const { rating, page = 1, limit = 20 } = req.query;
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const organizer = await Organizer.findOne({ userId: req.user._id });
    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let query = { event: event._id };

    if (rating) {
      query.rating = parseInt(rating);
    }

    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find(query)
      .populate({
        path: 'participant',
        select: 'firstName lastName',
        match: { $expr: { $eq: ['$isAnonymous', false] } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate stats
    const allFeedback = await Feedback.find({ event: event._id });
    const totalFeedback = allFeedback.length;
    const averageRating = totalFeedback > 0
      ? (allFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(2)
      : 0;

    const ratingDistribution = {
      1: allFeedback.filter(f => f.rating === 1).length,
      2: allFeedback.filter(f => f.rating === 2).length,
      3: allFeedback.filter(f => f.rating === 3).length,
      4: allFeedback.filter(f => f.rating === 4).length,
      5: allFeedback.filter(f => f.rating === 5).length
    };

    res.json({
      feedbacks: feedbacks.map(f => ({
        rating: f.rating,
        comment: f.comment,
        isAnonymous: f.isAnonymous,
        participant: f.isAnonymous ? null : f.participant,
        createdAt: f.createdAt
      })),
      stats: {
        totalFeedback,
        averageRating: parseFloat(averageRating),
        ratingDistribution
      },
      page: parseInt(page),
      pages: Math.ceil(totalFeedback / limit)
    });
  } catch (error) {
    console.error('Get event feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Export feedback as CSV
// @route   GET /api/feedback/:eventId/export
// @access  Private (Organizer only)
const exportFeedback = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const organizer = await Organizer.findOne({ userId: req.user._id });
    if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const feedbacks = await Feedback.find({ event: event._id })
      .populate('participant', 'firstName lastName email')
      .sort({ createdAt: -1 });

    let csv = 'Rating,Comment,Anonymous,Participant Name,Submitted At\n';

    feedbacks.forEach(f => {
      const participantName = f.isAnonymous ? 'Anonymous' : 
        `${f.participant?.firstName || ''} ${f.participant?.lastName || ''}`;
      csv += `${f.rating},"${(f.comment || '').replace(/"/g, '""')}",${f.isAnonymous},${participantName},${new Date(f.createdAt).toISOString()}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${event.name.replace(/\s+/g, '_')}_feedback.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check if user can submit feedback
// @route   GET /api/feedback/:eventId/can-submit
// @access  Private
const canSubmitFeedback = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already submitted
    const existingFeedback = await Feedback.findOne({
      event: event._id,
      participant: req.user._id
    });

    if (existingFeedback) {
      return res.json({ canSubmit: false, reason: 'Already submitted feedback' });
    }

    // Check if attended
    const registration = await Registration.findOne({
      event: event._id,
      participant: req.user._id,
      status: { $nin: ['cancelled', 'rejected'] }
    });

    if (!registration) {
      return res.json({ canSubmit: false, reason: 'Not registered for this event' });
    }

    // Check if event is completed
    if (event.status !== 'completed' && new Date(event.endDate) > new Date()) {
      return res.json({ canSubmit: false, reason: 'Event not yet completed' });
    }

    res.json({ canSubmit: true });
  } catch (error) {
    console.error('Can submit feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitFeedback,
  getEventFeedback,
  exportFeedback,
  canSubmitFeedback
};
