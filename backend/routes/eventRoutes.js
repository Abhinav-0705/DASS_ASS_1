const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getRecommendedEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  publishEvent,
  getEventsByOrganizer,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getEvents);
router.get('/organizer/:organizerId', getEventsByOrganizer);

// Get registrations for an event (organizer only) - MUST be before /:id route
router.get('/:id/registrations', protect, authorize('organizer'), async (req, res) => {
  try {
    const Registration = require('../models/Registration');
    const Event = require('../models/Event');

    console.log('Fetching registrations for event:', req.params.id);
    console.log('Organizer ID:', req.user._id);

    // Verify event belongs to this organizer
    const event = await Event.findById(req.params.id);
    if (!event) {
      console.log('Event not found');
      return res.status(404).json({ message: 'Event not found' });
    }

    console.log('Event organizerId:', event.organizerId?.toString());
    if (event.organizerId.toString() !== req.user._id.toString()) {
      console.log('Authorization failed');
      return res.status(403).json({ message: 'Not authorized to view these registrations' });
    }

    const registrations = await Registration.find({ eventId: req.params.id })
      .populate('participantId', 'firstName lastName email contactNumber')
      .sort({ createdAt: -1 });

    console.log('Found registrations:', registrations.length);
    res.json({ registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// This route must come AFTER more specific routes like /:id/registrations
router.get('/:id', getEventById);

// Protected routes - recommendations (participant only)
router.get('/recommendations/for-me', protect, authorize('participant'), getRecommendedEvents);

// Protected routes - organizer only
router.post('/', protect, authorize('organizer'), createEvent);
router.put('/:id', protect, authorize('organizer'), updateEvent);
router.delete('/:id', protect, authorize('organizer'), deleteEvent);
router.patch('/:id/publish', protect, authorize('organizer'), publishEvent);

module.exports = router;
