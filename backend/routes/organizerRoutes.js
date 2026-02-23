const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Middleware to verify organizer authentication
const verifyOrganizer = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'organizer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get organizer profile
router.get('/profile', verifyOrganizer, async (req, res) => {
  try {
    const organizer = await User.findById(req.userId).select('-password');
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }
    res.json({ organizer });
  } catch (error) {
    console.error('Error fetching organizer profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update organizer profile
router.put('/profile', verifyOrganizer, async (req, res) => {
  try {
    const { organizerName, category, description, contactEmail, contactNumber } = req.body;

    const organizer = await User.findById(req.userId);
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    // Update fields
    if (organizerName) organizer.organizerName = organizerName;
    if (organizerName) organizer.name = organizerName; // Update both fields
    if (category) {
      organizer.category = category;
      organizer.organizationType = category; // Update both fields
    }
    if (description) organizer.description = description;
    if (contactEmail) organizer.contactEmail = contactEmail;
    if (contactNumber !== undefined) organizer.contactNumber = contactNumber;

    await organizer.save();

    const updatedOrganizer = await User.findById(req.userId).select('-password');
    res.json({ 
      message: 'Profile updated successfully', 
      organizer: updatedOrganizer 
    });
  } catch (error) {
    console.error('Error updating organizer profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/change-password', verifyOrganizer, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const organizer = await User.findById(req.userId).select('+password');
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, organizer.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update new password (will be hashed by pre-save hook)
    organizer.password = newPassword;
    await organizer.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
