const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const User = require('../models/User');
const crypto = require('crypto');
const { sendPasswordResetApproved, sendPasswordResetRejected } = require('../utils/emailService');

// @route   POST /api/password-reset/request
// @desc    Submit password reset request (Organizer)
// @access  Private (Organizer)
router.post('/request', protect, authorize('organizer'), async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a detailed reason (at least 10 characters)'
      });
    }

    // Check if there's already a pending request
    const existingRequest = await PasswordResetRequest.findOne({
      organizerId: req.user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending password reset request'
      });
    }

    // Create new request
    const request = await PasswordResetRequest.create({
      organizerId: req.user._id,
      reason
    });

    res.status(201).json({
      success: true,
      message: 'Password reset request submitted successfully',
      request
    });
  } catch (error) {
    console.error('Error creating password reset request:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/password-reset/my-requests
// @desc    Get my password reset requests (Organizer)
// @access  Private (Organizer)
router.get('/my-requests', protect, authorize('organizer'), async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find({ organizerId: req.user._id })
      .populate('reviewedBy', 'email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/password-reset/all
// @desc    Get all password reset requests (Admin)
// @access  Private (Admin)
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const requests = await PasswordResetRequest.find(query)
      .populate('organizerId', 'organizerName email clubName')
      .populate('reviewedBy', 'email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/password-reset/:requestId/approve
// @desc    Approve password reset request (Admin)
// @access  Private (Admin)
router.patch('/:requestId/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { adminComments } = req.body;

    const request = await PasswordResetRequest.findById(req.params.requestId)
      .populate('organizerId');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    // Generate random password
    const newPassword = crypto.randomBytes(8).toString('hex');

    // Update organizer's password
    const organizer = await User.findById(request.organizerId._id);
    organizer.password = newPassword; // Will be hashed by pre-save hook
    await organizer.save();

    // Update request
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.adminComments = adminComments || 'Password reset approved';
    request.newPassword = newPassword; // Store temporarily for admin to share
    await request.save();

    // Send email to organizer with new password
    sendPasswordResetApproved(
      organizer.email,
      organizer.organizerName || organizer.clubName,
      newPassword
    ).catch(err => console.error('Failed to send approval email:', err));

    res.json({
      success: true,
      message: 'Password reset approved. Email sent to organizer.',
      newPassword, // Admin gets this to share with organizer
      request
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/password-reset/:requestId/reject
// @desc    Reject password reset request (Admin)
// @access  Private (Admin)
router.patch('/:requestId/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { adminComments } = req.body;

    if (!adminComments || adminComments.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejection'
      });
    }

    const request = await PasswordResetRequest.findById(req.params.requestId)
      .populate('organizerId');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    // Update request
    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.adminComments = adminComments;
    await request.save();

    // Send rejection email to organizer
    sendPasswordResetRejected(
      request.organizerId.email,
      request.organizerId.organizerName || request.organizerId.clubName,
      adminComments
    ).catch(err => console.error('Failed to send rejection email:', err));

    res.json({
      success: true,
      message: 'Password reset request rejected. Email sent to organizer.',
      request
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
