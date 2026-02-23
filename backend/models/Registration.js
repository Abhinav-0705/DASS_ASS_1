const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Participant ID is required'],
    },
    
    // Ticket information
    ticketId: {
      type: String,
      unique: true,
      sparse: true,
    },
    
    // Registration status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'waitlisted'],
      default: 'pending',
    },
    
    // Attendance tracking
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkInTime: {
      type: Date,
    },
    
    // Custom form responses (for normal events)
    formResponses: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    
    // Merchandise order details (for merchandise events)
    merchandiseOrder: {
      variantId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      quantity: {
        type: Number,
        min: 1,
      },
      size: String,
      color: String,
      totalPrice: Number,
    },
    
    // Payment information
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: Date,
    transactionId: String,
    
    // Payment proof for merchandise (Tier A Feature)
    paymentProof: {
      type: String, // URL or base64 image
    },
    paymentProofUploadedAt: Date,
    paymentApprovalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    paymentApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    paymentApprovedAt: Date,
    paymentRejectionReason: String,
    
    // Check-in status (for event day)
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkInTime: Date,
    
    // Cancellation
    cancellationReason: String,
    cancelledAt: Date,
    
    // Additional notes
    participantNotes: String,
    organizerNotes: String,
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate registrations
registrationSchema.index({ eventId: 1, participantId: 1 }, { unique: true });

// Indexes for queries
registrationSchema.index({ participantId: 1, status: 1 });
registrationSchema.index({ eventId: 1, status: 1 });
registrationSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
