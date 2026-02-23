const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// @route   POST /api/feedback
// @desc    Submit anonymous feedback for an event (participant only)
// @access  Private (Participant)
router.post('/', protect, authorize('participant'), async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;

    // Validate input
    if (!eventId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Event ID, rating, and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if participant is registered for this event
    const registration = await Registration.findOne({
      eventId,
      participantId: req.user._id,
      status: 'confirmed'
    });

    if (!registration) {
      return res.status(403).json({ success: false, message: 'You must be registered for this event to submit feedback' });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      eventId,
      participantId: req.user._id
    });

    if (existingFeedback) {
      return res.status(400).json({ success: false, message: 'You have already submitted feedback for this event' });
    }

    // Create feedback
    const feedback = await Feedback.create({
      eventId,
      participantId: req.user._id,
      rating,
      comment,
      isAnonymous: true
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/feedback/event/:eventId
// @desc    Get all feedback for an event (organizer only)
// @access  Private (Organizer)
router.get('/event/:eventId', protect, authorize('organizer'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating } = req.query;

    // Check if event exists and belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view feedback for this event' });
    }

    // Build query
    let query = { eventId };
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Get feedback
    const feedbacks = await Feedback.find(query).sort({ createdAt: -1 });

    // Calculate statistics
    const totalFeedbacks = feedbacks.length;
    const averageRating = totalFeedbacks > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks).toFixed(1)
      : 0;

    const ratingDistribution = {
      5: feedbacks.filter(f => f.rating === 5).length,
      4: feedbacks.filter(f => f.rating === 4).length,
      3: feedbacks.filter(f => f.rating === 3).length,
      2: feedbacks.filter(f => f.rating === 2).length,
      1: feedbacks.filter(f => f.rating === 1).length
    };

    res.json({
      success: true,
      feedbacks,
      statistics: {
        totalFeedbacks,
        averageRating: parseFloat(averageRating),
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/feedback/my-feedback/:eventId
// @desc    Check if participant has submitted feedback for an event
// @access  Private (Participant)
router.get('/my-feedback/:eventId', protect, authorize('participant'), async (req, res) => {
  try {
    const { eventId } = req.params;

    const feedback = await Feedback.findOne({
      eventId,
      participantId: req.user._id
    });

    res.json({
      success: true,
      hasFeedback: !!feedback,
      feedback
    });
  } catch (error) {
    console.error('Error checking feedback:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
