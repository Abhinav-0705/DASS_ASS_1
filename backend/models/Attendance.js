const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scannedAt: {
    type: Date,
    default: Date.now
  },
  scanMethod: {
    type: String,
    enum: ['qr-camera', 'qr-upload', 'manual'],
    default: 'qr-camera'
  },
  notes: String
}, {
  timestamps: true
});

// Prevent duplicate attendance records
attendanceSchema.index({ registrationId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
