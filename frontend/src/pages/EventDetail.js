import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, STYLES } from '../constants/theme';
import FeedbackForm from '../components/FeedbackForm';
import PaymentProofUpload from '../components/PaymentProofUpload';
import DiscussionForum from '../components/DiscussionForum';
import TicketQRCode from '../components/TicketQRCode';

const EventDetail = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registering, setRegistering] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [userRegistration, setUserRegistration] = useState(null);
  const [merchandiseOrder, setMerchandiseOrder] = useState({
    selectedSize: '',
    selectedColor: '',
    quantity: 1,
  });

  useEffect(() => {
    fetchEventDetails();
    checkRegistration();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await api.get(`/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Event data received:', response.data);
      // Backend returns { success: true, event }
      const eventData = response.data.event || response.data;
      setEvent(eventData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to fetch event details');
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await api.get('/registrations/my-registrations', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('All registrations:', response.data.registrations);
      console.log('Current eventId:', eventId);

      const registration = response.data.registrations?.find(
        reg => {
          const regEventId = reg.eventId?._id || reg.eventId;
          console.log('Comparing:', regEventId, 'with', eventId);
          return regEventId === eventId;
        }
      );

      console.log('Found registration:', registration);

      if (registration) {
        setAlreadyRegistered(true);
        setUserRegistration(registration);
        console.log('User is registered! Ticket:', registration.ticketId);
      } else {
        setAlreadyRegistered(false);
        setUserRegistration(null);
        console.log('User is NOT registered');
      }
    } catch (err) {
      console.error('Error checking registration:', err);
    }
  };

  const handleRegister = async () => {
    if (!canRegister()) return;

    try {
      setRegistering(true);
      setError('');

      const token = localStorage.getItem('token');

      const payload = { eventId: event._id };

      // Include merchandise order details for merchandise events
      if (event.eventType === 'merchandise') {
        payload.merchandiseOrder = {
          size: merchandiseOrder.selectedSize,
          color: merchandiseOrder.selectedColor,
          quantity: merchandiseOrder.quantity,
        };
      }

      await api.post(
        '/registrations',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Successfully registered for the event!');
      setAlreadyRegistered(true);
      setRegistering(false);

      // Refresh event details and registration status
      await fetchEventDetails();
      await checkRegistration();
    } catch (err) {
      console.error('Error registering:', err);
      setError(err.response?.data?.message || 'Failed to register for event');
      setRegistering(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Not specified';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canRegister = () => {
    if (!event) return false;
    if (alreadyRegistered) return false;

    // Check if registration deadline has passed
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    if (!isNaN(deadline.getTime()) && deadline < now) return false;

    // Check if registration limit is reached
    if (event.currentRegistrations >= event.registrationLimit) return false;

    // Check eligibility
    if (event.eligibility === 'iiit_only' && user.participantType !== 'iiit') return false;
    if (event.eligibility === 'external_only' && user.participantType === 'iiit') return false;

    return true;
  };

  const getBlockingReason = () => {
    if (!event) return '';
    if (alreadyRegistered) return 'You are already registered for this event';

    const now = new Date();
    const deadline = new Date(event.registrationDeadline);

    if (!isNaN(deadline.getTime()) && deadline < now) {
      return '⏰ Registration deadline has passed';
    }

    if (event.currentRegistrations >= event.registrationLimit) {
      return event.eventType === 'merchandise'
        ? '📦 Stock exhausted'
        : '🎫 Registration limit reached';
    }

    if (event.eligibility === 'iiit_only' && user.participantType !== 'iiit') {
      return '⚠️ This event is only for IIIT students';
    }

    if (event.eligibility === 'external_only' && user.participantType === 'iiit') {
      return '⚠️ This event is only for external participants';
    }

    return '';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.info} 100%)`,
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: COLORS.white, fontSize: '18px' }}>Loading event details...</div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.info} 100%)`,
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ ...STYLES.card, maxWidth: '600px', textAlign: 'center' }}>
          <p style={{ color: COLORS.accent, fontSize: '16px' }}>{error}</p>
          <button
            onClick={() => navigate('/participant/browse-events')}
            style={{
              ...STYLES.button,
              background: COLORS.primary,
              marginTop: '20px'
            }}
          >
            Back to Browse Events
          </button>
        </div>
      </div>
    );
  }

  const spotsLeft = (event?.registrationLimit || 0) - (event?.currentRegistrations || 0);
  const blockingReason = getBlockingReason();
  const canReg = canRegister();

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.info} 100%)`,
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/participant/browse-events')}
          style={{
            ...STYLES.button,
            background: COLORS.white,
            color: COLORS.primary,
            marginBottom: '20px'
          }}
        >
          ← Back to Events
        </button>

        {/* Event Header */}
        <div style={{ ...STYLES.card, marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: '0 0 10px 0', color: COLORS.primary, fontSize: '32px' }}>
                {event?.eventName || 'Event Name Not Available'}
              </h1>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  padding: '4px 12px',
                  background: event?.eventType === 'merchandise' ? COLORS.warning : COLORS.secondary,
                  color: COLORS.white,
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {event?.eventType === 'merchandise' ? '🛍️ MERCHANDISE' : '🎪 EVENT'}
                </span>
                <span style={{
                  padding: '4px 12px',
                  background:
                    event?.eligibility === 'all' ? COLORS.info :
                      event?.eligibility === 'iiit_only' ? COLORS.primary :
                        COLORS.accent,
                  color: COLORS.white,
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {event?.eligibility === 'all' ? 'ALL' :
                    event?.eligibility === 'iiit_only' ? 'IIIT ONLY' : 'EXTERNAL ONLY'}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: COLORS.secondary }}>
                ₹{event?.registrationFee || 0}
              </div>
              <div style={{ fontSize: '14px', color: COLORS.darkGray }}>
                {event?.eventType === 'merchandise' ? 'Price' : 'Registration Fee'}
              </div>
            </div>
          </div>

          {/* Organizer Info */}
          <div style={{
            padding: '15px',
            background: COLORS.veryLightGray,
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '14px', color: COLORS.darkGray, marginBottom: '5px' }}>
              Organized by
            </div>
            <div
              onClick={() => navigate(`/participant/organizers/${event.organizerId?._id}`)}
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: COLORS.primary,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {event.organizerId?.organizerName || 'Unknown Organizer'}
            </div>
            {event.organizerId?.category && (
              <div style={{ fontSize: '14px', color: COLORS.darkGray, marginTop: '5px' }}>
                Category: {event.organizerId.category}
              </div>
            )}
          </div>

          {/* Alerts */}
          {success && (
            <div style={{
              padding: '15px',
              background: '#d4edda',
              border: `1px solid #c3e6cb`,
              borderRadius: '8px',
              color: '#155724',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>✅ {success}</span>
              <button
                onClick={() => setSuccess('')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#155724'
                }}
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <div style={{
              padding: '15px',
              background: '#f8d7da',
              border: `1px solid #f5c6cb`,
              borderRadius: '8px',
              color: '#721c24',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>❌ {error}</span>
              <button
                onClick={() => setError('')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#721c24'
                }}
              >
                ×
              </button>
            </div>
          )}

          {blockingReason && (
            <div style={{
              padding: '15px',
              background: '#fff3cd',
              border: `1px solid #ffeaa7`,
              borderRadius: '8px',
              color: '#856404',
              marginBottom: '20px',
              fontWeight: '500'
            }}>
              {blockingReason}
            </div>
          )}

          {/* Registration Status / Button */}
          {alreadyRegistered ? (
            <div style={{ marginTop: '20px' }}>
              {userRegistration?.ticketId ? (
                <TicketQRCode
                  ticketId={userRegistration.ticketId}
                  eventName={event.eventName}
                  participantName={user?.name || user?.email}
                />
              ) : (
                <div style={{
                  ...STYLES.card,
                  background: `${COLORS.secondary}15`,
                  border: `2px solid ${COLORS.secondary}`,
                  textAlign: 'center'
                }}>
                  <h3 style={{ color: COLORS.secondary, margin: '0 0 12px 0', fontSize: '20px' }}>
                    ✅ You're Registered!
                  </h3>
                  <p style={{ color: COLORS.darkGray, margin: 0 }}>
                    Your ticket will be generated once your registration is approved.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleRegister}
              disabled={!canReg || registering}
              style={{
                ...STYLES.button,
                width: '100%',
                fontSize: '18px',
                padding: '15px',
                background: canReg ? COLORS.secondary : COLORS.lightGray,
                color: canReg ? COLORS.white : COLORS.darkGray,
                cursor: canReg ? 'pointer' : 'not-allowed',
                opacity: registering ? 0.6 : 1
              }}
            >
              {registering ? 'Registering...' :
                !canReg ? 'Registration Not Available' :
                  `🎫 Register for Event${event.registrationFee ? ` - ₹${event.registrationFee}` : ''}`}
            </button>
          )}
        </div>

        {/* Merchandise Variant Selection - Show before registration */}
        {event?.eventType === 'merchandise' && !alreadyRegistered && event.merchandiseDetails?.variants?.length > 0 && (
          <div style={{ ...STYLES.card, marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: COLORS.primary, fontSize: '20px' }}>
              🛍️ Select Your Options
            </h3>

            {/* Item Name */}
            {event.merchandiseDetails?.itemName && (
              <div style={{ marginBottom: '20px', padding: '12px', background: COLORS.veryLightGray, borderRadius: '8px' }}>
                <strong>Item:</strong> {event.merchandiseDetails.itemName}
              </div>
            )}

            {/* Size Selection */}
            {(() => {
              const sizes = [...new Set(event.merchandiseDetails.variants.map(v => v.size).filter(Boolean))];
              if (sizes.length === 0) return null;
              return (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '600' }}>
                    Size *
                  </label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setMerchandiseOrder({ ...merchandiseOrder, selectedSize: size })}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          border: merchandiseOrder.selectedSize === size
                            ? `2px solid ${COLORS.primary}`
                            : `1px solid ${COLORS.lightGray}`,
                          background: merchandiseOrder.selectedSize === size ? `${COLORS.primary}15` : COLORS.white,
                          color: merchandiseOrder.selectedSize === size ? COLORS.primary : COLORS.dark,
                          fontWeight: merchandiseOrder.selectedSize === size ? '600' : '400',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Color Selection */}
            {(() => {
              const colors = [...new Set(event.merchandiseDetails.variants.map(v => v.color).filter(Boolean))];
              if (colors.length === 0) return null;
              return (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '600' }}>
                    Color *
                  </label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setMerchandiseOrder({ ...merchandiseOrder, selectedColor: color })}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          border: merchandiseOrder.selectedColor === color
                            ? `2px solid ${COLORS.primary}`
                            : `1px solid ${COLORS.lightGray}`,
                          background: merchandiseOrder.selectedColor === color ? `${COLORS.primary}15` : COLORS.white,
                          color: merchandiseOrder.selectedColor === color ? COLORS.primary : COLORS.dark,
                          fontWeight: merchandiseOrder.selectedColor === color ? '600' : '400',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Quantity Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '600' }}>
                Quantity
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setMerchandiseOrder({ ...merchandiseOrder, quantity: Math.max(1, merchandiseOrder.quantity - 1) })}
                  style={{
                    ...STYLES.button,
                    width: '40px',
                    height: '40px',
                    padding: '0',
                    background: COLORS.lightGray,
                    color: COLORS.dark,
                    fontSize: '20px',
                  }}
                >
                  −
                </button>
                <span style={{ fontSize: '20px', fontWeight: '600', minWidth: '40px', textAlign: 'center' }}>
                  {merchandiseOrder.quantity}
                </span>
                <button
                  onClick={() => setMerchandiseOrder({
                    ...merchandiseOrder,
                    quantity: Math.min(event.merchandiseDetails?.purchaseLimitPerParticipant || 5, merchandiseOrder.quantity + 1)
                  })}
                  style={{
                    ...STYLES.button,
                    width: '40px',
                    height: '40px',
                    padding: '0',
                    background: COLORS.primary,
                    color: COLORS.white,
                    fontSize: '20px',
                  }}
                >
                  +
                </button>
                <span style={{ fontSize: '14px', color: COLORS.darkGray }}>
                  (Max: {event.merchandiseDetails?.purchaseLimitPerParticipant || 5} per person)
                </span>
              </div>
            </div>

            {/* Selected Variant Price */}
            {merchandiseOrder.selectedSize && (() => {
              const matchingVariant = event.merchandiseDetails.variants.find(
                v => v.size === merchandiseOrder.selectedSize &&
                  (!merchandiseOrder.selectedColor || v.color === merchandiseOrder.selectedColor)
              );
              if (!matchingVariant) return null;
              return (
                <div style={{
                  padding: '16px',
                  background: `${COLORS.secondary}15`,
                  borderRadius: '8px',
                  border: `1px solid ${COLORS.secondary}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>Selected:</strong> {merchandiseOrder.selectedSize}
                      {merchandiseOrder.selectedColor && ` / ${merchandiseOrder.selectedColor}`}
                      {' × '}{merchandiseOrder.quantity}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.secondary }}>
                      ₹{matchingVariant.price * merchandiseOrder.quantity}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.darkGray, marginTop: '8px' }}>
                    Stock available: {matchingVariant.stockQuantity}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Event Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          {/* Availability Status */}
          <div style={{ ...STYLES.card }}>
            <h3 style={{ margin: '0 0 15px 0', color: COLORS.primary, fontSize: '18px' }}>
              📊 Availability
            </h3>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '14px', color: COLORS.darkGray, marginBottom: '5px' }}>
                {event.eventType === 'merchandise' ? 'Stock Available' : 'Spots Available'}
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: spotsLeft < 10 ? COLORS.accent : COLORS.secondary
              }}>
                {spotsLeft} / {event.registrationLimit}
              </div>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '14px', color: COLORS.darkGray, marginBottom: '5px' }}>
                Current Registrations
              </div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: COLORS.dark }}>
                {event.currentRegistrations}
              </div>
            </div>
            <div style={{
              marginTop: '15px',
              padding: '10px',
              background: spotsLeft === 0 ? '#fee' : spotsLeft < 10 ? '#fff3cd' : '#d4edda',
              borderRadius: '6px',
              textAlign: 'center',
              fontWeight: '600',
              color: spotsLeft === 0 ? COLORS.accent : spotsLeft < 10 ? '#856404' : '#155724'
            }}>
              {spotsLeft === 0 ? '🚫 Sold Out' :
                spotsLeft < 10 ? '⚠️ Limited Spots!' :
                  '✅ Available'}
            </div>
          </div>

          {/* Important Dates */}
          <div style={{ ...STYLES.card }}>
            <h3 style={{ margin: '0 0 15px 0', color: COLORS.primary, fontSize: '18px' }}>
              📅 Important Dates
            </h3>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', color: COLORS.darkGray, marginBottom: '5px' }}>
                Registration Deadline
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: COLORS.accent }}>
                {formatDate(event.registrationDeadline)}
              </div>
              {formatTime(event.registrationDeadline) && (
                <div style={{ fontSize: '14px', color: COLORS.darkGray }}>
                  {formatTime(event.registrationDeadline)}
                </div>
              )}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', color: COLORS.darkGray, marginBottom: '5px' }}>
                Event Start Date
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: COLORS.secondary }}>
                {formatDate(event.eventStartDate)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: COLORS.darkGray, marginBottom: '5px' }}>
                Event End Date
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: COLORS.info }}>
                {formatDate(event.eventEndDate)}
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={{ ...STYLES.card }}>
            <h3 style={{ margin: '0 0 15px 0', color: COLORS.primary, fontSize: '18px' }}>
              📍 Location
            </h3>
            <div style={{ fontSize: '16px', color: COLORS.dark, lineHeight: '1.6' }}>
              {event.eventLocation || 'Location to be announced'}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ ...STYLES.card }}>
          <h3 style={{ margin: '0 0 15px 0', color: COLORS.primary, fontSize: '20px' }}>
            📝 Description
          </h3>
          <div style={{
            fontSize: '16px',
            color: COLORS.dark,
            lineHeight: '1.8',
            whiteSpace: 'pre-wrap'
          }}>
            {event.eventDescription || 'No description provided.'}
          </div>
        </div>

        {/* Additional Info */}
        {event.eventType === 'merchandise' && (
          <div style={{ ...STYLES.card, marginTop: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: COLORS.primary, fontSize: '20px' }}>
              🛍️ Merchandise Information
            </h3>
            <div style={{ fontSize: '16px', color: COLORS.dark, lineHeight: '1.8' }}>
              <p>• This is a merchandise item</p>
              <p>• Limited stock available: {spotsLeft} units</p>
              <p>• Price: ₹{event.registrationFee}</p>
              <p>• Purchase deadline: {formatDate(event.registrationDeadline)}</p>
            </div>
          </div>
        )}

        {/* Payment Proof Upload - Only show for merchandise if registered but not approved */}
        {event?.eventType === 'merchandise' &&
          alreadyRegistered &&
          userRegistration &&
          !userRegistration.paymentProof &&
          userRegistration.paymentApprovalStatus !== 'approved' && (
            <div style={{ marginTop: '20px' }}>
              <PaymentProofUpload
                registrationId={userRegistration._id}
                onSuccess={() => {
                  setSuccess('Payment proof uploaded successfully! Awaiting organizer approval.');
                  checkRegistration();
                }}
              />
            </div>
          )}

        {/* Payment Status Display */}
        {event?.eventType === 'merchandise' &&
          alreadyRegistered &&
          userRegistration &&
          userRegistration.paymentProof && (
            <div style={{ marginTop: '20px' }}>
              <div style={{
                ...STYLES.card,
                background: userRegistration.paymentApprovalStatus === 'approved'
                  ? `${COLORS.secondary}15`
                  : userRegistration.paymentApprovalStatus === 'rejected'
                    ? `${COLORS.accent}15`
                    : `${COLORS.warning}15`,
                border: `2px solid ${userRegistration.paymentApprovalStatus === 'approved'
                    ? COLORS.secondary
                    : userRegistration.paymentApprovalStatus === 'rejected'
                      ? COLORS.accent
                      : COLORS.warning
                  }`
              }}>
                <h3 style={{ marginBottom: '12px', color: COLORS.dark, fontSize: '18px' }}>
                  💳 Payment Status
                </h3>
                {userRegistration.paymentApprovalStatus === 'pending' && (
                  <>
                    <p style={{ color: COLORS.warning, fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                      ⏳ Pending Approval
                    </p>
                    <p style={{ color: COLORS.darkGray, fontSize: '14px', margin: 0 }}>
                      Your payment proof has been submitted and is awaiting organizer verification.
                    </p>
                  </>
                )}
                {userRegistration.paymentApprovalStatus === 'approved' && (
                  <>
                    <p style={{ color: COLORS.secondary, fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                      ✅ Payment Approved
                    </p>
                    <p style={{ color: COLORS.darkGray, fontSize: '14px', marginBottom: '8px' }}>
                      Your payment has been verified! Your ticket has been generated.
                    </p>
                    {userRegistration.ticketId && (
                      <div style={{
                        background: COLORS.white,
                        padding: '12px',
                        borderRadius: '6px',
                        marginTop: '12px'
                      }}>
                        <strong>Ticket ID:</strong> {userRegistration.ticketId}
                      </div>
                    )}
                  </>
                )}
                {userRegistration.paymentApprovalStatus === 'rejected' && (
                  <>
                    <p style={{ color: COLORS.accent, fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                      ❌ Payment Rejected
                    </p>
                    <p style={{ color: COLORS.darkGray, fontSize: '14px', marginBottom: '8px' }}>
                      Reason: {userRegistration.paymentRejectionReason || 'No reason provided'}
                    </p>
                    <p style={{ color: COLORS.darkGray, fontSize: '14px', margin: 0 }}>
                      Please contact the organizer for more information.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

        {/* Discussion Forum - Always show */}
        <div style={{ marginTop: '30px' }}>
          <div style={{ ...STYLES.card, marginBottom: '8px' }}>
            <h2 style={{ margin: '0 0 8px 0', color: COLORS.primary, fontSize: '24px' }}>
              💬 Discussion Forum
            </h2>
            <p style={{ margin: 0, color: COLORS.darkGray, fontSize: '14px' }}>
              Connect with other participants and organizers
            </p>
          </div>
          {alreadyRegistered || user.role === 'organizer' ? (
            <DiscussionForum eventId={eventId} />
          ) : (
            <div style={{
              ...STYLES.card,
              textAlign: 'center',
              padding: '40px 20px',
              background: `${COLORS.lightGray}50`
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
              <h3 style={{ color: COLORS.darkGray, marginBottom: '8px' }}>
                Register to Join the Discussion
              </h3>
              <p style={{ color: COLORS.darkGray, margin: 0 }}>
                You need to register for this event to participate in discussions
              </p>
            </div>
          )}
        </div>

        {/* Feedback Section - Always show */}
        <div style={{ marginTop: '30px' }}>
          <div style={{ ...STYLES.card, marginBottom: '8px' }}>
            <h2 style={{ margin: '0 0 8px 0', color: COLORS.primary, fontSize: '24px' }}>
              📝 Event Feedback
            </h2>
            <p style={{ margin: 0, color: COLORS.darkGray, fontSize: '14px' }}>
              Share your experience and help us improve
            </p>
          </div>
          {alreadyRegistered ? (
            <FeedbackForm eventId={eventId} onSuccess={() => setSuccess('Thank you for your feedback!')} />
          ) : (
            <div style={{
              ...STYLES.card,
              textAlign: 'center',
              padding: '40px 20px',
              background: `${COLORS.lightGray}50`
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
              <h3 style={{ color: COLORS.darkGray, marginBottom: '8px' }}>
                Register to Give Feedback
              </h3>
              <p style={{ color: COLORS.darkGray, margin: 0 }}>
                You need to register for this event to submit feedback
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
