import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [newEvent, setNewEvent] = useState({
    eventName: '',
    eventDescription: '',
    eventType: 'normal',
    eligibility: 'all',
    registrationDeadline: '',
    eventStartDate: '',
    eventEndDate: '',
    registrationLimit: 50,
    registrationFee: 0,
    eventTags: '',
    venue: '',
    venueType: 'offline',
    // For normal events
    customRegistrationForm: [],
    // For merchandise events
    merchandiseDetails: {
      itemName: '',
      variants: [],
      purchaseLimitPerParticipant: 1
    }
  });

  const [formField, setFormField] = useState({
    fieldName: '',
    fieldType: 'text',
    fieldLabel: '',
    required: false,
    options: ''
  });

  const [variantField, setVariantField] = useState({
    size: 'M',
    color: '',
    stockQuantity: 0,
    price: 0
  });

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get(`/events/organizer/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data.events || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Prepare event data
      const eventData = {
        ...newEvent,
        eventTags: newEvent.eventTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };

      // Add type-specific data
      if (newEvent.eventType === 'normal') {
        eventData.customRegistrationForm = newEvent.customRegistrationForm;
      } else if (newEvent.eventType === 'merchandise') {
        eventData.merchandiseDetails = newEvent.merchandiseDetails;
      }

      await api.post('/events', eventData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Event created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchMyEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    }
  };

  const resetForm = () => {
    setNewEvent({
      eventName: '',
      eventDescription: '',
      eventType: 'normal',
      eligibility: 'all',
      registrationDeadline: '',
      eventStartDate: '',
      eventEndDate: '',
      registrationLimit: 50,
      registrationFee: 0,
      eventTags: '',
      venue: '',
      venueType: 'offline',
      customRegistrationForm: [],
      merchandiseDetails: {
        itemName: '',
        variants: [],
        purchaseLimitPerParticipant: 1
      }
    });
  };

  const addFormField = () => {
    if (!formField.fieldName || !formField.fieldLabel) {
      alert('Please fill field name and label');
      return;
    }

    const field = {
      fieldName: formField.fieldName,
      fieldType: formField.fieldType,
      fieldLabel: formField.fieldLabel,
      required: formField.required,
      order: newEvent.customRegistrationForm.length + 1
    };

    if (['select', 'radio', 'checkbox'].includes(formField.fieldType)) {
      field.options = formField.options.split(',').map(opt => opt.trim());
    }

    setNewEvent({
      ...newEvent,
      customRegistrationForm: [...newEvent.customRegistrationForm, field]
    });

    setFormField({
      fieldName: '',
      fieldType: 'text',
      fieldLabel: '',
      required: false,
      options: ''
    });
  };

  const addVariant = () => {
    if (!variantField.color || variantField.stockQuantity <= 0 || variantField.price <= 0) {
      alert('Please fill all variant fields');
      return;
    }

    setNewEvent({
      ...newEvent,
      merchandiseDetails: {
        ...newEvent.merchandiseDetails,
        variants: [...newEvent.merchandiseDetails.variants, variantField]
      }
    });

    setVariantField({
      size: 'M',
      color: '',
      stockQuantity: 0,
      price: 0
    });
  };

  const publishEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/events/${eventId}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Event published successfully!');
      fetchMyEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish event');
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Event deleted successfully!');
      fetchMyEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Calculate statistics
  const draftEvents = events.filter(e => e.status === 'draft').length;
  const publishedEvents = events.filter(e => e.status === 'published').length;
  const totalRegistrations = events.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0);

  return (
    <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', minHeight: '100vh', padding: '20px' }}>
      {/* Header Section with Stats */}
      <div style={{ 
        background: 'white', 
        borderRadius: '15px', 
        padding: '30px', 
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#f5576c', fontSize: '32px' }}>
          🎪 {user?.organizerName || user?.name}'s Dashboard
        </h2>
        <p style={{ margin: '5px 0', color: '#666', fontSize: '16px' }}>
          📂 Category: {user?.category || user?.organizationType} | 
          ✉️ {user?.contactEmail || user?.email}
        </p>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            padding: '15px 25px', 
            borderRadius: '10px',
            color: 'white',
            flex: 1,
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{events.length}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Events</div>
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
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{publishedEvents}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Published</div>
          </div>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            padding: '15px 25px', 
            borderRadius: '10px',
            color: 'white',
            flex: 1,
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{totalRegistrations}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Registrations</div>
          </div>
          <div style={{ 
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', 
            padding: '15px 25px', 
            borderRadius: '10px',
            color: '#8b4513',
            flex: 1,
            minWidth: '150px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{draftEvents}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Drafts</div>
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
          ✅ {success}
        </div>
      )}

      {/* Events Section */}
      <div style={{ 
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#f5576c', fontSize: '24px' }}>
            🎯 My Events ({events.length})
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none',
              borderRadius: '25px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '15px',
              boxShadow: '0 4px 15px rgba(245, 87, 108, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ➕ Create New Event
          </button>
        </div>

        {events.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '15px', textAlign: 'left', borderRadius: '10px 0 0 10px' }}>Event Name</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Registrations</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Start Date</th>
                  <th style={{ padding: '15px', textAlign: 'left', borderRadius: '0 10px 10px 0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const statusColors = {
                    'draft': '#ff9800',
                    'published': '#4CAF50',
                    'ongoing': '#2196F3',
                    'completed': '#9e9e9e',
                    'cancelled': '#f44336'
                  };
                  
                  return (
                    <tr key={event._id} style={{ 
                      background: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s'
                    }}>
                      <td style={{ padding: '15px', borderRadius: '10px 0 0 10px', fontWeight: 'bold', color: '#333' }}>
                        {event.eventName}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          background: event.eventType === 'normal' ? '#e3f2fd' : '#fff3e0',
                          color: event.eventType === 'normal' ? '#1976d2' : '#f57c00',
                          fontSize: '13px',
                          fontWeight: 'bold'
                        }}>
                          {event.eventType === 'normal' ? '🎯 Normal' : '🛍️ Merch'}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          background: statusColors[event.status] || '#9e9e9e',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {event.status}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ 
                          color: event.currentRegistrations >= event.registrationLimit * 0.8 ? '#f44336' : '#4CAF50',
                          fontWeight: 'bold'
                        }}>
                          {event.currentRegistrations}/{event.registrationLimit}
                        </span>
                      </td>
                      <td style={{ padding: '15px', color: '#666' }}>
                        {new Date(event.eventStartDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td style={{ padding: '15px', borderRadius: '0 10px 10px 0' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {event.status === 'draft' && (
                            <button
                              onClick={() => publishEvent(event._id)}
                              style={{
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                border: 'none',
                                borderRadius: '15px',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '12px'
                              }}
                            >
                              📢 Publish
                            </button>
                          )}
                          {event.currentRegistrations === 0 && (
                            <button
                              onClick={() => deleteEvent(event._id)}
                              style={{
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                border: 'none',
                                borderRadius: '15px',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '12px'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
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
            color: '#999'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎪</div>
            <p style={{ fontSize: '18px' }}>No events created yet. Click "Create New Event" to get started!</p>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Create New Event</h3>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Event Name</label>
                <input
                  type="text"
                  value={newEvent.eventName}
                  onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Event Description</label>
                <textarea
                  value={newEvent.eventDescription}
                  onChange={(e) => setNewEvent({ ...newEvent, eventDescription: e.target.value })}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label>Event Type</label>
                <select
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                  required
                >
                  <option value="normal">Normal Event (Workshop, Talk, Competition)</option>
                  <option value="merchandise">Merchandise (T-shirt, Hoodie, etc.)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Eligibility</label>
                <select
                  value={newEvent.eligibility}
                  onChange={(e) => setNewEvent({ ...newEvent, eligibility: e.target.value })}
                  required
                >
                  <option value="all">All Participants</option>
                  <option value="iiit_only">IIIT Students Only</option>
                  <option value="external_only">External Participants Only</option>
                </select>
              </div>

              <div className="form-group">
                <label>Registration Deadline</label>
                <input
                  type="datetime-local"
                  value={newEvent.registrationDeadline}
                  onChange={(e) => setNewEvent({ ...newEvent, registrationDeadline: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Event Start Date</label>
                <input
                  type="datetime-local"
                  value={newEvent.eventStartDate}
                  onChange={(e) => setNewEvent({ ...newEvent, eventStartDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Event End Date</label>
                <input
                  type="datetime-local"
                  value={newEvent.eventEndDate}
                  onChange={(e) => setNewEvent({ ...newEvent, eventEndDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Registration Limit</label>
                <input
                  type="number"
                  value={newEvent.registrationLimit}
                  onChange={(e) => setNewEvent({ ...newEvent, registrationLimit: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Registration Fee (₹)</label>
                <input
                  type="number"
                  value={newEvent.registrationFee}
                  onChange={(e) => setNewEvent({ ...newEvent, registrationFee: parseInt(e.target.value) })}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Event Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newEvent.eventTags}
                  onChange={(e) => setNewEvent({ ...newEvent, eventTags: e.target.value })}
                  placeholder="e.g., technology, workshop, beginner"
                />
              </div>

              <div className="form-group">
                <label>Venue</label>
                <input
                  type="text"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                  placeholder="e.g., Lecture Hall 1"
                />
              </div>

              <div className="form-group">
                <label>Venue Type</label>
                <select
                  value={newEvent.venueType}
                  onChange={(e) => setNewEvent({ ...newEvent, venueType: e.target.value })}
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              {/* Normal Event - Custom Form Builder */}
              {newEvent.eventType === 'normal' && (
                <div className="form-group">
                  <label><strong>Custom Registration Form</strong></label>
                  <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px', marginTop: '10px' }}>
                    <h4>Add Form Fields</h4>
                    <input
                      type="text"
                      placeholder="Field Name (e.g., github_username)"
                      value={formField.fieldName}
                      onChange={(e) => setFormField({ ...formField, fieldName: e.target.value })}
                      style={{ marginBottom: '10px' }}
                    />
                    <input
                      type="text"
                      placeholder="Field Label (e.g., GitHub Username)"
                      value={formField.fieldLabel}
                      onChange={(e) => setFormField({ ...formField, fieldLabel: e.target.value })}
                      style={{ marginBottom: '10px' }}
                    />
                    <select
                      value={formField.fieldType}
                      onChange={(e) => setFormField({ ...formField, fieldType: e.target.value })}
                      style={{ marginBottom: '10px' }}
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="number">Number</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select Dropdown</option>
                      <option value="radio">Radio Buttons</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                    {['select', 'radio', 'checkbox'].includes(formField.fieldType) && (
                      <input
                        type="text"
                        placeholder="Options (comma-separated, e.g., Option1,Option2)"
                        value={formField.options}
                        onChange={(e) => setFormField({ ...formField, options: e.target.value })}
                        style={{ marginBottom: '10px' }}
                      />
                    )}
                    <label style={{ display: 'block', marginBottom: '10px' }}>
                      <input
                        type="checkbox"
                        checked={formField.required}
                        onChange={(e) => setFormField({ ...formField, required: e.target.checked })}
                      />
                      {' '}Required Field
                    </label>
                    <button type="button" className="btn btn-secondary" onClick={addFormField}>
                      Add Field
                    </button>
                    
                    {newEvent.customRegistrationForm.length > 0 && (
                      <div style={{ marginTop: '15px' }}>
                        <strong>Added Fields:</strong>
                        <ul>
                          {newEvent.customRegistrationForm.map((field, index) => (
                            <li key={index}>
                              {field.fieldLabel} ({field.fieldType}) {field.required && '- Required'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Merchandise Event - Variants */}
              {newEvent.eventType === 'merchandise' && (
                <div className="form-group">
                  <label><strong>Merchandise Details</strong></label>
                  
                  <input
                    type="text"
                    placeholder="Item Name (e.g., Felicity 2026 T-Shirt)"
                    value={newEvent.merchandiseDetails.itemName}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      merchandiseDetails: { ...newEvent.merchandiseDetails, itemName: e.target.value }
                    })}
                    style={{ marginBottom: '10px' }}
                    required
                  />

                  <input
                    type="number"
                    placeholder="Purchase Limit Per Participant"
                    value={newEvent.merchandiseDetails.purchaseLimitPerParticipant}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      merchandiseDetails: { ...newEvent.merchandiseDetails, purchaseLimitPerParticipant: parseInt(e.target.value) }
                    })}
                    min="1"
                    style={{ marginBottom: '10px' }}
                    required
                  />

                  <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px', marginTop: '10px' }}>
                    <h4>Add Variants</h4>
                    <select
                      value={variantField.size}
                      onChange={(e) => setVariantField({ ...variantField, size: e.target.value })}
                      style={{ marginBottom: '10px' }}
                    >
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Color (e.g., Black, White)"
                      value={variantField.color}
                      onChange={(e) => setVariantField({ ...variantField, color: e.target.value })}
                      style={{ marginBottom: '10px' }}
                    />
                    <input
                      type="number"
                      placeholder="Stock Quantity"
                      value={variantField.stockQuantity}
                      onChange={(e) => setVariantField({ ...variantField, stockQuantity: parseInt(e.target.value) })}
                      min="0"
                      style={{ marginBottom: '10px' }}
                    />
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      value={variantField.price}
                      onChange={(e) => setVariantField({ ...variantField, price: parseInt(e.target.value) })}
                      min="0"
                      style={{ marginBottom: '10px' }}
                    />
                    <button type="button" className="btn btn-secondary" onClick={addVariant}>
                      Add Variant
                    </button>

                    {newEvent.merchandiseDetails.variants.length > 0 && (
                      <div style={{ marginTop: '15px' }}>
                        <strong>Added Variants:</strong>
                        <ul>
                          {newEvent.merchandiseDetails.variants.map((variant, index) => (
                            <li key={index}>
                              {variant.size} - {variant.color} - Stock: {variant.stockQuantity} - ₹{variant.price}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
