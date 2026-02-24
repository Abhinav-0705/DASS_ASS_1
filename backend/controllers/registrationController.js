const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { generateTicketId, sendRegistrationEmail } = require('../utils/emailService');

// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private (Participant only)
const registerForEvent = async (req, res) => {
  try {
    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'Only participants can register for events' });
    }

    const { eventId, formResponses, merchandiseOrder } = req.body;

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is published and registration is open
    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Event is not open for registration' });
    }

    if (new Date() > event.registrationDeadline) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check eligibility
    const participant = await User.findById(req.user._id);
    if (event.eligibility === 'iiit_only' && participant.participantType !== 'iiit') {
      return res.status(403).json({ message: 'This event is only for IIIT students' });
    }
    if (event.eligibility === 'external_only' && participant.participantType === 'iiit') {
      return res.status(403).json({ message: 'This event is only for external participants' });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      eventId,
      participantId: req.user._id,
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    // Check registration limit
    if (event.currentRegistrations >= event.registrationLimit) {
      return res.status(400).json({ message: 'Event is full. Registration limit reached.' });
    }

    // For merchandise events, validate and check stock
    if (event.eventType === 'merchandise') {
      if (!merchandiseOrder) {
        return res.status(400).json({ message: 'Merchandise order details are required' });
      }

      // Find the variant
      const variant = event.merchandiseDetails?.variants?.find(
        v => v.size === merchandiseOrder.size && v.color === merchandiseOrder.color
      );

      if (variant) {
        // Variant exists - check stock
        if (variant.stockQuantity < (merchandiseOrder.quantity || 1)) {
          return res.status(400).json({
            message: `Insufficient stock. Only ${variant.stockQuantity} items available.`
          });
        }
        merchandiseOrder.totalPrice = variant.price * (merchandiseOrder.quantity || 1);
      } else {
        // No exact variant match - accept custom size/color with event's base fee
        merchandiseOrder.totalPrice = event.registrationFee * (merchandiseOrder.quantity || 1);
      }

      // Ensure quantity is set
      if (!merchandiseOrder.quantity) merchandiseOrder.quantity = 1;

      // Check purchase limit
      if (event.merchandiseDetails?.purchaseLimitPerParticipant &&
        merchandiseOrder.quantity > event.merchandiseDetails.purchaseLimitPerParticipant) {
        return res.status(400).json({
          message: `Purchase limit is ${event.merchandiseDetails.purchaseLimitPerParticipant} per participant`
        });
      }
    }

    // Generate unique ticket ID (only for non-merchandise events)
    const ticketId = event.eventType !== 'merchandise' ? generateTicketId() : null;

    // Create registration
    const registration = await Registration.create({
      eventId,
      participantId: req.user._id,
      ticketId,
      formResponses: formResponses || {},
      merchandiseOrder: merchandiseOrder || null,
      paymentAmount: event.eventType === 'merchandise'
        ? merchandiseOrder.totalPrice
        : event.registrationFee,
      paymentStatus: event.registrationFee === 0 && event.eventType !== 'merchandise'
        ? 'completed'
        : 'pending',
      // Merchandise starts as 'pending' (awaiting payment proof), normal events as 'confirmed'
      status: event.eventType === 'merchandise' ? 'pending' : 'confirmed',
      paymentApprovalStatus: event.eventType === 'merchandise' ? 'pending' : undefined,
    });

    // Update event registration count
    event.currentRegistrations += 1;

    // For non-merchandise events, update stock immediately
    // For merchandise, stock is decremented only after payment approval
    if (event.eventType === 'merchandise') {
      // Don't decrement stock yet - will happen on approval
    } else {
      await event.save();
    }

    await event.save();

    const populatedRegistration = await Registration.findById(registration._id)
      .populate('eventId', 'eventName eventType eventStartDate venue registrationFee merchandiseDetails')
      .populate('participantId', 'firstName lastName email');

    // Send confirmation email only for non-merchandise events
    // For merchandise, email is sent after organizer approves payment
    if (event.eventType !== 'merchandise') {
      sendRegistrationEmail(
        populatedRegistration.participantId,
        populatedRegistration.eventId,
        populatedRegistration
      ).catch(err => console.error('Email sending failed:', err));
    }

    res.status(201).json({
      success: true,
      message: event.eventType === 'merchandise'
        ? 'Order placed! Please upload payment proof to complete your purchase.'
        : 'Registration successful. Confirmation email sent.',
      registration: populatedRegistration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get participant's registrations
// @route   GET /api/registrations/my-registrations
// @access  Private (Participant only)
const getMyRegistrations = async (req, res) => {
  try {
    if (req.user.role !== 'participant') {
      return res.status(403).json({ message: 'Only participants have registrations' });
    }

    const { status } = req.query;
    const query = { participantId: req.user._id };

    if (status) {
      query.status = status;
    }

    const registrations = await Registration.find(query)
      .sort({ createdAt: -1 })
      .populate('eventId', 'eventName eventType eventStartDate eventEndDate venue organizerId')
      .populate({
        path: 'eventId',
        populate: {
          path: 'organizerId',
          select: 'organizerName',
        },
      });

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get registrations for an event (Organizer only)
// @route   GET /api/registrations/event/:eventId
// @access  Private (Organizer - event owner only)
const getEventRegistrations = async (req, res) => {
  try {
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Only organizers can view event registrations' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the event organizer
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these registrations' });
    }

    const { status, paymentStatus } = req.query;
    const query = { eventId: req.params.eventId };

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const registrations = await Registration.find(query)
      .sort({ createdAt: -1 })
      .populate('participantId', 'firstName lastName email contactNumber collegeOrOrgName');

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Cancel registration
// @route   DELETE /api/registrations/:id
// @access  Private (Participant - owner only)
const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Check if user owns this registration
    if (registration.participantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this registration' });
    }

    // Check if already cancelled
    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration is already cancelled' });
    }

    const event = await Event.findById(registration.eventId);

    // Check if cancellation is allowed (e.g., before event starts)
    if (new Date() > event.eventStartDate) {
      return res.status(400).json({ message: 'Cannot cancel registration after event has started' });
    }

    // Update registration status
    registration.status = 'cancelled';
    registration.cancelledAt = new Date();
    await registration.save();

    // Decrease event registration count
    event.currentRegistrations -= 1;

    // For merchandise, restore stock
    if (event.eventType === 'merchandise' && registration.merchandiseOrder) {
      const variantIndex = event.merchandiseDetails.variants.findIndex(
        v => v.size === registration.merchandiseOrder.size &&
          v.color === registration.merchandiseOrder.color
      );
      if (variantIndex !== -1) {
        event.merchandiseDetails.variants[variantIndex].stockQuantity +=
          registration.merchandiseOrder.quantity;
      }
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check-in participant (Organizer only)
// @route   PATCH /api/registrations/:id/checkin
// @access  Private (Organizer)
const checkInParticipant = async (req, res) => {
  try {
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Only organizers can check-in participants' });
    }

    const registration = await Registration.findById(req.params.id)
      .populate('eventId');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Verify organizer owns this event
    if (registration.eventId.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (registration.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed registrations can be checked in' });
    }

    if (registration.checkedIn) {
      return res.status(400).json({ message: 'Participant is already checked in' });
    }

    registration.checkedIn = true;
    registration.checkInTime = new Date();
    await registration.save();

    // Create an Attendance record as well so it shows in the QR scanner dashboard
    const Attendance = require('../models/Attendance');
    await Attendance.create({
      registrationId: registration._id,
      eventId: registration.eventId._id,
      participantId: registration.participantId._id,
      scannedBy: req.user._id,
      scanMethod: 'manual',
      notes: 'Marked present from Organizer Event Dashboard'
    });

    res.status(200).json({
      success: true,
      message: 'Participant checked in successfully',
      registration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload payment proof for merchandise order
// @route   POST /api/registrations/:id/upload-payment-proof
// @access  Private (Participant only)
const uploadPaymentProof = async (req, res) => {
  try {
    const { paymentProof } = req.body; // Base64 encoded image

    if (!paymentProof) {
      return res.status(400).json({ message: 'Payment proof is required' });
    }

    const registration = await Registration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Check if user owns this registration
    if (registration.participantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update registration with payment proof
    registration.paymentProof = paymentProof;
    registration.paymentProofUploadedAt = new Date();
    registration.paymentApprovalStatus = 'pending';
    registration.status = 'pending'; // Keep as pending until approved
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Payment proof uploaded successfully. Awaiting organizer approval.',
      registration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all payment approval requests for an event
// @route   GET /api/registrations/event/:eventId/payment-approvals
// @access  Private (Organizer only)
const getPaymentApprovalRequests = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get all registrations with payment proofs
    const registrations = await Registration.find({
      eventId,
      paymentProof: { $exists: true, $ne: null },
    })
      .populate('participantId', 'firstName lastName email')
      .sort({ paymentProofUploadedAt: -1 });

    res.status(200).json({
      success: true,
      registrations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Approve payment for merchandise order
// @route   PATCH /api/registrations/:id/approve-payment
// @access  Private (Organizer only)
const approvePayment = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('eventId')
      .populate('participantId', 'firstName lastName email');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const event = registration.eventId;

    // Check if organizer owns this event
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if payment proof exists
    if (!registration.paymentProof) {
      return res.status(400).json({ message: 'No payment proof uploaded' });
    }

    // Update registration status
    registration.paymentApprovalStatus = 'approved';
    registration.paymentStatus = 'completed';
    registration.status = 'confirmed';
    registration.paymentApprovedBy = req.user._id;
    registration.paymentApprovedAt = new Date();
    registration.paymentDate = new Date();

    // Generate ticket ID on approval
    if (!registration.ticketId) {
      registration.ticketId = generateTicketId();
    }

    // Decrement stock for the matching variant
    if (event.eventType === 'merchandise' && registration.merchandiseOrder) {
      const variantIndex = event.merchandiseDetails?.variants?.findIndex(
        v => v.size === registration.merchandiseOrder.size && v.color === registration.merchandiseOrder.color
      );
      if (variantIndex !== undefined && variantIndex !== -1) {
        event.merchandiseDetails.variants[variantIndex].stockQuantity -= (registration.merchandiseOrder.quantity || 1);
      }
      await event.save();
    }

    await registration.save();

    // Send confirmation email with QR code on approval
    sendRegistrationEmail(
      registration.participantId,
      registration.eventId,
      registration
    ).catch(err => console.error('Approval email sending failed:', err));

    res.status(200).json({
      success: true,
      message: 'Payment approved successfully. Ticket generated and email sent.',
      registration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reject payment for merchandise order
// @route   PATCH /api/registrations/:id/reject-payment
// @access  Private (Organizer only)
const rejectPayment = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const registration = await Registration.findById(req.params.id)
      .populate('eventId')
      .populate('participantId', 'firstName lastName email');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const event = registration.eventId;

    // Check if organizer owns this event
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update registration - clear payment proof so user can re-upload
    registration.paymentApprovalStatus = 'rejected';
    registration.paymentStatus = 'pending';
    registration.status = 'pending'; // Keep as pending, not cancelled - allow re-upload
    registration.paymentRejectionReason = reason;
    registration.paymentProof = null; // Clear proof so they can re-upload
    registration.paymentProofUploadedAt = null;
    registration.paymentApprovedBy = req.user._id;
    registration.paymentApprovedAt = new Date();

    await registration.save();

    // Send rejection email
    const { sendPaymentRejectedEmail } = require('../utils/emailService');
    if (sendPaymentRejectedEmail) {
      sendPaymentRejectedEmail(
        registration.participantId,
        event,
        reason
      ).catch(err => console.error('Rejection email sending failed:', err));
    }

    res.status(200).json({
      success: true,
      message: 'Payment rejected. User can re-upload payment proof.',
      registration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  cancelRegistration,
  checkInParticipant,
  uploadPaymentProof,
  approvePayment,
  rejectPayment,
  getPaymentApprovalRequests,
};

