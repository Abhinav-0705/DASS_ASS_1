const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Common fields
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      enum: ['participant', 'organizer', 'admin'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Participant-specific fields (Section 6.1)
    firstName: {
      type: String,
      required: function () {
        return this.role === 'participant';
      },
      trim: true,
    },
    lastName: {
      type: String,
      required: function () {
        return this.role === 'participant';
      },
      trim: true,
    },
    participantType: {
      type: String,
      enum: ['iiit', 'non-iiit'],
      required: function () {
        return this.role === 'participant';
      },
    },
    collegeOrOrgName: {
      type: String,
      required: function () {
        return this.role === 'participant';
      },
      trim: true,
    },
    contactNumber: {
      type: String,
      required: function () {
        return this.role === 'participant';
      },
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit contact number'],
    },
    
    // Participant Preferences (Section 5)
    preferences: {
      areasOfInterest: {
        type: [String],
        default: [],
      },
      followedOrganizers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      onboardingCompleted: {
        type: Boolean,
        default: false,
      },
    },
    
    // Organizer-specific fields (Section 6.2)
    organizerName: {
      type: String,
      required: function () {
        return this.role === 'organizer';
      },
      trim: true,
    },
    category: {
      type: String,
      required: function () {
        return this.role === 'organizer';
      },
      enum: ['club', 'council', 'fest_team', 'department', 'other'],
    },
    description: {
      type: String,
      required: function () {
        return this.role === 'organizer';
      },
    },
    contactEmail: {
      type: String,
      required: function () {
        return this.role === 'organizer';
      },
      lowercase: true,
      trim: true,
    },
    
    // Legacy fields for backward compatibility
    name: {
      type: String,
      trim: true,
    },
    organizationType: {
      type: String,
    },
    organizationName: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return this.role === 'organizer';
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Validate IIIT email domain
userSchema.methods.isIIITEmail = function () {
  return this.email.endsWith('@iiit.ac.in') || this.email.endsWith('@students.iiit.ac.in');
};

module.exports = mongoose.model('User', userSchema);
