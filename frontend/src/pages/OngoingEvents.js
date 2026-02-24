import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { COLORS, STYLES, getStatusBadge } from '../constants/theme';

import { useAuth } from '../context/AuthContext';

const OngoingEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOngoingEvents();
  }, []);

  const fetchOngoingEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get(`/events/organizer/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const now = new Date();
      const ongoing = response.data.events.filter(
        event => {
          const start = new Date(event.eventStartDate);
          const end = new Date(event.eventEndDate);
          // Only show published events that are currently happening
          return start <= now && end >= now && event.status === 'published';
        }
      );
      setEvents(ongoing);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch ongoing events');
      setLoading(false);
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
        Loading ongoing events...
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
        {/* Header */}
        <div style={{
          ...STYLES.card,
          marginBottom: '24px',
        }}>
          <h2 style={{ margin: '0 0 8px 0', color: COLORS.dark, fontSize: '28px' }}>
            Ongoing Events
          </h2>
          <p style={{ margin: 0, color: COLORS.darkGray }}>
            Events that are currently published or ongoing
          </p>
        </div>

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

        {/* Events Grid */}
        {events.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {events.map((event) => (
              <Link
                key={event._id}
                to={`/organizer/event/${event._id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  ...STYLES.card,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  height: '100%',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = STYLES.cardHover.boxShadow;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = STYLES.card.boxShadow;
                  }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: COLORS.dark, fontSize: '18px' }}>
                      {event.eventName}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <span style={getStatusBadge(event.status)}>
                        {event.status}
                      </span>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        background: event.eventType === 'normal' ? COLORS.info : COLORS.warning,
                        color: COLORS.white,
                        fontSize: '12px',
                        fontWeight: '500',
                      }}>
                        {event.eventType}
                      </span>
                    </div>
                  </div>

                  <div style={{ color: COLORS.darkGray, fontSize: '14px', marginBottom: '16px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Start:</strong> {new Date(event.eventStartDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Registrations:</strong> {event.currentRegistrations}/{event.registrationLimit}
                    </div>
                    <div>
                      <strong>Registration Deadline:</strong> {new Date(event.registrationDeadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  <div style={{
                    width: '100%',
                    background: COLORS.veryLightGray,
                    height: '8px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${(event.currentRegistrations / event.registrationLimit) * 100}%`,
                      height: '100%',
                      background: event.currentRegistrations >= event.registrationLimit * 0.8
                        ? COLORS.accent
                        : COLORS.secondary,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{
            ...STYLES.card,
            textAlign: 'center',
            padding: '60px 24px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
            <h3 style={{ margin: '0 0 8px 0', color: COLORS.dark }}>
              No Ongoing Events
            </h3>
            <p style={{ margin: '0 0 24px 0', color: COLORS.darkGray }}>
              You don't have any published or ongoing events at the moment.
            </p>
            <Link to="/organizer/create-event">
              <button style={{
                ...STYLES.button,
                background: COLORS.primary,
                color: COLORS.white,
              }}>
                Create New Event
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OngoingEvents;
