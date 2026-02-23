import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [availableEvents, setAvailableEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
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

      // Fetch available events (published, not past deadline)
      const eventsResponse = await api.get('/events', {
        params: {
          status: 'published',
          limit: 100
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter events that haven't passed registration deadline
      const now = new Date();
      const available = eventsResponse.data.events.filter(event => 
        new Date(event.registrationDeadline) > now
      );

      setAvailableEvents(available);

      // Fetch my registrations
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

      // Add custom form responses for normal events
      if (selectedEvent.eventType === 'normal' && selectedEvent.customRegistrationForm?.length > 0) {
        payload.formResponses = registrationData;
      }

      // Add merchandise order for merchandise events
      if (selectedEvent.eventType === 'merchandise') {
        payload.merchandiseOrder = registrationData.merchandiseOrder;
      }

      await api.post('/registrations', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Successfully registered for the event!');
      setShowRegisterModal(false);
      setSelectedEvent(null);
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register for event');
    }
  };

  const handleCancelRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/registrations/${registrationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Registration cancelled successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel registration');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Filter out events user is already registered for
  const registeredEventIds = myRegistrations.map(reg => reg.eventId?._id || reg.eventId);
  const eventsToShow = availableEvents.filter(event => !registeredEventIds.includes(event._id));

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Participant Dashboard</h2>
        <p>Welcome, {user?.firstName} {user?.lastName}!</p>
        <p>Email: {user?.email}</p>
        <p>Type: {user?.participantType === 'iiit' ? 'IIIT Student' : 'Non-IIIT Participant'}</p>
      </div>

      {error && <div className="error" style={{ marginBottom: '20px' }}>{error}</div>}
      {success && <div className="success" style={{ marginBottom: '20px' }}>{success}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>My Registrations ({myRegistrations.length})</h3>
        {myRegistrations.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Type</th>
                <th>Organizer</th>
                <th>Start Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myRegistrations.map((registration) => {
                const event = registration.eventId;
                return (
                  <tr key={registration._id}>
                    <td>{event?.eventName || 'N/A'}</td>
                    <td>{event?.eventType || 'N/A'}</td>
                    <td>{event?.organizerId?.organizerName || 'N/A'}</td>
                    <td>{event?.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{registration.status}</td>
                    <td>
                      {registration.status === 'confirmed' && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleCancelRegistration(registration._id)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ marginTop: '20px' }}>No events registered yet. Check available events below!</p>
        )}
      </div>

      <div className="card">
        <h3>Available Events ({eventsToShow.length})</h3>
        {eventsToShow.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Type</th>
                <th>Organizer</th>
                <th>Start Date</th>
                <th>Deadline</th>
                <th>Spots</th>
                <th>Fee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {eventsToShow.map((event) => (
                <tr key={event._id}>
                  <td>{event.eventName}</td>
                  <td>{event.eventType}</td>
                  <td>{event.organizerId?.organizerName || 'N/A'}</td>
                  <td>{new Date(event.eventStartDate).toLocaleDateString()}</td>
                  <td>{new Date(event.registrationDeadline).toLocaleDateString()}</td>
                  <td>{event.currentRegistrations}/{event.registrationLimit}</td>
                  <td>₹{event.registrationFee}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleRegisterClick(event)}
                      disabled={event.currentRegistrations >= event.registrationLimit}
                    >
                      {event.currentRegistrations >= event.registrationLimit ? 'Full' : 'Register'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ marginTop: '20px' }}>No events available at the moment.</p>
        )}
      </div>

      {/* Registration Modal */}
      {showRegisterModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Register for {selectedEvent.eventName}</h3>
            <p><strong>Organizer:</strong> {selectedEvent.organizerId?.organizerName}</p>
            <p><strong>Description:</strong> {selectedEvent.eventDescription}</p>
            <p><strong>Date:</strong> {new Date(selectedEvent.eventStartDate).toLocaleString()}</p>
            <p><strong>Fee:</strong> ₹{selectedEvent.registrationFee}</p>

            <form onSubmit={handleRegister}>
              {/* Normal Event - Custom Form */}
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

              {/* Merchandise Event - Variant Selection */}
              {selectedEvent.eventType === 'merchandise' && (
                <div>
                  <h4>Select Item</h4>
                  <p><strong>Item:</strong> {selectedEvent.merchandiseDetails?.itemName}</p>
                  <p><strong>Purchase Limit:</strong> {selectedEvent.merchandiseDetails?.purchaseLimitPerParticipant} per person</p>
                  
                  <div className="form-group">
                    <label>Size</label>
                    <select
                      required
                      onChange={(e) => setRegistrationData({
                        ...registrationData,
                        merchandiseOrder: {
                          ...registrationData.merchandiseOrder,
                          size: e.target.value
                        }
                      })}
                    >
                      <option value="">Select Size</option>
                      {[...new Set(selectedEvent.merchandiseDetails?.variants?.map(v => v.size))].map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Color</label>
                    <select
                      required
                      onChange={(e) => setRegistrationData({
                        ...registrationData,
                        merchandiseOrder: {
                          ...registrationData.merchandiseOrder,
                          color: e.target.value
                        }
                      })}
                    >
                      <option value="">Select Color</option>
                      {[...new Set(selectedEvent.merchandiseDetails?.variants?.map(v => v.color))].map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedEvent.merchandiseDetails?.purchaseLimitPerParticipant}
                      required
                      onChange={(e) => setRegistrationData({
                        ...registrationData,
                        merchandiseOrder: {
                          ...registrationData.merchandiseOrder,
                          quantity: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>
              )}

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
