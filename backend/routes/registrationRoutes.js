const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  cancelRegistration,
  checkInParticipant,
  uploadPaymentProof,
  approvePayment,
  rejectPayment,
  getPaymentApprovalRequests,
} = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Participant routes
router.post('/', authorize('participant'), registerForEvent);
router.get('/my-registrations', authorize('participant'), getMyRegistrations);
router.delete('/:id', authorize('participant'), cancelRegistration);
router.post('/:id/upload-payment-proof', authorize('participant'), uploadPaymentProof);

// Organizer routes
router.get('/event/:eventId', authorize('organizer'), getEventRegistrations);
router.patch('/:id/checkin', authorize('organizer'), checkInParticipant);
router.get('/event/:eventId/payment-approvals', authorize('organizer'), getPaymentApprovalRequests);
router.patch('/:id/approve-payment', authorize('organizer'), approvePayment);
router.patch('/:id/reject-payment', authorize('organizer'), rejectPayment);

module.exports = router;
