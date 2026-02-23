import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { COLORS, STYLES } from '../constants/theme';

const ParticipantClubs = () => {
  const [organizers, setOrganizers] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, club, council, fest_team, department, other
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizers();
    fetchFollowedOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/participant/organizers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrganizers(response.data.organizers);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch organizers');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowedOrganizers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/participant/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowedOrganizers(response.data.preferences.followedOrganizers.map(org => org._id || org));
    } catch (err) {
      console.error('Error fetching followed organizers:', err);
    }
  };

  const handleFollow = async (organizerId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/participant/organizers/${organizerId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFollowedOrganizers([...followedOrganizers, organizerId]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to follow organizer');
    }
  };

  const handleUnfollow = async (organizerId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/api/participant/organizers/${organizerId}/follow`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFollowedOrganizers(followedOrganizers.filter(id => id !== organizerId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unfollow organizer');
    }
  };

  const isFollowing = (organizerId) => {
    return followedOrganizers.includes(organizerId);
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

  const filteredOrganizers = filter === 'all'
    ? organizers
    : organizers.filter(org => org.category === filter);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading organizers...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Clubs & Organizers</h1>
          <p style={styles.subtitle}>Discover and follow organizers to stay updated on their events</p>
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={() => setError('')} style={styles.closeButton}>×</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={styles.filterContainer}>
        {['all', 'club', 'council', 'fest_team', 'department', 'other'].map(category => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            style={{
              ...styles.filterButton,
              ...(filter === category ? styles.filterButtonActive : {}),
            }}
          >
            {category === 'all' ? 'All' : getCategoryLabel(category)}
          </button>
        ))}
      </div>

      {/* Organizers Grid */}
      {filteredOrganizers.length === 0 ? (
        <div style={styles.emptyState}>
          <h3 style={styles.emptyTitle}>No organizers found</h3>
          <p style={styles.emptyText}>
            {filter === 'all'
              ? 'There are no approved organizers yet.'
              : `No ${getCategoryLabel(filter).toLowerCase()}s found.`}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredOrganizers.map(organizer => (
            <div key={organizer._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.organizerName}>{organizer.organizerName}</h3>
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
              </div>

              <p style={styles.description}>
                {organizer.description || 'No description available'}
              </p>

              <div style={styles.contactInfo}>
                <span style={styles.contactLabel}>Contact:</span>
                <a href={`mailto:${organizer.contactEmail}`} style={styles.contactEmail}>
                  {organizer.contactEmail}
                </a>
              </div>

              <div style={styles.cardActions}>
                <button
                  onClick={() => navigate(`/participant/organizers/${organizer._id}`)}
                  style={styles.viewButton}
                >
                  View Details
                </button>
                
                {isFollowing(organizer._id) ? (
                  <button
                    onClick={() => handleUnfollow(organizer._id)}
                    style={styles.unfollowButton}
                  >
                    Following ✓
                  </button>
                ) : (
                  <button
                    onClick={() => handleFollow(organizer._id)}
                    style={styles.followButton}
                  >
                    Follow
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  header: {
    marginBottom: '32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: '600',
    color: COLORS.dark,
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: COLORS.darkGray,
    margin: 0,
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: COLORS.darkGray,
  },
  error: {
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
  filterContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '10px 20px',
    background: COLORS.white,
    border: `1px solid ${COLORS.lightGray}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: COLORS.darkGray,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    background: COLORS.primary,
    color: COLORS.white,
    borderColor: COLORS.primary,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  card: {
    ...STYLES.card,
    padding: '24px',
    transition: 'all 0.2s',
    cursor: 'default',
  },
  cardHeader: {
    marginBottom: '16px',
  },
  organizerName: {
    fontSize: '20px',
    fontWeight: '600',
    color: COLORS.dark,
    margin: '0 0 8px 0',
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  description: {
    fontSize: '14px',
    color: COLORS.darkGray,
    lineHeight: '1.6',
    marginBottom: '16px',
    minHeight: '60px',
  },
  contactInfo: {
    fontSize: '14px',
    marginBottom: '20px',
    paddingTop: '16px',
    borderTop: `1px solid ${COLORS.veryLightGray}`,
  },
  contactLabel: {
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  contactEmail: {
    color: COLORS.primary,
    textDecoration: 'none',
    marginLeft: '8px',
  },
  cardActions: {
    display: 'flex',
    gap: '12px',
  },
  viewButton: {
    ...STYLES.button,
    flex: 1,
    background: COLORS.white,
    border: `1px solid ${COLORS.primary}`,
    color: COLORS.primary,
  },
  followButton: {
    ...STYLES.button,
    flex: 1,
    background: COLORS.primary,
    border: 'none',
    color: COLORS.white,
  },
  unfollowButton: {
    ...STYLES.button,
    flex: 1,
    background: COLORS.secondary,
    border: 'none',
    color: COLORS.white,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '16px',
    color: COLORS.darkGray,
  },
};

export default ParticipantClubs;
