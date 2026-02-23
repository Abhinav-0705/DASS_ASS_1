import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { COLORS, STYLES, getStatusBadge } from '../constants/theme';

const OrganizerDetailParticipant = () => {
  const { organizerId } = useParams();
  const navigate = useNavigate();
  const [organizer, setOrganizer] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past

  useEffect(() => {
    fetchOrganizerDetails();
    fetchOrganizerEvents();
  }, [organizerId]);

  const fetchOrganizerDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/participant/organizers/${organizerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrganizer(response.data.organizer);
      setIsFollowing(response.data.isFollowing);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch organizer details');
    }
  };

  const fetchOrganizerEvents = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/events/organizer/${organizerId}`
      );
      setEvents(response.data.events);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/participant/organizers/${organizerId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFollowing(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to follow organizer');
    }
  };

  const handleUnfollow = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/api/participant/organizers/${organizerId}/follow`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFollowing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unfollow organizer');
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      club: 'Club',
      council: 'Council',
      fest_team: 'Fest Team',
      department: 'Department',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      club: COLORS.primary,
      council: COLORS.secondary,
      fest_team: COLORS.accent,
      department: COLORS.info,
      other: COLORS.darkGray,
    };
    return colors[category] || COLORS.darkGray;
  };

  const isUpcomingEvent = (event) => {
    const now = new Date();
    const startDate = new Date(event.eventStartDate);
    return startDate >= now || event.status === 'published';
  };

  const isPastEvent = (event) => {
    const now = new Date();
    const endDate = new Date(event.eventEndDate);
    return endDate < now || event.status === 'completed';
  };

  const upcomingEvents = events.filter(isUpcomingEvent);
  const pastEvents = events.filter(isPastEvent);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading organizer details...</div>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Organizer not found</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <button onClick={() => navigate('/participant/clubs')} style={styles.backButton}>
        ← Back to Clubs
      </button>

      {error && (
        <div style={styles.errorAlert}>
          {error}
          <button onClick={() => setError('')} style={styles.closeButton}>×</button>
        </div>
      )}

      {/* Organizer Header Card */}
      <div style={styles.headerCard}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.organizerName}>{organizer.organizerName}</h1>
            <span
              style={{
                ...styles.categoryBadge,
                background: `${getCategoryColor(organizer.category)}15`,
                color: getCategoryColor(organizer.category),
              }}
            >
              {getCategoryLabel(organizer.category)}
            </span>
          </div>
          
          {isFollowing ? (
            <button onClick={handleUnfollow} style={styles.unfollowButton}>
              Following ✓
            </button>
          ) : (
            <button onClick={handleFollow} style={styles.followButton}>
              + Follow
            </button>
          )}
        </div>

        <div style={styles.infoSection}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Description:</span>
            <p style={styles.infoValue}>
              {organizer.description || 'No description available'}
            </p>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Contact Email:</span>
            <a href={`mailto:${organizer.contactEmail}`} style={styles.emailLink}>
              {organizer.contactEmail}
            </a>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div style={styles.eventsSection}>
        <h2 style={styles.sectionTitle}>Events</h2>

        {/* Tab Navigation */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('upcoming')}
            style={{
              ...styles.tab,
              ...(activeTab === 'upcoming' ? styles.activeTab : {}),
            }}
          >
            Upcoming ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            style={{
              ...styles.tab,
              ...(activeTab === 'past' ? styles.activeTab : {}),
            }}
          >
            Past ({pastEvents.length})
          </button>
        </div>

        {/* Events List */}
        <div style={styles.eventsGrid}>
          {activeTab === 'upcoming' && upcomingEvents.length === 0 && (
            <div style={styles.emptyState}>
              <h3 style={styles.emptyTitle}>No upcoming events</h3>
              <p style={styles.emptyText}>Check back later for new events from this organizer</p>
            </div>
          )}

          {activeTab === 'past' && pastEvents.length === 0 && (
            <div style={styles.emptyState}>
              <h3 style={styles.emptyTitle}>No past events</h3>
              <p style={styles.emptyText}>This organizer hasn't completed any events yet</p>
            </div>
          )}

          {(activeTab === 'upcoming' ? upcomingEvents : pastEvents).map(event => (
            <div key={event._id} style={styles.eventCard}>
              <div style={styles.eventHeader}>
                <h3 style={styles.eventTitle}>{event.eventName}</h3>
                {getStatusBadge(event.status)}
              </div>

              <p style={styles.eventDescription}>
                {event.eventDescription || 'No description available'}
              </p>

              <div style={styles.eventDetails}>
                <div style={styles.eventDetail}>
                  <span style={styles.detailLabel}>Type:</span>
                  <span style={styles.detailValue}>{event.eventType}</span>
                </div>
                <div style={styles.eventDetail}>
                  <span style={styles.detailLabel}>Start:</span>
                  <span style={styles.detailValue}>{formatDate(event.eventStartDate)}</span>
                </div>
                <div style={styles.eventDetail}>
                  <span style={styles.detailLabel}>End:</span>
                  <span style={styles.detailValue}>{formatDate(event.eventEndDate)}</span>
                </div>
                <div style={styles.eventDetail}>
                  <span style={styles.detailLabel}>Venue:</span>
                  <span style={styles.detailValue}>{event.eventVenue}</span>
                </div>
              </div>

              {event.status === 'published' && activeTab === 'upcoming' && (
                <button
                  onClick={() => navigate(`/participant/events/${event._id}`)}
                  style={styles.viewEventButton}
                >
                  View Event Details
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: COLORS.darkGray,
  },
  error: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: COLORS.accent,
  },
  errorAlert: {
    ...STYLES.card,
    background: `${COLORS.accent}15`,
    border: `1px solid ${COLORS.accent}`,
    color: COLORS.accent,
    padding: '12px 16px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: COLORS.accent,
    cursor: 'pointer',
    padding: '0 8px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: COLORS.primary,
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  headerCard: {
    ...STYLES.card,
    padding: '32px',
    marginBottom: '32px',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  organizerName: {
    fontSize: '32px',
    fontWeight: '600',
    color: COLORS.dark,
    margin: '0 0 12px 0',
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: '500',
  },
  followButton: {
    ...STYLES.button,
    background: COLORS.primary,
    border: 'none',
    color: COLORS.white,
    padding: '10px 24px',
  },
  unfollowButton: {
    ...STYLES.button,
    background: COLORS.secondary,
    border: 'none',
    color: COLORS.white,
    padding: '10px 24px',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  infoValue: {
    fontSize: '16px',
    color: COLORS.dark,
    lineHeight: '1.6',
    margin: 0,
  },
  emailLink: {
    fontSize: '16px',
    color: COLORS.primary,
    textDecoration: 'none',
  },
  eventsSection: {
    marginTop: '32px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: '24px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: `2px solid ${COLORS.veryLightGray}`,
  },
  tab: {
    padding: '12px 24px',
    background: 'none',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    color: COLORS.darkGray,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: COLORS.primary,
    borderBottomColor: COLORS.primary,
  },
  eventsGrid: {
    display: 'grid',
    gap: '24px',
  },
  eventCard: {
    ...STYLES.card,
    padding: '24px',
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  eventTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: COLORS.dark,
    margin: 0,
  },
  eventDescription: {
    fontSize: '14px',
    color: COLORS.darkGray,
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  eventDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '16px',
    paddingTop: '16px',
    borderTop: `1px solid ${COLORS.veryLightGray}`,
  },
  eventDetail: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: COLORS.darkGray,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: '14px',
    color: COLORS.dark,
  },
  viewEventButton: {
    ...STYLES.button,
    width: '100%',
    background: COLORS.primary,
    border: 'none',
    color: COLORS.white,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: COLORS.darkGray,
  },
};

export default OrganizerDetailParticipant;
