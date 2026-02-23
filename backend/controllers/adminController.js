const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendOrganizerCredentials } = require('../utils/emailService');

// @desc    Create organizer account
// @route   POST /api/admin/organizers
// @access  Private/Admin
const createOrganizer = async (req, res) => {
  try {
    const { 
      organizerName, 
      email, 
      password, 
      category, 
      description, 
      contactEmail 
    } = req.body;

    // Validation
    if (!organizerName || !email || !password || !category || !description || !contactEmail) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: organizerName, email, password, category, description, contactEmail' 
      });
    }

    // Validate category
    const validCategories = ['club', 'council', 'fest_team', 'department', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create organizer
    const organizer = await User.create({
      organizerName,
      email,
      password,
      role: 'organizer',
      category,
      description,
      contactEmail,
      createdBy: req.user.id, // Admin who created this organizer
      // Legacy fields for backward compatibility
      name: organizerName,
      organizationType: category,
      organizationName: organizerName,
    });

    // Send credentials email (async, don't wait)
    sendOrganizerCredentials(contactEmail, email, password, organizerName)
      .catch(err => console.error('Failed to send credentials email:', err));

    res.status(201).json({
      success: true,
      message: 'Organizer account created successfully. Credentials sent to contact email.',
      organizer: {
        id: organizer._id,
        organizerName: organizer.organizerName,
        email: organizer.email,
        role: organizer.role,
        category: organizer.category,
        description: organizer.description,
        contactEmail: organizer.contactEmail,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all organizers
// @route   GET /api/admin/organizers
// @access  Private/Admin
const getOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer' }).select('-password');

    res.status(200).json({
      success: true,
      count: organizers.length,
      organizers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete/deactivate organizer
// @route   DELETE /api/admin/organizers/:id
// @access  Private/Admin
const deleteOrganizer = async (req, res) => {
  try {
    const organizer = await User.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    if (organizer.role !== 'organizer') {
      return res.status(400).json({ message: 'User is not an organizer' });
    }

    // Soft delete - deactivate account
    organizer.isActive = false;
    await organizer.save();

    res.status(200).json({
      success: true,
      message: 'Organizer account deactivated successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset organizer password
// @route   PUT /api/admin/organizers/:id/reset-password
// @access  Private/Admin
const resetOrganizerPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Please provide a valid password (minimum 6 characters)' 
      });
    }

    const organizer = await User.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    if (organizer.role !== 'organizer') {
      return res.status(400).json({ message: 'User is not an organizer' });
    }

    // Update password (will be hashed by pre-save hook)
    organizer.password = newPassword;
    await organizer.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all participants
// @route   GET /api/admin/participants
// @access  Private/Admin
const getParticipants = async (req, res) => {
  try {
    const participants = await User.find({ role: 'participant' }).select('-password');

    res.status(200).json({
      success: true,
      count: participants.length,
      participants,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrganizer,
  getOrganizers,
  deleteOrganizer,
  resetOrganizerPassword,
  getParticipants,
};
