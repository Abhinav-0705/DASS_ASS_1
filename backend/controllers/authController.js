const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// @desc    Register a new participant
// @route   POST /api/auth/register
// @access  Public
const registerParticipant = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      participantType,
      collegeOrOrgName,
      contactNumber,
      areasOfInterest,
      followedOrganizers
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !participantType || !collegeOrOrgName || !contactNumber) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: firstName, lastName, email, password, participantType, collegeOrOrgName, contactNumber' 
      });
    }

    // Check if participantType is valid
    if (!['iiit', 'non-iiit'].includes(participantType)) {
      return res.status(400).json({ message: 'Invalid participant type' });
    }

    // IIIT email validation
    if (participantType === 'iiit') {
      const isIIITEmail = email.endsWith('@iiit.ac.in') || email.endsWith('@students.iiit.ac.in');
      if (!isIIITEmail) {
        return res.status(400).json({
          message: 'IIIT participants must register with IIIT-issued email ID',
        });
      }
    }

    // Validate contact number format
    if (!/^[0-9]{10}$/.test(contactNumber)) {
      return res.status(400).json({ message: 'Contact number must be a valid 10-digit number' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user with preferences
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role: 'participant',
      participantType,
      collegeOrOrgName,
      contactNumber,
      name: `${firstName} ${lastName}`, // Legacy field for backward compatibility
    };

    // Add preferences if provided (Section 5)
    if (areasOfInterest || followedOrganizers) {
      userData.preferences = {
        areasOfInterest: areasOfInterest || [],
        followedOrganizers: followedOrganizers || [],
        onboardingCompleted: !!(areasOfInterest || followedOrganizers),
      };
    }

    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        participantType: user.participantType,
        collegeOrOrgName: user.collegeOrOrgName,
        contactNumber: user.contactNumber,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user (Participant, Organizer, Admin)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Prepare user data based on role
    let userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    if (user.role === 'participant') {
      userData.participantType = user.participantType;
    } else if (user.role === 'organizer') {
      userData.organizationType = user.organizationType;
      userData.organizationName = user.organizationName;
    }

    res.status(200).json({
      success: true,
      token,
      user: userData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Logout user (clear token on client side)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Token invalidation happens on client side
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerParticipant,
  login,
  getMe,
  logout,
};
