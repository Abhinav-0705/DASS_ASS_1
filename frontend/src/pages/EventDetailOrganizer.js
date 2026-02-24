import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { COLORS, STYLES, getStatusBadge } from '../constants/theme';
import DiscussionForum from '../components/DiscussionForum';
import FeedbackList from '../components/FeedbackList';

const EventDetailOrganizer = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  useEffect(() => {
    fetchEventDetails();
    fetchRegistrations();
  }, [eventId]);

  // Auto-clear success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchEventDetails = async () => {
    try {
      setError(''); // Clear any previous errors
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data.event);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError(err.response?.data?.message || 'Failed to fetch event details');
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      setError(''); // Clear any previous errors
      console.log('Fetching registrations for event:', eventId);
      const response = await api.get(`/events/${eventId}/registrations`);
      console.log('Registrations response:', response.data);
      setRegistrations(response.data.registrations || []);
    } catch (err) {
      console.error('Failed to fetch registrations', err);
      console.error('Error response:', err.response?.data);
      // Don't set error for registrations - just log it
      // setError(err.response?.data?.message || 'Failed to fetch registrations');
    }
  };

  const handleMarkAttendance = async (registrationId) => {
    try {
      await api.patch(`/registrations/${registrationId}/checkin`);
      setSuccess('Attendance marked successfully');
      fetchRegistrations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Registration Date', 'Status', 'Payment Status', 'Ticket ID', 'Attendance'];
    const rows = filteredRegistrations.map(reg => [
      `${reg.participantId?.firstName || ''} ${reg.participantId?.lastName || ''}`,
      reg.participantId?.email || '',
      new Date(reg.createdAt).toLocaleDateString(),
      reg.status,
      reg.paymentStatus || 'N/A',
      reg.ticketId || 'N/A',
      reg.checkedIn ? 'Present' : 'Absent',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.eventName}_registrations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccess('CSV exported successfully');
  };

  // Calculate analytics
  const analytics = {
    totalRegistrations: registrations.length,
    confirmedRegistrations: registrations.filter(r => r.status === 'confirmed').length,
    cancelledRegistrations: registrations.filter(r => r.status === 'cancelled').length,
    attendance: registrations.filter(r => r.checkedIn).length,
    attendanceRate: registrations.length > 0
      ? ((registrations.filter(r => r.checkedIn).length / registrations.filter(r => r.status === 'confirmed').length) * 100).toFixed(1)
      : 0,
    revenue: registrations
      .filter(r => r.status === 'confirmed')
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0),
  };

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch =
      (reg.participantId?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (reg.participantId?.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (reg.participantId?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || reg.status === filterStatus;
    const matchesPayment = filterPayment === 'all' || reg.paymentStatus === filterPayment;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        color: COLORS.darkGray
      }}>
        Loading event details...
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{
        minHeight: '100vh',
        background: COLORS.background,
        padding: '24px'
      }}>
        <div style={{ ...STYLES.card, textAlign: 'center' }}>
          <h2 style={{ color: COLORS.dark }}>Event not found</h2>
          <button
            onClick={() => navigate('/organizer/dashboard')}
            style={{
              ...STYLES.button,
              background: COLORS.primary,
              color: COLORS.white,
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.background,
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Back Button and Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            onClick={() => navigate('/organizer/dashboard')}
            style={{
              ...STYLES.button,
              background: COLORS.lightGray,
              color: COLORS.darkGray,
            }}
          >
            ← Back to Dashboard
          </button>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(`/organizer/event/${eventId}/qr-scanner`)}
              style={{
                ...STYLES.button,
                background: COLORS.info,
              }}
            >
              📱 QR Scanner
            </button>
            {event?.eventType === 'merchandise' && (
              <button
                onClick={() => navigate(`/organizer/event/${eventId}/payment-approvals`)}
                style={{
                  ...STYLES.button,
                  background: COLORS.warning,
                }}
              >
                💳 Payment Approvals
              </button>
            )}
            <button
              onClick={() => navigate(`/organizer/event/${eventId}/feedback`)}
              style={{
                ...STYLES.button,
                background: COLORS.secondary,
              }}
            >
              📊 View Feedback
            </button>
          </div>
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.accent,
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0 8px',
                fontWeight: 'bold',
              }}
            >
              ×
            </button>
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

        {/* Event Overview */}
        <div style={{ ...STYLES.card, marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 12px 0', color: COLORS.dark, fontSize: '32px' }}>
                {event.eventName}
              </h2>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span style={getStatusBadge(event.status)}>{event.status}</span>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  background: event.eventType === 'normal' ? COLORS.info : COLORS.warning,
                  color: COLORS.white,
                  fontSize: '12px',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                }}>
                  {event.eventType}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ color: COLORS.darkGray, fontSize: '14px', marginBottom: '4px' }}>Start Date</div>
              <div style={{ color: COLORS.dark, fontWeight: '500' }}>
                {new Date(event.eventStartDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            <div>
              <div style={{ color: COLORS.darkGray, fontSize: '14px', marginBottom: '4px' }}>End Date</div>
              <div style={{ color: COLORS.dark, fontWeight: '500' }}>
                {new Date(event.eventEndDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            <div>
              <div style={{ color: COLORS.darkGray, fontSize: '14px', marginBottom: '4px' }}>Registration Deadline</div>
              <div style={{ color: COLORS.dark, fontWeight: '500' }}>
                {new Date(event.registrationDeadline).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
            <div>
              <div style={{ color: COLORS.darkGray, fontSize: '14px', marginBottom: '4px' }}>Eligibility</div>
              <div style={{ color: COLORS.dark, fontWeight: '500', textTransform: 'capitalize' }}>
                {event.eligibility}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: COLORS.darkGray, fontSize: '14px', marginBottom: '4px' }}>Description</div>
            <div style={{ color: COLORS.dark }}>{event.eventDescription}</div>
          </div>

          {event.eventType === 'normal' && (
            <div>
              <div style={{ color: COLORS.darkGray, fontSize: '14px', marginBottom: '4px' }}>Registration Fee</div>
              <div style={{ color: COLORS.dark, fontWeight: '500', fontSize: '18px' }}>
                ₹{event.registrationFee || 0}
              </div>
            </div>
          )}
        </div>

        {/* Analytics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            ...STYLES.card,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            color: COLORS.white
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Registrations</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{analytics.totalRegistrations}</div>
          </div>

          <div style={{
            ...STYLES.card,
            background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.secondaryDark})`,
            color: COLORS.white
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Confirmed</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{analytics.confirmedRegistrations}</div>
          </div>

          <div style={{
            ...STYLES.card,
            background: `linear-gradient(135deg, ${COLORS.info}, ${COLORS.primary})`,
            color: COLORS.white
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Attendance</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{analytics.attendance}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>{analytics.attendanceRate}% of confirmed</div>
          </div>

          {event.eventType === 'normal' && (
            <div style={{
              ...STYLES.card,
              background: `linear-gradient(135deg, ${COLORS.warning}, ${COLORS.merchandise})`,
              color: COLORS.white
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Revenue</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>₹{analytics.revenue}</div>
            </div>
          )}

          <div style={{
            ...STYLES.card,
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
            color: COLORS.white
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Cancelled</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{analytics.cancelledRegistrations}</div>
          </div>
        </div>

        {/* Participants Section */}
        <div style={{ ...STYLES.card }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: COLORS.dark, fontSize: '24px' }}>
              Participants ({filteredRegistrations.length})
            </h3>
            <button
              onClick={handleExportCSV}
              disabled={registrations.length === 0}
              style={{
                ...STYLES.button,
                background: registrations.length > 0 ? COLORS.secondary : COLORS.lightGray,
                color: COLORS.white,
                cursor: registrations.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={STYLES.input}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={STYLES.input}
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {event.eventType === 'normal' && (
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                style={STYLES.input}
              >
                <option value="all">All Payment Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            )}
          </div>

          {/* Participants Table */}
          {filteredRegistrations.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.lightGray}` }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Reg Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Ticket ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Attendance</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg._id} style={{ borderBottom: `1px solid ${COLORS.veryLightGray}` }}>
                      <td style={{ padding: '12px', color: COLORS.dark }}>
                        {reg.participantId?.firstName} {reg.participantId?.lastName}
                      </td>
                      <td style={{ padding: '12px', color: COLORS.darkGray, fontSize: '14px' }}>
                        {reg.participantId?.email}
                      </td>
                      <td style={{ padding: '12px', color: COLORS.darkGray, fontSize: '14px' }}>
                        {new Date(reg.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={getStatusBadge(reg.status)}>{reg.status}</span>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px', color: COLORS.primary }}>
                        {reg.ticketId || 'N/A'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: reg.checkedIn ? COLORS.secondary : COLORS.veryLightGray,
                          color: reg.checkedIn ? COLORS.white : COLORS.darkGray,
                          fontSize: '12px',
                          fontWeight: '500',
                        }}>
                          {reg.checkedIn ? '✓ Present' : 'Absent'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {reg.status === 'confirmed' && !reg.checkedIn && (
                          <button
                            onClick={() => handleMarkAttendance(reg._id)}
                            style={{
                              ...STYLES.button,
                              padding: '6px 12px',
                              background: COLORS.primary,
                              color: COLORS.white,
                              fontSize: '12px',
                            }}
                          >
                            Mark Present
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: COLORS.darkGray }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
              {registrations.length === 0 ? (
                <>
                  <p style={{ fontSize: '18px', fontWeight: '500', color: COLORS.dark }}>No participants registered yet</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>
                    When participants register for this event, they will appear here.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '18px', fontWeight: '500', color: COLORS.dark }}>No participants match your filters</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>
                    Try adjusting your search or filter criteria. Total registrations: {registrations.length}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Discussion Forum Section */}
        <div style={{ marginTop: '30px' }}>
          <div style={{ ...STYLES.card, marginBottom: '8px' }}>
            <h2 style={{ margin: '0 0 8px 0', color: COLORS.primary, fontSize: '24px' }}>
              💬 Discussion Forum
            </h2>
            <p style={{ margin: 0, color: COLORS.darkGray, fontSize: '14px' }}>
              Moderate discussions, post announcements, and respond to participant queries
            </p>
          </div>
          <DiscussionForum eventId={eventId} />
        </div>

        {/* Feedback Section */}
        <div style={{ marginTop: '30px', marginBottom: '30px' }}>
          <div style={{ ...STYLES.card, marginBottom: '8px' }}>
            <h2 style={{ margin: '0 0 8px 0', color: COLORS.primary, fontSize: '24px' }}>
              📝 Event Feedback
            </h2>
            <p style={{ margin: 0, color: COLORS.darkGray, fontSize: '14px' }}>
              View and manage participant feedback for this event
            </p>
          </div>
          <FeedbackList eventId={eventId} />
        </div>
      </div>
    </div>
  );
};

export default EventDetailOrganizer;
