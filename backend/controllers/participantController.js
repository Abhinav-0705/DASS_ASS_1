const User = require('../models/User');

// @desc    Update participant preferences (Section 5)
// @route   PUT /api/participant/preferences
// @access  Private (Participant only)
const updatePreferences = async (req, res) => {
  try {
    const { areasOfInterest, followedOrganizers } = req.body;

    // Validate that user is a participant
    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'Only participants can set preferences' });
    }

    // Validate followedOrganizers are actual organizers
    if (followedOrganizers && followedOrganizers.length > 0) {
      const organizers = await User.find({
        _id: { $in: followedOrganizers },
        role: 'organizer',
        isActive: true,
      });

      if (organizers.length !== followedOrganizers.length) {
        return res.status(400).json({ message: 'Some organizer IDs are invalid' });
      }
    }

    // Update preferences
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'preferences.areasOfInterest': areasOfInterest || req.user.preferences.areasOfInterest,
          'preferences.followedOrganizers': followedOrganizers || req.user.preferences.followedOrganizers,
          'preferences.onboardingCompleted': true,
        },
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get participant preferences
// @route   GET /api/participant/preferences
// @access  Private (Participant only)
const getPreferences = async (req, res) => {
  try {
    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'Only participants have preferences' });
    }

    const user = await User.findById(req.user._id)
      .select('preferences')
      .populate('preferences.followedOrganizers', 'organizerName category description');

    res.status(200).json({
      success: true,
      preferences: user.preferences,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get participant profile
// @route   GET /api/participant/profile
// @access  Private (Participant only)
const getProfile = async (req, res) => {
  try {
    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'This endpoint is for participants only' });
    }

    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('preferences.followedOrganizers', 'organizerName category description');

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update participant profile
// @route   PUT /api/participant/profile
// @access  Private (Participant only)
const updateProfile = async (req, res) => {
  try {
    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'This endpoint is for participants only' });
    }

    const { firstName, lastName, collegeOrOrgName, contactNumber } = req.body;

    // Build update object
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (collegeOrOrgName) updateData.collegeOrOrgName = collegeOrOrgName;
    if (contactNumber) {
      if (!/^[0-9]{10}$/.test(contactNumber)) {
        return res.status(400).json({ message: 'Contact number must be a valid 10-digit number' });
      }
      updateData.contactNumber = contactNumber;
    }

    // Update name for backward compatibility
    if (firstName || lastName) {
      updateData.name = `${firstName || req.user.firstName} ${lastName || req.user.lastName}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get list of available organizers to follow
// @route   GET /api/participant/organizers
// @access  Private (Participant only)
const getAvailableOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({
      role: 'organizer',
      isActive: true,
    }).select('organizerName category description contactEmail');

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

// @desc    Skip onboarding (preferences can be set later)
// @route   POST /api/participant/skip-onboarding
// @access  Private (Participant only)
const skipOnboarding = async (req, res) => {
  try {
    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'Only participants have onboarding' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'preferences.onboardingCompleted': true },
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding skipped. You can set preferences later from your profile.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Follow an organizer
// @route   POST /api/participant/organizers/:organizerId/follow
// @access  Private (Participant only)
const followOrganizer = async (req, res) => {
  try {
    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'Only participants can follow organizers' });
    }

    const { organizerId } = req.params;

    // Check if organizer exists and is active
    const organizer = await User.findOne({
      _id: organizerId,
      role: 'organizer',
      isActive: true,
    });

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    // Check if already following
    const user = await User.findById(req.user._id);
    if (user.preferences.followedOrganizers.includes(organizerId)) {
      return res.status(400).json({ message: 'Already following this organizer' });
    }

    // Add to followed organizers
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { 'preferences.followedOrganizers': organizerId },
    });

    res.status(200).json({
      success: true,
      message: `You are now following ${organizer.organizerName}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Unfollow an organizer
// @route   DELETE /api/participant/organizers/:organizerId/follow
// @access  Private (Participant only)
const unfollowOrganizer = async (req, res) => {
  try {
    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'Only participants can unfollow organizers' });
    }

    const { organizerId } = req.params;

    // Remove from followed organizers
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { 'preferences.followedOrganizers': organizerId },
    });

    res.status(200).json({
      success: true,
      message: 'Unfollowed successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single organizer details with events
// @route   GET /api/participant/organizers/:organizerId
// @access  Private (Participant only)
const getOrganizerDetails = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const organizer = await User.findOne({
      _id: organizerId,
      role: 'organizer',
      isActive: true,
    }).select('organizerName category description contactEmail');

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    // Check if current user is following this organizer
    const user = await User.findById(req.user._id);
    const isFollowing = user.preferences.followedOrganizers.includes(organizerId);

    res.status(200).json({
      success: true,
      organizer,
      isFollowing,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  updatePreferences,
  getPreferences,
  getProfile,
  updateProfile,
  getAvailableOrganizers,
  skipOnboarding,
  followOrganizer,
  unfollowOrganizer,
  getOrganizerDetails,
};
