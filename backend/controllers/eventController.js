const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Create a new event (Section 7 & 8)
// @route   POST /api/events
// @access  Private (Organizer only)
const createEvent = async (req, res) => {
  try {
    // Only organizers can create events
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Only organizers can create events' });
    }

    const eventData = {
      ...req.body,
      organizerId: req.user._id,
    };

    // Validate event type specific fields
    if (eventData.eventType === 'normal' && !eventData.customRegistrationForm) {
      return res.status(400).json({ 
        message: 'Normal events must have a custom registration form' 
      });
    }

    if (eventData.eventType === 'merchandise' && !eventData.merchandiseDetails) {
      return res.status(400).json({ 
        message: 'Merchandise events must have merchandise details' 
      });
    }

    const event = await Event.create(eventData);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all events with filtering and sorting
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const {
      eventType,
      status,
      organizerId,
      tags,
      search,
      sortBy = 'eventStartDate',
      order = 'asc',
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = {};
    
    if (eventType) query.eventType = eventType;
    if (status) query.status = status;
    if (organizerId) query.organizerId = organizerId;
    if (tags) query.eventTags = { $in: tags.split(',') };
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Sorting
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('organizerId', 'organizerName category description');

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      events,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get personalized event recommendations (Section 5)
// @route   GET /api/events/recommendations
// @access  Private (Participant only)
const getRecommendedEvents = async (req, res) => {
  try {
    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'Only participants get recommendations' });
    }

    const user = await User.findById(req.user._id);
    const { areasOfInterest, followedOrganizers } = user.preferences;

    // Build recommendation query
    const query = {
      status: 'published',
      registrationDeadline: { $gt: new Date() },
    };

    const recommendations = [];

    // 1. Events from followed organizers (highest priority)
    if (followedOrganizers && followedOrganizers.length > 0) {
      const followedEvents = await Event.find({
        ...query,
        organizerId: { $in: followedOrganizers },
      })
        .sort({ eventStartDate: 1 })
        .limit(10)
        .populate('organizerId', 'organizerName category');

      recommendations.push(...followedEvents.map(e => ({ ...e.toObject(), score: 3, reason: 'From organizers you follow' })));
    }

    // 2. Events matching areas of interest (medium priority)
    if (areasOfInterest && areasOfInterest.length > 0) {
      const interestEvents = await Event.find({
        ...query,
        eventTags: { $in: areasOfInterest },
        _id: { $nin: recommendations.map(r => r._id) },
      })
        .sort({ eventStartDate: 1 })
        .limit(10)
        .populate('organizerId', 'organizerName category');

      recommendations.push(...interestEvents.map(e => ({ ...e.toObject(), score: 2, reason: 'Matches your interests' })));
    }

    // 3. Popular events (low priority)
    const popularEvents = await Event.find({
      ...query,
      _id: { $nin: recommendations.map(r => r._id) },
    })
      .sort({ viewCount: -1, eventStartDate: 1 })
      .limit(10)
      .populate('organizerId', 'organizerName category');

    recommendations.push(...popularEvents.map(e => ({ ...e.toObject(), score: 1, reason: 'Popular event' })));

    // Sort by score (highest first), then by date
    recommendations.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.eventStartDate) - new Date(b.eventStartDate);
    });

    res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations: recommendations.slice(0, 20), // Return top 20
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'organizerName category description contactEmail');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Increment view count
    event.viewCount += 1;
    await event.save();

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Organizer - owner only)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the event organizer
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    // Prevent changing certain fields after event is published
    if (event.status !== 'draft' && req.body.eventType) {
      return res.status(400).json({ message: 'Cannot change event type after publishing' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('organizerId', 'organizerName category');

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Organizer - owner only)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the event organizer
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    // Check if event has registrations
    if (event.currentRegistrations > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete event with existing registrations. Cancel the event instead.' 
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Publish event (change status from draft to published)
// @route   PATCH /api/events/:id/publish
// @access  Private (Organizer - owner only)
const publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to publish this event' });
    }

    if (event.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft events can be published' });
    }

    event.status = 'published';
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event published successfully',
      event,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get events by organizer
// @route   GET /api/events/organizer/:organizerId
// @access  Public
const getEventsByOrganizer = async (req, res) => {
  try {
    const events = await Event.find({ organizerId: req.params.organizerId })
      .sort({ eventStartDate: -1 })
      .populate('organizerId', 'organizerName category');

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getRecommendedEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  publishEvent,
  getEventsByOrganizer,
};
