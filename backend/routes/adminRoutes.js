const express = require('express');
const router = express.Router();
const {
  createOrganizer,
  getOrganizers,
  deleteOrganizer,
  resetOrganizerPassword,
  getParticipants,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and admin-only
router.use(protect);
router.use(authorize('admin'));

// Organizer management
router.post('/organizers', createOrganizer);
router.get('/organizers', getOrganizers);
router.delete('/organizers/:id', deleteOrganizer);
router.put('/organizers/:id/reset-password', resetOrganizerPassword);

// Participant management
router.get('/participants', getParticipants);

module.exports = router;
