const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Discussion = require('../models/Discussion');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// @route   GET /api/discussions/:eventId
// @desc    Get all discussions for an event
// @access  Private
router.get('/:eventId', protect, async (req, res) => {
  try {
    const { eventId } = req.params;

    const discussions = await Discussion.find({ eventId, isDeleted: false })
      .populate('authorId', 'firstName lastName organizerName role')
      .populate('replyTo')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json({
      success: true,
      discussions
    });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/discussions
// @desc    Post a message in discussion forum
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { eventId, message, replyTo } = req.body;

    if (!eventId || !message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and message are required'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user is registered (for participants) or owns event (for organizers)
    if (req.user.role === 'participant') {
      const registration = await Registration.findOne({
        eventId,
        participantId: req.user._id,
        status: 'confirmed'
      });

      if (!registration) {
        return res.status(403).json({
          success: false,
          message: 'You must be registered for this event to participate in discussions'
        });
      }
    } else if (req.user.role === 'organizer') {
      if (event.organizerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only post in your own event discussions'
        });
      }
    }

    // Create discussion
    const discussion = await Discussion.create({
      eventId,
      authorId: req.user._id,
      authorRole: req.user.role,
      message,
      replyTo: replyTo || null,
      isAnnouncement: req.user.role === 'organizer' // Organizer posts are announcements
    });

    const populatedDiscussion = await Discussion.findById(discussion._id)
      .populate('authorId', 'firstName lastName organizerName role');

    res.status(201).json({
      success: true,
      message: 'Message posted successfully',
      discussion: populatedDiscussion
    });

    // Fire-and-forget: generate notifications for all event participants + organizer
    try {
      const Notification = require('../models/Notification');

      // Get all confirmed registrations for this event
      const registrations = await Registration.find({
        eventId,
        status: 'confirmed'
      }).select('participantId');

      // Collect recipient IDs: all registered participants + the event organizer
      const recipientIds = new Set(
        registrations.map(r => r.participantId.toString())
      );
      recipientIds.add(event.organizerId.toString());

      // Exclude the message author
      recipientIds.delete(req.user._id.toString());

      if (recipientIds.size > 0) {
        // Build notification text
        const authorName = req.user.role === 'organizer'
          ? (req.user.organizerName || 'Organizer')
          : `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();

        const notifType = discussion.isAnnouncement ? 'announcement' : (replyTo ? 'reply' : 'new_message');
        const notifMessage = discussion.isAnnouncement
          ? `📢 New announcement by ${authorName} in "${event.eventName}"`
          : replyTo
            ? `💬 ${authorName} replied in "${event.eventName}" discussion`
            : `💬 New message by ${authorName} in "${event.eventName}" discussion`;

        const notifications = Array.from(recipientIds).map(userId => ({
          userId,
          eventId,
          type: notifType,
          message: notifMessage,
          sourceDiscussionId: discussion._id
        }));

        await Notification.insertMany(notifications);
      }
    } catch (notifError) {
      console.error('Error generating notifications (non-blocking):', notifError);
    }
  } catch (error) {
    console.error('Error posting discussion:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/discussions/:discussionId/pin
// @desc    Pin/Unpin a message (Organizer only)
// @access  Private (Organizer)
router.patch('/:discussionId/pin', protect, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId).populate('eventId');

    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    // Verify organizer owns this event
    if (req.user.role !== 'organizer' ||
      discussion.eventId.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    discussion.isPinned = !discussion.isPinned;
    await discussion.save();

    res.json({
      success: true,
      message: discussion.isPinned ? 'Message pinned' : 'Message unpinned',
      discussion
    });
  } catch (error) {
    console.error('Error pinning discussion:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/discussions/:discussionId
// @desc    Delete a message (Organizer only)
// @access  Private (Organizer)
router.delete('/:discussionId', protect, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId).populate('eventId');

    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    // Verify organizer owns this event or author owns the message
    const isOrganizer = req.user.role === 'organizer' &&
      discussion.eventId.organizerId.toString() === req.user._id.toString();
    const isAuthor = discussion.authorId.toString() === req.user._id.toString();

    if (!isOrganizer && !isAuthor) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    discussion.isDeleted = true;
    await discussion.save();

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/discussions/:discussionId/react
// @desc    Add reaction to a message
// @access  Private
router.post('/:discussionId/react', protect, async (req, res) => {
  try {
    const { emoji } = req.body;

    if (!['👍', '❤️', '👏', '🎉'].includes(emoji)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid emoji. Allowed: 👍, ❤️, 👏, 🎉'
      });
    }

    const discussion = await Discussion.findById(req.params.discussionId);

    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    // Check if user already reacted
    const existingReaction = discussion.reactions.find(
      r => r.userId.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      // Update reaction
      existingReaction.emoji = emoji;
    } else {
      // Add new reaction
      discussion.reactions.push({
        userId: req.user._id,
        emoji
      });
    }

    await discussion.save();

    res.json({
      success: true,
      message: 'Reaction added',
      discussion
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/discussions/:discussionId/react
// @desc    Remove reaction from a message
// @access  Private
router.delete('/:discussionId/react', protect, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId);

    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    // Remove user's reaction
    discussion.reactions = discussion.reactions.filter(
      r => r.userId.toString() !== req.user._id.toString()
    );

    await discussion.save();

    res.json({
      success: true,
      message: 'Reaction removed',
      discussion
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
