const mongoose = require('mongoose');

// Section 7: Event Types & Section 8: Event Attributes
const eventSchema = new mongoose.Schema(
  {
    // Basic Event Information (Section 8)
    eventName: {
      type: String,
      required: [true, 'Please provide an event name'],
      trim: true,
    },
    eventDescription: {
      type: String,
      required: [true, 'Please provide an event description'],
    },
    eventType: {
      type: String,
      enum: ['normal', 'merchandise'],
      required: [true, 'Please specify event type'],
    },
    eligibility: {
      type: String,
      required: [true, 'Please specify eligibility criteria'],
      enum: ['iiit_only', 'all', 'external_only'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Please provide registration deadline'],
    },
    eventStartDate: {
      type: Date,
      required: [true, 'Please provide event start date'],
    },
    eventEndDate: {
      type: Date,
      required: [true, 'Please provide event end date'],
    },
    registrationLimit: {
      type: Number,
      required: [true, 'Please provide registration limit'],
      min: [1, 'Registration limit must be at least 1'],
    },
    registrationFee: {
      type: Number,
      required: [true, 'Please provide registration fee'],
      min: [0, 'Registration fee cannot be negative'],
      default: 0,
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer ID is required'],
    },
    eventTags: {
      type: [String],
      default: [],
    },
    
    // Event Status
    status: {
      type: String,
      enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
      default: 'draft',
    },
    
    // Registration tracking
    currentRegistrations: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Section 8: Normal Event specific fields
    customRegistrationForm: {
      type: [{
        fieldName: {
          type: String,
          required: true,
        },
        fieldType: {
          type: String,
          enum: ['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio', 'file', 'date'],
          required: true,
        },
        fieldLabel: {
          type: String,
          required: true,
        },
        placeholder: String,
        required: {
          type: Boolean,
          default: false,
        },
        options: [String], // For select, radio, checkbox
        validation: {
          minLength: Number,
          maxLength: Number,
          min: Number,
          max: Number,
          pattern: String,
        },
        order: {
          type: Number,
          default: 0,
        },
      }],
      required: function () {
        return this.eventType === 'normal';
      },
    },
    
    // Section 8: Merchandise Event specific fields
    merchandiseDetails: {
      itemName: {
        type: String,
        required: function () {
          return this.eventType === 'merchandise';
        },
      },
      variants: [{
        size: {
          type: String,
          enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'Free Size', 'NA'],
        },
        color: String,
        additionalInfo: String, // e.g., "Unisex", "Cotton", etc.
        stockQuantity: {
          type: Number,
          required: true,
          min: 0,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      }],
      purchaseLimitPerParticipant: {
        type: Number,
        default: 1,
        min: 1,
        required: function () {
          return this.eventType === 'merchandise';
        },
      },
      totalStock: {
        type: Number,
        default: 0,
      },
    },
    
    // Additional metadata for recommendations
    viewCount: {
      type: Number,
      default: 0,
    },
    
    // Venue information
    venue: {
      type: String,
      trim: true,
    },
    venueType: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      default: 'offline',
    },
    venueLink: {
      type: String, // For online/hybrid events
    },
    
    // Image/Media
    eventImage: {
      type: String, // URL to image
    },
    
    // Additional organizer notes
    organizerNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
eventSchema.index({ eventName: 'text', eventDescription: 'text' });
eventSchema.index({ eventType: 1, status: 1 });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ eventTags: 1 });
eventSchema.index({ registrationDeadline: 1, eventStartDate: 1 });

// Virtual for checking if registration is open
eventSchema.virtual('isRegistrationOpen').get(function () {
  const now = new Date();
  return (
    this.status === 'published' &&
    now < this.registrationDeadline &&
    this.currentRegistrations < this.registrationLimit
  );
});

// Virtual for spots remaining
eventSchema.virtual('spotsRemaining').get(function () {
  return this.registrationLimit - this.currentRegistrations;
});

// Validation: Event start date must be after registration deadline
eventSchema.pre('save', function (next) {
  if (this.eventStartDate < this.registrationDeadline) {
    return next(new Error('Event start date must be after registration deadline'));
  }
  
  if (this.eventEndDate < this.eventStartDate) {
    return next(new Error('Event end date must be after event start date'));
  }
  
  // Calculate total stock for merchandise
  if (this.eventType === 'merchandise' && this.merchandiseDetails.variants) {
    this.merchandiseDetails.totalStock = this.merchandiseDetails.variants.reduce(
      (total, variant) => total + variant.stockQuantity,
      0
    );
  }
  
  next();
});

// Configure virtuals to be included in JSON
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
