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
      const variant = event.merchandiseDetails.variants.find(
        v => v.size === merchandiseOrder.size && v.color === merchandiseOrder.color
      );

      if (!variant) {
        return res.status(400).json({ message: 'Selected variant not available' });
      }

      if (variant.stockQuantity < merchandiseOrder.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock. Only ${variant.stockQuantity} items available.` 
        });
      }

      // Check purchase limit
      if (merchandiseOrder.quantity > event.merchandiseDetails.purchaseLimitPerParticipant) {
        return res.status(400).json({ 
          message: `Purchase limit is ${event.merchandiseDetails.purchaseLimitPerParticipant} per participant` 
        });
      }

      merchandiseOrder.totalPrice = variant.price * merchandiseOrder.quantity;
    }

    // Generate unique ticket ID
    const ticketId = generateTicketId();

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
      status: 'confirmed',
    });

    // Update event registration count
    event.currentRegistrations += 1;

    // For merchandise, update stock
    if (event.eventType === 'merchandise') {
      const variantIndex = event.merchandiseDetails.variants.findIndex(
        v => v.size === merchandiseOrder.size && v.color === merchandiseOrder.color
      );
      event.merchandiseDetails.variants[variantIndex].stockQuantity -= merchandiseOrder.quantity;
    }

    await event.save();

    const populatedRegistration = await Registration.findById(registration._id)
      .populate('eventId', 'eventName eventType eventStartDate venue registrationFee merchandiseDetails')
      .populate('participantId', 'firstName lastName email');

    // Send confirmation email with ticket (async, don't wait)
    sendRegistrationEmail(
      populatedRegistration.participantId,
      populatedRegistration.eventId,
      populatedRegistration
    ).catch(err => console.error('Email sending failed:', err));

    res.status(201).json({
      success: true,
      message: 'Registration successful. Confirmation email sent.',
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

    registration.checkedIn = true;
    registration.checkInTime = new Date();
    await registration.save();

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
    const registration = await Registration.findById(req.params.id).populate('eventId');
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

    // Generate ticket ID if not exists
    if (!registration.ticketId) {
      registration.ticketId = generateTicketId();
    }

    await registration.save();

    // Decrement stock for merchandise
    if (event.eventType === 'merchandise' && event.registrationLimit > 0) {
      event.registrationLimit -= 1;
      await event.save();
    }

    // TODO: Send confirmation email with QR code

    res.status(200).json({
      success: true,
      message: 'Payment approved successfully. Ticket generated.',
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

    const registration = await Registration.findById(req.params.id).populate('eventId');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const event = registration.eventId;

    // Check if organizer owns this event
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update registration status
    registration.paymentApprovalStatus = 'rejected';
    registration.paymentStatus = 'failed';
    registration.status = 'cancelled';
    registration.paymentRejectionReason = reason;
    registration.paymentApprovedBy = req.user._id;
    registration.paymentApprovedAt = new Date();

    await registration.save();

    // TODO: Send rejection email

    res.status(200).json({
      success: true,
      message: 'Payment rejected',
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

