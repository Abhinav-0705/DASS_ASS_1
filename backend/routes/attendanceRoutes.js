const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// @route   POST /api/attendance/scan
// @desc    Scan QR code and mark attendance
// @access  Private (Organizer)
router.post('/scan', protect, authorize('organizer'), async (req, res) => {
  try {
    const { ticketId, scanMethod = 'qr-camera', notes } = req.body;

    if (!ticketId) {
      return res.status(400).json({ success: false, message: 'Ticket ID is required' });
    }

    // Find registration by ticket ID
    const registration = await Registration.findOne({ ticketId })
      .populate('participantId', 'firstName lastName email')
      .populate('eventId', 'eventName organizerId');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Invalid ticket ID' });
    }

    // Verify organizer owns this event
    if (registration.eventId.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to scan tickets for this event' });
    }

    // Check if already scanned
    const existingAttendance = await Attendance.findOne({ registrationId: registration._id });
    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked',
        attendance: existingAttendance
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      registrationId: registration._id,
      eventId: registration.eventId._id,
      participantId: registration.participantId._id,
      scannedBy: req.user._id,
      scanMethod,
      notes
    });

    // Update registration
    registration.checkedIn = true;
    registration.checkInTime = new Date();
    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      attendance,
      participant: {
        name: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
        email: registration.participantId.email
      }
    });
  } catch (error) {
    console.error('Error scanning attendance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/attendance/manual
// @desc    Manually mark attendance (override)
// @access  Private (Organizer)
router.post('/manual', protect, authorize('organizer'), async (req, res) => {
  try {
    const { registrationId, notes } = req.body;

    if (!registrationId) {
      return res.status(400).json({ success: false, message: 'Registration ID is required' });
    }

    const registration = await Registration.findById(registrationId)
      .populate('participantId', 'firstName lastName email')
      .populate('eventId', 'eventName organizerId');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    // Verify organizer owns this event
    if (registration.eventId.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if already marked
    let attendance = await Attendance.findOne({ registrationId: registration._id });
    
    if (attendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked'
      });
    }

    // Create attendance record
    attendance = await Attendance.create({
      registrationId: registration._id,
      eventId: registration.eventId._id,
      participantId: registration.participantId._id,
      scannedBy: req.user._id,
      scanMethod: 'manual',
      notes: notes || 'Manual override'
    });

    // Update registration
    registration.checkedIn = true;
    registration.checkInTime = new Date();
    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Attendance marked manually',
      attendance
    });
  } catch (error) {
    console.error('Error marking manual attendance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/attendance/event/:eventId
// @desc    Get attendance report for an event
// @access  Private (Organizer)
router.get('/event/:eventId', protect, authorize('organizer'), async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Get all registrations
    const registrations = await Registration.find({ eventId })
      .populate('participantId', 'firstName lastName email');

    // Get all attendance records
    const attendances = await Attendance.find({ eventId })
      .populate('participantId', 'firstName lastName email')
      .populate('scannedBy', 'organizerName');

    // Build report
    const report = registrations.map(reg => {
      const attendance = attendances.find(
        att => att.registrationId.toString() === reg._id.toString()
      );

      return {
        registrationId: reg._id,
        ticketId: reg.ticketId,
        participantName: `${reg.participantId.firstName} ${reg.participantId.lastName}`,
        participantEmail: reg.participantId.email,
        registrationDate: reg.createdAt,
        attended: !!attendance,
        checkInTime: attendance?.scannedAt || null,
        scanMethod: attendance?.scanMethod || null,
        scannedBy: attendance?.scannedBy?.organizerName || null
      };
    });

    const stats = {
      total: registrations.length,
      attended: attendances.length,
      notAttended: registrations.length - attendances.length,
      attendanceRate: registrations.length > 0 
        ? ((attendances.length / registrations.length) * 100).toFixed(2) 
        : 0
    };

    res.json({
      success: true,
      stats,
      report
    });
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/attendance/:attendanceId
// @desc    Remove attendance record (undo check-in)
// @access  Private (Organizer)
router.delete('/:attendanceId', protect, authorize('organizer'), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.attendanceId).populate('eventId');
    
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    // Verify organizer owns this event
    if (attendance.eventId.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Update registration
    await Registration.findByIdAndUpdate(attendance.registrationId, {
      checkedIn: false,
      checkInTime: null
    });

    // Delete attendance record
    await Attendance.findByIdAndDelete(req.params.attendanceId);

    res.json({
      success: true,
      message: 'Attendance record removed'
    });
  } catch (error) {
    console.error('Error removing attendance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
