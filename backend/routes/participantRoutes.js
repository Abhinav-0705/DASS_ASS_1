const express = require('express');
const router = express.Router();
const {
  updatePreferences,
  getPreferences,
  getProfile,
  updateProfile,
  getAvailableOrganizers,
  skipOnboarding,
  followOrganizer,
  unfollowOrganizer,
  getOrganizerDetails,
} = require('../controllers/participantController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and participant role
router.use(protect);
router.use(authorize('participant'));

// Preferences routes (Section 5)
router.route('/preferences')
  .get(getPreferences)
  .put(updatePreferences);

router.post('/skip-onboarding', skipOnboarding);

// Profile routes (Section 6.1)
router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

// Get available organizers to follow
router.get('/organizers', getAvailableOrganizers);

// Get single organizer details (9.8)
router.get('/organizers/:organizerId', getOrganizerDetails);

// Follow/Unfollow organizer (9.7)
router.post('/organizers/:organizerId/follow', followOrganizer);
router.delete('/organizers/:organizerId/follow', unfollowOrganizer);

module.exports = router;
