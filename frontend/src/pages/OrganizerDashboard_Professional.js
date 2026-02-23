import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, STYLES, getStatusBadge } from '../constants/theme';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
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
    customRegistrationForm: [],
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
      
      const eventData = {
        ...newEvent,
        eventTags: newEvent.eventTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };

      if (newEvent.eventType === 'normal') {
        eventData.customRegistrationForm = newEvent.customRegistrationForm;
      } else if (newEvent.eventType === 'merchandise') {
        eventData.merchandiseDetails = newEvent.merchandiseDetails;
      }

      await api.post('/events', eventData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Event created successfully as draft!');
      setShowCreateModal(false);
      resetForm();
      fetchMyEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Check what can be edited based on status
      let updateData = {};
      
      if (editingEvent.status === 'draft') {
        // Draft: Can edit everything
        updateData = {
          ...editingEvent,
          eventTags: editingEvent.eventTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        };
      } else if (editingEvent.status === 'published') {
        // Published: Can only edit description, deadline, and limit
        updateData = {
          eventDescription: editingEvent.eventDescription,
          registrationDeadline: editingEvent.registrationDeadline,
          registrationLimit: editingEvent.registrationLimit,
        };
      } else {
        // Ongoing/Completed: No edits allowed
        setError('Cannot edit ongoing or completed events');
        return;
      }

      await api.put(`/events/${editingEvent._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Event updated successfully!');
      setShowEditModal(false);
      setEditingEvent(null);
      fetchMyEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event');
    }
  };

  const openEditModal = (event) => {
    setEditingEvent({
      ...event,
      eventTags: event.eventTags?.join(', ') || '',
      registrationDeadline: new Date(event.registrationDeadline).toISOString().slice(0, 16),
      eventStartDate: new Date(event.eventStartDate).toISOString().slice(0, 16),
      eventEndDate: new Date(event.eventEndDate).toISOString().slice(0, 16),
    });
    setShowEditModal(true);
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

  const closeRegistrations = async (eventId) => {
    if (!window.confirm('Are you sure you want to close registrations for this event?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.patch(`/events/${eventId}`, { status: 'closed' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Event registrations closed successfully!');
      fetchMyEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close registrations');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        color: COLORS.darkGray
      }}>
        Loading dashboard...
      </div>
    );
  }

  // Calculate statistics
  const draftEvents = events.filter(e => e.status === 'draft').length;
  const publishedEvents = events.filter(e => e.status === 'published').length;
  const ongoingEvents = events.filter(e => e.status === 'ongoing').length;
  const completedEvents = events.filter(e => e.status === 'completed');
  const totalRegistrations = events.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0);

  // Analytics for completed events
  const completedStats = {
    totalCompleted: completedEvents.length,
    totalRegistrations: completedEvents.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0),
    totalRevenue: completedEvents.reduce((sum, e) => sum + ((e.currentRegistrations || 0) * (e.registrationFee || 0)), 0),
    avgAttendance: completedEvents.length > 0 
      ? (completedEvents.reduce((sum, e) => sum + (e.attendance || 0), 0) / completedEvents.length).toFixed(1)
      : 0
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: COLORS.background,
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ ...STYLES.card, marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 8px 0', color: COLORS.dark, fontSize: '32px' }}>
            Organizer Dashboard
          </h2>
          <p style={{ margin: 0, color: COLORS.darkGray, fontSize: '16px' }}>
            {user?.organizerName || user?.name} • {user?.category || user?.organizationType}
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div style={{ 
            background: '#fef2f2',
            color: COLORS.accent,
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: `1px solid ${COLORS.accent}`,
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ 
            background: '#f0fdf4',
            color: COLORS.secondary,
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: `1px solid ${COLORS.secondary}`,
          }}>
            {success}
          </div>
        )}

        {/* Statistics Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            ...STYLES.card,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            color: COLORS.white
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Events</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{events.length}</div>
          </div>

          <div style={{ 
            ...STYLES.card,
            background: `linear-gradient(135deg, ${COLORS.draft}, ${COLORS.warning})`,
            color: COLORS.white
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Draft Events</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{draftEvents}</div>
          </div>

          <div style={{ 
            ...STYLES.card,
            background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.secondaryDark})`,
            color: COLORS.white
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Published</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{publishedEvents}</div>
          </div>

          <div style={{ 
            ...STYLES.card,
            background: `linear-gradient(135deg, ${COLORS.info}, ${COLORS.primary})`,
            color: COLORS.white
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Ongoing</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{ongoingEvents}</div>
          </div>

          <div style={{ 
            ...STYLES.card,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
            color: COLORS.white
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Registrations</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{totalRegistrations}</div>
          </div>
        </div>

        {/* Completed Events Analytics */}
        {completedStats.totalCompleted > 0 && (
          <div style={{ ...STYLES.card, marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: COLORS.dark, fontSize: '20px' }}>
              Completed Events Analytics
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '16px'
            }}>
              <div>
                <div style={{ color: COLORS.darkGray, fontSize: '14px', marginBottom: '4px' }}>Completed Events</div>
                <div style={{ color: COLORS.dark, fontSize: '28px', fontWeight: 'bold' }}>{completedStats.totalCompleted}</div>
              </div>
              <div>
                <div style={{ color: COLORS.darkGray, fontSize: '14px', marginBottom: '4px' }}>Total Participants</div>
                <div style={{ color: COLORS.dark, fontSize: '28px', fontWeight: 'bold' }}>{completedStats.totalRegistrations}</div>
              </div>
              <div>
                <div style={{ color: COLORS.darkGray, fontSize: '14px', marginBottom: '4px' }}>Total Revenue</div>
                <div style={{ color: COLORS.dark, fontSize: '28px', fontWeight: 'bold' }}>₹{completedStats.totalRevenue}</div>
              </div>
              <div>
                <div style={{ color: COLORS.darkGray, fontSize: '14px', marginBottom: '4px' }}>Avg Attendance</div>
                <div style={{ color: COLORS.dark, fontSize: '28px', fontWeight: 'bold' }}>{completedStats.avgAttendance}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Events Carousel/List */}
        <div style={{ ...STYLES.card }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: COLORS.dark, fontSize: '24px' }}>
              My Events ({events.length})
            </h3>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                ...STYLES.button,
                background: COLORS.primary,
                color: COLORS.white,
              }}
            >
              + Create New Event
            </button>
          </div>

          {events.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.lightGray}` }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Event Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Registrations</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Start Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event._id} style={{ borderBottom: `1px solid ${COLORS.veryLightGray}` }}>
                      <td style={{ padding: '12px' }}>
                        <Link 
                          to={`/organizer/event/${event._id}`}
                          style={{ color: COLORS.primary, textDecoration: 'none', fontWeight: '500' }}
                        >
                          {event.eventName}
                        </Link>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: event.eventType === 'normal' ? COLORS.info : COLORS.warning,
                          color: COLORS.white,
                          fontSize: '12px',
                          fontWeight: '500',
                        }}>
                          {event.eventType}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={getStatusBadge(event.status)}>{event.status}</span>
                      </td>
                      <td style={{ padding: '12px', color: COLORS.darkGray }}>
                        <span style={{ 
                          color: event.currentRegistrations >= event.registrationLimit * 0.8 ? COLORS.accent : COLORS.secondary,
                          fontWeight: '500'
                        }}>
                          {event.currentRegistrations}/{event.registrationLimit}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: COLORS.darkGray, fontSize: '14px' }}>
                        {new Date(event.eventStartDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {event.status === 'draft' && (
                            <>
                              <button
                                onClick={() => openEditModal(event)}
                                style={{
                                  ...STYLES.button,
                                  padding: '6px 12px',
                                  background: COLORS.info,
                                  color: COLORS.white,
                                  fontSize: '12px',
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => publishEvent(event._id)}
                                style={{
                                  ...STYLES.button,
                                  padding: '6px 12px',
                                  background: COLORS.secondary,
                                  color: COLORS.white,
                                  fontSize: '12px',
                                }}
                              >
                                Publish
                              </button>
                            </>
                          )}
                          {event.status === 'published' && (
                            <>
                              <button
                                onClick={() => openEditModal(event)}
                                style={{
                                  ...STYLES.button,
                                  padding: '6px 12px',
                                  background: COLORS.warning,
                                  color: COLORS.white,
                                  fontSize: '12px',
                                }}
                                title="Limited editing available"
                              >
                                Edit (Limited)
                              </button>
                              <button
                                onClick={() => closeRegistrations(event._id)}
                                style={{
                                  ...STYLES.button,
                                  padding: '6px 12px',
                                  background: COLORS.accent,
                                  color: COLORS.white,
                                  fontSize: '12px',
                                }}
                              >
                                Close Registrations
                              </button>
                            </>
                          )}
                          {event.currentRegistrations === 0 && event.status === 'draft' && (
                            <button
                              onClick={() => deleteEvent(event._id)}
                              style={{
                                ...STYLES.button,
                                padding: '6px 12px',
                                background: COLORS.accent,
                                color: COLORS.white,
                                fontSize: '12px',
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: COLORS.darkGray }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
              <h3 style={{ margin: '0 0 8px 0', color: COLORS.dark }}>No Events Yet</h3>
              <p style={{ margin: '0 0 24px 0' }}>Create your first event to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          overflowY: 'auto',
          padding: '20px'
        }}>
          <div style={{
            background: COLORS.white,
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          }}>
            <h3 style={{ margin: '0 0 24px 0', color: COLORS.dark, fontSize: '24px' }}>
              Create New Event
            </h3>
            <form onSubmit={handleCreateEvent}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                  Event Name *
                </label>
                <input
                  type="text"
                  value={newEvent.eventName}
                  onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
                  required
                  style={STYLES.input}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                  Event Description *
                </label>
                <textarea
                  value={newEvent.eventDescription}
                  onChange={(e) => setNewEvent({ ...newEvent, eventDescription: e.target.value })}
                  rows="3"
                  required
                  style={{ ...STYLES.input, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                    Event Type *
                  </label>
                  <select
                    value={newEvent.eventType}
                    onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                    required
                    style={STYLES.input}
                  >
                    <option value="normal">Normal Event</option>
                    <option value="merchandise">Merchandise</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                    Eligibility *
                  </label>
                  <select
                    value={newEvent.eligibility}
                    onChange={(e) => setNewEvent({ ...newEvent, eligibility: e.target.value })}
                    required
                    style={STYLES.input}
                  >
                    <option value="all">All Participants</option>
                    <option value="iiit_only">IIIT Students Only</option>
                    <option value="external_only">External Only</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                    Registration Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.registrationDeadline}
                    onChange={(e) => setNewEvent({ ...newEvent, registrationDeadline: e.target.value })}
                    required
                    style={STYLES.input}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                    Registration Limit *
                  </label>
                  <input
                    type="number"
                    value={newEvent.registrationLimit}
                    onChange={(e) => setNewEvent({ ...newEvent, registrationLimit: parseInt(e.target.value) })}
                    min="1"
                    required
                    style={STYLES.input}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                    Event Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.eventStartDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventStartDate: e.target.value })}
                    required
                    style={STYLES.input}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                    Event End Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.eventEndDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventEndDate: e.target.value })}
                    required
                    style={STYLES.input}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                    Registration Fee (₹) *
                  </label>
                  <input
                    type="number"
                    value={newEvent.registrationFee}
                    onChange={(e) => setNewEvent({ ...newEvent, registrationFee: parseInt(e.target.value) })}
                    min="0"
                    required
                    style={STYLES.input}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                    Venue Type *
                  </label>
                  <select
                    value={newEvent.venueType}
                    onChange={(e) => setNewEvent({ ...newEvent, venueType: e.target.value })}
                    style={STYLES.input}
                  >
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                    Venue
                  </label>
                  <input
                    type="text"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                    placeholder="e.g., Hall 1"
                    style={STYLES.input}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                  Event Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newEvent.eventTags}
                  onChange={(e) => setNewEvent({ ...newEvent, eventTags: e.target.value })}
                  placeholder="e.g., technology, workshop, beginner"
                  style={STYLES.input}
                />
              </div>

              {/* Form Builder and Merchandise sections remain the same as original */}
              {newEvent.eventType === 'normal' && (
                <div style={{ border: `1px solid ${COLORS.lightGray}`, padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: COLORS.dark }}>Custom Registration Form (Optional)</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Field Name (e.g., github_username)"
                      value={formField.fieldName}
                      onChange={(e) => setFormField({ ...formField, fieldName: e.target.value })}
                      style={{ ...STYLES.input, marginBottom: '8px' }}
                    />
                    <input
                      type="text"
                      placeholder="Field Label (e.g., GitHub Username)"
                      value={formField.fieldLabel}
                      onChange={(e) => setFormField({ ...formField, fieldLabel: e.target.value })}
                      style={{ ...STYLES.input, marginBottom: '8px' }}
                    />
                    <select
                      value={formField.fieldType}
                      onChange={(e) => setFormField({ ...formField, fieldType: e.target.value })}
                      style={{ ...STYLES.input, marginBottom: '8px' }}
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="number">Number</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select</option>
                      <option value="radio">Radio</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                    {['select', 'radio', 'checkbox'].includes(formField.fieldType) && (
                      <input
                        type="text"
                        placeholder="Options (comma-separated)"
                        value={formField.options}
                        onChange={(e) => setFormField({ ...formField, options: e.target.value })}
                        style={{ ...STYLES.input, marginBottom: '8px' }}
                      />
                    )}
                    <label style={{ display: 'block', marginBottom: '8px', color: COLORS.darkGray }}>
                      <input
                        type="checkbox"
                        checked={formField.required}
                        onChange={(e) => setFormField({ ...formField, required: e.target.checked })}
                      />
                      {' '}Required Field
                    </label>
                    <button 
                      type="button" 
                      onClick={addFormField}
                      style={{
                        ...STYLES.button,
                        background: COLORS.secondary,
                        color: COLORS.white,
                      }}
                    >
                      Add Field
                    </button>
                  </div>
                  {newEvent.customRegistrationForm.length > 0 && (
                    <div>
                      <strong style={{ color: COLORS.dark }}>Added Fields:</strong>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        {newEvent.customRegistrationForm.map((field, index) => (
                          <li key={index} style={{ color: COLORS.darkGray, fontSize: '14px' }}>
                            {field.fieldLabel} ({field.fieldType}) {field.required && '- Required'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {newEvent.eventType === 'merchandise' && (
                <div style={{ border: `1px solid ${COLORS.lightGray}`, padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: COLORS.dark }}>Merchandise Details</h4>
                  <input
                    type="text"
                    placeholder="Item Name *"
                    value={newEvent.merchandiseDetails.itemName}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      merchandiseDetails: { ...newEvent.merchandiseDetails, itemName: e.target.value }
                    })}
                    required
                    style={{ ...STYLES.input, marginBottom: '8px' }}
                  />
                  <input
                    type="number"
                    placeholder="Purchase Limit Per Participant *"
                    value={newEvent.merchandiseDetails.purchaseLimitPerParticipant}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      merchandiseDetails: { ...newEvent.merchandiseDetails, purchaseLimitPerParticipant: parseInt(e.target.value) }
                    })}
                    min="1"
                    required
                    style={{ ...STYLES.input, marginBottom: '12px' }}
                  />
                  
                  <div style={{ border: `1px solid ${COLORS.veryLightGray}`, padding: '12px', borderRadius: '4px' }}>
                    <strong style={{ display: 'block', marginBottom: '8px', color: COLORS.dark }}>Add Variants</strong>
                    <select
                      value={variantField.size}
                      onChange={(e) => setVariantField({ ...variantField, size: e.target.value })}
                      style={{ ...STYLES.input, marginBottom: '8px' }}
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
                      placeholder="Color *"
                      value={variantField.color}
                      onChange={(e) => setVariantField({ ...variantField, color: e.target.value })}
                      style={{ ...STYLES.input, marginBottom: '8px' }}
                    />
                    <input
                      type="number"
                      placeholder="Stock Quantity *"
                      value={variantField.stockQuantity}
                      onChange={(e) => setVariantField({ ...variantField, stockQuantity: parseInt(e.target.value) })}
                      min="0"
                      style={{ ...STYLES.input, marginBottom: '8px' }}
                    />
                    <input
                      type="number"
                      placeholder="Price (₹) *"
                      value={variantField.price}
                      onChange={(e) => setVariantField({ ...variantField, price: parseInt(e.target.value) })}
                      min="0"
                      style={{ ...STYLES.input, marginBottom: '8px' }}
                    />
                    <button 
                      type="button" 
                      onClick={addVariant}
                      style={{
                        ...STYLES.button,
                        background: COLORS.secondary,
                        color: COLORS.white,
                      }}
                    >
                      Add Variant
                    </button>

                    {newEvent.merchandiseDetails.variants.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong style={{ color: COLORS.dark }}>Added Variants:</strong>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                          {newEvent.merchandiseDetails.variants.map((variant, index) => (
                            <li key={index} style={{ color: COLORS.darkGray, fontSize: '14px' }}>
                              {variant.size} - {variant.color} - Stock: {variant.stockQuantity} - ₹{variant.price}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  style={{
                    ...STYLES.button,
                    background: COLORS.lightGray,
                    color: COLORS.darkGray,
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    ...STYLES.button,
                    background: COLORS.primary,
                    color: COLORS.white,
                  }}
                >
                  Create Event (Draft)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          overflowY: 'auto',
          padding: '20px'
        }}>
          <div style={{
            background: COLORS.white,
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: COLORS.dark, fontSize: '24px' }}>
              Edit Event
            </h3>
            
            {editingEvent.status === 'published' && (
              <div style={{
                background: '#fffbeb',
                border: `1px solid ${COLORS.warning}`,
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
              }}>
                <strong style={{ color: COLORS.warning }}>Limited Editing:</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: COLORS.darkGray }}>
                  Only description, registration deadline, and participant limit can be edited for published events.
                </p>
              </div>
            )}

            {(editingEvent.status === 'ongoing' || editingEvent.status === 'completed') && (
              <div style={{
                background: '#fef2f2',
                border: `1px solid ${COLORS.accent}`,
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
              }}>
                <strong style={{ color: COLORS.accent }}>No Editing Allowed:</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: COLORS.darkGray }}>
                  {editingEvent.status.charAt(0).toUpperCase() + editingEvent.status.slice(1)} events cannot be edited.
                </p>
              </div>
            )}

            <form onSubmit={handleEditEvent}>
              {editingEvent.status === 'draft' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                      Event Name *
                    </label>
                    <input
                      type="text"
                      value={editingEvent.eventName}
                      onChange={(e) => setEditingEvent({ ...editingEvent, eventName: e.target.value })}
                      required
                      style={STYLES.input}
                    />
                  </div>
                </>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                  Event Description *
                </label>
                <textarea
                  value={editingEvent.eventDescription}
                  onChange={(e) => setEditingEvent({ ...editingEvent, eventDescription: e.target.value })}
                  rows="4"
                  required
                  disabled={editingEvent.status === 'ongoing' || editingEvent.status === 'completed'}
                  style={{ ...STYLES.input, resize: 'vertical' }}
                />
              </div>

              {editingEvent.status === 'draft' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                      Event Type *
                    </label>
                    <select
                      value={editingEvent.eventType}
                      onChange={(e) => setEditingEvent({ ...editingEvent, eventType: e.target.value })}
                      required
                      style={STYLES.input}
                    >
                      <option value="normal">Normal Event</option>
                      <option value="merchandise">Merchandise</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                      Eligibility *
                    </label>
                    <select
                      value={editingEvent.eligibility}
                      onChange={(e) => setEditingEvent({ ...editingEvent, eligibility: e.target.value })}
                      required
                      style={STYLES.input}
                    >
                      <option value="all">All Participants</option>
                      <option value="iiit_only">IIIT Students Only</option>
                      <option value="external_only">External Only</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                  Registration Deadline *
                </label>
                <input
                  type="datetime-local"
                  value={editingEvent.registrationDeadline}
                  onChange={(e) => setEditingEvent({ ...editingEvent, registrationDeadline: e.target.value })}
                  required
                  disabled={editingEvent.status === 'ongoing' || editingEvent.status === 'completed'}
                  style={STYLES.input}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                  Registration Limit *
                </label>
                <input
                  type="number"
                  value={editingEvent.registrationLimit}
                  onChange={(e) => setEditingEvent({ ...editingEvent, registrationLimit: parseInt(e.target.value) })}
                  min={editingEvent.currentRegistrations || 1}
                  required
                  disabled={editingEvent.status === 'ongoing' || editingEvent.status === 'completed'}
                  style={STYLES.input}
                />
                {editingEvent.currentRegistrations > 0 && (
                  <small style={{ color: COLORS.darkGray, fontSize: '12px' }}>
                    Minimum: {editingEvent.currentRegistrations} (current registrations)
                  </small>
                )}
              </div>

              {editingEvent.status === 'draft' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                      Event Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={editingEvent.eventStartDate}
                      onChange={(e) => setEditingEvent({ ...editingEvent, eventStartDate: e.target.value })}
                      required
                      style={STYLES.input}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                      Event End Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={editingEvent.eventEndDate}
                      onChange={(e) => setEditingEvent({ ...editingEvent, eventEndDate: e.target.value })}
                      required
                      style={STYLES.input}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                      Registration Fee (₹) *
                    </label>
                    <input
                      type="number"
                      value={editingEvent.registrationFee}
                      onChange={(e) => setEditingEvent({ ...editingEvent, registrationFee: parseInt(e.target.value) })}
                      min="0"
                      required
                      style={STYLES.input}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                      Venue
                    </label>
                    <input
                      type="text"
                      value={editingEvent.venue}
                      onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                      style={STYLES.input}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500' }}>
                      Event Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editingEvent.eventTags}
                      onChange={(e) => setEditingEvent({ ...editingEvent, eventTags: e.target.value })}
                      style={STYLES.input}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEvent(null);
                  }}
                  style={{
                    ...STYLES.button,
                    background: COLORS.lightGray,
                    color: COLORS.darkGray,
                  }}
                >
                  Cancel
                </button>
                {editingEvent.status !== 'ongoing' && editingEvent.status !== 'completed' && (
                  <button 
                    type="submit"
                    style={{
                      ...STYLES.button,
                      background: COLORS.primary,
                      color: COLORS.white,
                    }}
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
