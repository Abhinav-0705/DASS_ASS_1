import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableEvents, setAvailableEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationData, setRegistrationData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const eventsResponse = await api.get('/events', {
        params: {
          status: 'published',
          limit: 100
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      const now = new Date();
      const available = eventsResponse.data.events.filter(event =>
        new Date(event.registrationDeadline) > now
      );

      setAvailableEvents(available);

      const registrationsResponse = await api.get('/registrations/my-registrations', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMyRegistrations(registrationsResponse.data.registrations || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const handleRegisterClick = (event) => {
    setSelectedEvent(event);
    setShowRegisterModal(true);
    setRegistrationData({});
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      const payload = {
        eventId: selectedEvent._id,
      };

      if (selectedEvent.eventType === 'normal' && selectedEvent.customRegistrationForm?.length > 0) {
        payload.formResponses = registrationData;
      }

      if (selectedEvent.eventType === 'merchandise') {
        payload.merchandiseOrder = registrationData.merchandiseOrder;
      }

      await api.post('/registrations', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (selectedEvent.eventType === 'merchandise') {
        setSuccess(`ORDER_PLACED:${selectedEvent._id}:${selectedEvent.eventName}`);
      } else {
        setSuccess('Successfully registered! Check your email for confirmation with ticket details.');
      }
      setShowRegisterModal(false);
      setSelectedEvent(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register for event');
    }
  };

  const handleCancelRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to cancel this registration? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/registrations/${registrationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Registration cancelled successfully! Stock has been restored.');
      setError('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel registration');
      setSuccess('');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const registeredEventIds = myRegistrations.map(reg => reg.eventId?._id || reg.eventId);
  const eventsToShow = availableEvents.filter(event => !registeredEventIds.includes(event._id));

  const now = new Date();
  const upcomingRegistrations = myRegistrations.filter(reg => {
    const event = reg.eventId;
    return event && new Date(event.eventStartDate) > now && reg.status === 'confirmed';
  });

  const normalRegistrations = myRegistrations.filter(reg => reg.eventId?.eventType === 'normal');
  const merchandiseRegistrations = myRegistrations.filter(reg => reg.eventId?.eventType === 'merchandise');

  const completedRegistrations = myRegistrations.filter(reg => {
    const event = reg.eventId;
    return event && new Date(event.eventEndDate) < now && reg.status === 'confirmed';
  });

  const cancelledRegistrations = myRegistrations.filter(reg =>
    ['cancelled', 'waitlisted'].includes(reg.status)
  );

  const getTabRegistrations = () => {
    switch (activeTab) {
      case 'upcoming': return upcomingRegistrations;
      case 'normal': return normalRegistrations;
      case 'merchandise': return merchandiseRegistrations;
      case 'completed': return completedRegistrations;
      case 'cancelled': return cancelledRegistrations;
      default: return upcomingRegistrations;
    }
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', padding: '20px' }}>
      {/* Header Section with Stats */}
      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#667eea', fontSize: '32px' }}>
          🎉 Welcome back, {user?.firstName} {user?.lastName}!
        </h2>
        <p style={{ margin: '5px 0', color: '#666', fontSize: '16px' }}>
          📧 {user?.email} |
          {user?.participantType === 'iiit' ? ' 🎓 IIIT Student' : ' 🌐 External Participant'}
        </p>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '15px 25px',
            borderRadius: '10px',
            color: 'white',
            flex: 1,
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{upcomingRegistrations.length}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Upcoming Events</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: '15px 25px',
            borderRadius: '10px',
            color: 'white',
            flex: 1,
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{myRegistrations.length}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Registrations</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            padding: '15px 25px',
            borderRadius: '10px',
            color: 'white',
            flex: 1,
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{completedRegistrations.length}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Completed</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          marginBottom: '20px',
          padding: '15px 20px',
          borderRadius: '10px',
          background: '#fee',
          border: '2px solid #f44336',
          color: '#d32f2f',
        }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{
          marginBottom: '20px',
          padding: '15px 20px',
          borderRadius: '10px',
          background: '#e8f5e9',
          border: '2px solid #4CAF50',
          color: '#2e7d32',
        }}>
          {success.startsWith('ORDER_PLACED:') ? (
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                ✅ Order placed successfully!
              </div>
              <p style={{ margin: '0 0 12px 0' }}>
                Your merchandise order for <strong>{success.split(':')[2]}</strong> has been placed.
                Please upload your payment proof to complete the purchase.
              </p>
              <button
                onClick={() => navigate(`/participant/event/${success.split(':')[1]}`)}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '20px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                📸 Go to Event Details → Upload Payment Proof
              </button>
            </div>
          ) : (
            <span>✅ {success}</span>
          )}
        </div>
      )}

      {/* My Registrations Section */}
      <div style={{
        marginBottom: '20px',
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#667eea', fontSize: '24px' }}>
          📋 My Registrations ({myRegistrations.length})
        </h3>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '15px',
          borderBottom: '3px solid #e0e0e0',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'upcoming', icon: '🚀', label: 'Upcoming', count: upcomingRegistrations.length },
            { key: 'normal', icon: '🎯', label: 'Normal Events', count: normalRegistrations.length },
            { key: 'merchandise', icon: '🛍️', label: 'Merchandise', count: merchandiseRegistrations.length },
            { key: 'completed', icon: '✅', label: 'Completed', count: completedRegistrations.length },
            { key: 'cancelled', icon: '❌', label: 'Cancelled', count: cancelledRegistrations.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: activeTab === tab.key ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#666',
                cursor: 'pointer',
                borderRadius: '10px 10px 0 0',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                transition: 'all 0.3s ease',
                fontSize: '15px',
                transform: activeTab === tab.key ? 'translateY(-3px)' : 'none',
                boxShadow: activeTab === tab.key ? '0 5px 15px rgba(102, 126, 234, 0.4)' : 'none'
              }}
            >
              {tab.icon} {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Registrations Table */}
        {getTabRegistrations().length > 0 ? (
          <div style={{ marginTop: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '15px', textAlign: 'left', borderRadius: '10px 0 0 10px' }}>Event</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Organizer</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Ticket ID</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'left', borderRadius: '0 10px 10px 0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getTabRegistrations().map((registration) => {
                  const event = registration.eventId;
                  const statusColors = {
                    'confirmed': '#4CAF50',
                    'cancelled': '#f44336',
                    'pending': '#ff9800',
                    'waitlisted': '#9e9e9e'
                  };

                  return (
                    <tr key={registration._id} style={{
                      background: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s'
                    }}>
                      <td style={{ padding: '15px', borderRadius: '10px 0 0 10px', fontWeight: 'bold', color: '#333' }}>
                        {event?.eventName || 'N/A'}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          background: event?.eventType === 'normal' ? '#e3f2fd' : '#fff3e0',
                          color: event?.eventType === 'normal' ? '#1976d2' : '#f57c00',
                          fontSize: '13px',
                          fontWeight: 'bold'
                        }}>
                          {event?.eventType === 'normal' ? '🎯 Normal' : '🛍️ Merch'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', color: '#666' }}>
                        {event?.organizerId?.organizerName || 'N/A'}
                      </td>
                      <td style={{ padding: '15px', color: '#666' }}>
                        {event?.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '5px',
                          background: '#e8eaf6',
                          color: '#3f51b5',
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          fontSize: '13px'
                        }}>
                          {registration.ticketId || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          background: statusColors[registration.status] || '#9e9e9e',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {registration.status}
                        </span>
                      </td>
                      <td style={{ padding: '15px', borderRadius: '0 10px 10px 0' }}>
                        {registration.status === 'confirmed' && activeTab === 'upcoming' && (
                          <button
                            onClick={() => handleCancelRegistration(registration._id)}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                              border: 'none',
                              borderRadius: '20px',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              transition: 'transform 0.2s',
                            }}
                          >
                            🚫 Cancel
                          </button>
                        )}
                        {registration.status === 'cancelled' && (
                          <span style={{ color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                            {registration.cancelledAt ? `Cancelled ${new Date(registration.cancelledAt).toLocaleDateString()}` : 'Cancelled'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#999',
            marginTop: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
            <p style={{ fontSize: '18px' }}>No registrations in this category yet.</p>
          </div>
        )}
      </div>

      {/* Available Events Section */}
      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#667eea', fontSize: '24px' }}>
          🎪 Available Events ({eventsToShow.length})
        </h3>

        {eventsToShow.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '15px', textAlign: 'left', borderRadius: '10px 0 0 10px' }}>Event Name</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Organizer</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Start Date</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Deadline</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Spots</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Fee</th>
                <th style={{ padding: '15px', textAlign: 'left', borderRadius: '0 10px 10px 0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {eventsToShow.map((event) => (
                <tr key={event._id} style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <td style={{ padding: '15px', borderRadius: '10px 0 0 10px', fontWeight: 'bold' }}>{event.eventName}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      background: event.eventType === 'normal' ? '#e3f2fd' : '#fff3e0',
                      color: event.eventType === 'normal' ? '#1976d2' : '#f57c00',
                      fontSize: '13px',
                      fontWeight: 'bold'
                    }}>
                      {event.eventType}
                    </span>
                  </td>
                  <td style={{ padding: '15px', color: '#666' }}>{event.organizerId?.organizerName || 'N/A'}</td>
                  <td style={{ padding: '15px', color: '#666' }}>{new Date(event.eventStartDate).toLocaleDateString()}</td>
                  <td style={{ padding: '15px', color: '#666' }}>{new Date(event.registrationDeadline).toLocaleDateString()}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ color: (event.registrationLimit - event.currentRegistrations) < 10 ? 'red' : 'green', fontWeight: 'bold' }}>
                      {event.registrationLimit - event.currentRegistrations}/{event.registrationLimit}
                    </span>
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>₹{event.registrationFee}</td>
                  <td style={{ padding: '15px', borderRadius: '0 10px 10px 0' }}>
                    <button
                      onClick={() => handleRegisterClick(event)}
                      disabled={event.currentRegistrations >= event.registrationLimit}
                      style={{
                        padding: '8px 16px',
                        background: event.currentRegistrations >= event.registrationLimit
                          ? '#ccc'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '20px',
                        color: 'white',
                        cursor: event.currentRegistrations >= event.registrationLimit ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px'
                      }}
                    >
                      {event.currentRegistrations >= event.registrationLimit ? 'Full' : 'Register'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎭</div>
            <p style={{ fontSize: '18px' }}>No events available at the moment. Check back soon!</p>
          </div>
        )}
      </div>

      {/* Registration Modal - Same as before */}
      {showRegisterModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Register for {selectedEvent.eventName}</h3>
            <p><strong>Organizer:</strong> {selectedEvent.organizerId?.organizerName}</p>
            <p><strong>Description:</strong> {selectedEvent.eventDescription}</p>
            <p><strong>Date:</strong> {new Date(selectedEvent.eventStartDate).toLocaleString()}</p>
            <p><strong>Fee:</strong> ₹{selectedEvent.registrationFee}</p>

            <form onSubmit={handleRegister}>
              {selectedEvent.eventType === 'normal' && selectedEvent.customRegistrationForm?.length > 0 && (
                <div>
                  <h4>Additional Information</h4>
                  {selectedEvent.customRegistrationForm.map((field) => (
                    <div key={field.fieldName} className="form-group">
                      <label>{field.fieldLabel} {field.required && <span style={{ color: 'red' }}>*</span>}</label>
                      {field.fieldType === 'text' && (
                        <input
                          type="text"
                          required={field.required}
                          onChange={(e) => setRegistrationData({
                            ...registrationData,
                            [field.fieldName]: e.target.value
                          })}
                        />
                      )}
                      {field.fieldType === 'email' && (
                        <input
                          type="email"
                          required={field.required}
                          onChange={(e) => setRegistrationData({
                            ...registrationData,
                            [field.fieldName]: e.target.value
                          })}
                        />
                      )}
                      {field.fieldType === 'number' && (
                        <input
                          type="number"
                          required={field.required}
                          onChange={(e) => setRegistrationData({
                            ...registrationData,
                            [field.fieldName]: e.target.value
                          })}
                        />
                      )}
                      {field.fieldType === 'textarea' && (
                        <textarea
                          required={field.required}
                          onChange={(e) => setRegistrationData({
                            ...registrationData,
                            [field.fieldName]: e.target.value
                          })}
                        />
                      )}
                      {field.fieldType === 'select' && (
                        <select
                          required={field.required}
                          onChange={(e) => setRegistrationData({
                            ...registrationData,
                            [field.fieldName]: e.target.value
                          })}
                        >
                          <option value="">Select...</option>
                          {field.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedEvent.eventType === 'merchandise' && (() => {
                const variantSizes = [...new Set(selectedEvent.merchandiseDetails?.variants?.map(v => v.size).filter(Boolean) || [])];
                const variantColors = [...new Set(selectedEvent.merchandiseDetails?.variants?.map(v => v.color).filter(Boolean) || [])];
                const sizes = variantSizes.length > 0 ? variantSizes : ['S', 'M', 'L', 'XL', 'XXL'];
                const colors = variantColors.length > 0 ? variantColors : ['Black', 'White', 'Navy Blue'];
                const currentOrder = registrationData.merchandiseOrder || {};
                const maxQty = selectedEvent.merchandiseDetails?.purchaseLimitPerParticipant || 5;

                return (
                  <div>
                    <h4>Select Item</h4>
                    {selectedEvent.merchandiseDetails?.itemName && (
                      <p><strong>Item:</strong> {selectedEvent.merchandiseDetails.itemName}</p>
                    )}
                    <p><strong>Purchase Limit:</strong> {maxQty} per person</p>

                    {/* Size Selection */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Size *</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {sizes.map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setRegistrationData({
                              ...registrationData,
                              merchandiseOrder: { ...currentOrder, size }
                            })}
                            style={{
                              padding: '8px 18px',
                              borderRadius: '8px',
                              border: currentOrder.size === size ? '2px solid #667eea' : '1px solid #ddd',
                              background: currentOrder.size === size ? '#667eea15' : 'white',
                              color: currentOrder.size === size ? '#667eea' : '#333',
                              fontWeight: currentOrder.size === size ? '700' : '400',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Selection */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Color *</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {colors.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setRegistrationData({
                              ...registrationData,
                              merchandiseOrder: { ...currentOrder, color }
                            })}
                            style={{
                              padding: '8px 18px',
                              borderRadius: '8px',
                              border: currentOrder.color === color ? '2px solid #667eea' : '1px solid #ddd',
                              background: currentOrder.color === color ? '#667eea15' : 'white',
                              color: currentOrder.color === color ? '#667eea' : '#333',
                              fontWeight: currentOrder.color === color ? '700' : '400',
                              cursor: 'pointer',
                              fontSize: '14px',
                            }}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quantity Selection */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Quantity</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setRegistrationData({
                            ...registrationData,
                            merchandiseOrder: { ...currentOrder, quantity: Math.max(1, (currentOrder.quantity || 1) - 1) }
                          })}
                          style={{
                            width: '36px', height: '36px', borderRadius: '8px',
                            border: '1px solid #ddd', background: '#f5f5f5',
                            cursor: 'pointer', fontSize: '18px', fontWeight: 'bold'
                          }}
                        >−</button>
                        <span style={{ fontSize: '18px', fontWeight: '600', minWidth: '30px', textAlign: 'center' }}>
                          {currentOrder.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setRegistrationData({
                            ...registrationData,
                            merchandiseOrder: { ...currentOrder, quantity: Math.min(maxQty, (currentOrder.quantity || 1) + 1) }
                          })}
                          style={{
                            width: '36px', height: '36px', borderRadius: '8px',
                            border: '1px solid #667eea', background: '#667eea',
                            color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold'
                          }}
                        >+</button>
                        <span style={{ fontSize: '13px', color: '#999' }}>(Max: {maxQty})</span>
                      </div>
                    </div>

                    {/* Selection Summary */}
                    {currentOrder.size && currentOrder.color && (
                      <div style={{
                        padding: '12px', background: '#e8f5e9', borderRadius: '8px',
                        border: '1px solid #4CAF50', marginBottom: '16px'
                      }}>
                        <strong>Selected:</strong> {currentOrder.size} / {currentOrder.color} × {currentOrder.quantity || 1}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setSelectedEvent(null);
                    setRegistrationData({});
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantDashboard;
