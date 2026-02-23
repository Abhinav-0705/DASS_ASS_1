import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { COLORS, STYLES } from '../constants/theme';

const FeedbackList = ({ eventId }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeedbacks();
    // Poll for new feedback every 10 seconds
    const interval = setInterval(fetchFeedbacks, 10000);
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/feedback/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFeedbacks(response.data.feedbacks || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError('Failed to load feedback');
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div style={{ ...STYLES.card, textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
        <p style={{ color: COLORS.darkGray }}>Loading feedback...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        ...STYLES.card,
        padding: '20px',
        background: '#f8d7da',
        border: `1px solid #f5c6cb`,
        color: '#721c24'
      }}>
        ❌ {error}
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div style={{
        ...STYLES.card,
        textAlign: 'center',
        padding: '40px',
        background: `${COLORS.lightGray}50`
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <h3 style={{ color: COLORS.darkGray, marginBottom: '8px' }}>
          No Feedback Yet
        </h3>
        <p style={{ color: COLORS.darkGray, margin: 0 }}>
          Participant feedback will appear here once submitted
        </p>
      </div>
    );
  }

  // Calculate average rating
  const averageRating = feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length;

  return (
    <div>
      {/* Summary Card */}
      <div style={{
        ...STYLES.card,
        marginBottom: '20px',
        background: `linear-gradient(135deg, ${COLORS.primary}15, ${COLORS.secondary}15)`,
        border: `1px solid ${COLORS.primary}30`
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '14px', color: COLORS.darkGray, marginBottom: '8px' }}>
              Total Feedback
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: COLORS.primary }}>
              {feedbacks.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: COLORS.darkGray, marginBottom: '8px' }}>
              Average Rating
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: COLORS.secondary }}>
              {averageRating.toFixed(1)} / 5
            </div>
            <div style={{ fontSize: '20px', marginTop: '4px' }}>
              {renderStars(Math.round(averageRating))}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {feedbacks.map((feedback) => (
          <div
            key={feedback._id}
            style={{
              ...STYLES.card,
              border: `1px solid ${COLORS.lightGray}`,
            }}
          >
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: `1px solid ${COLORS.veryLightGray}`
            }}>
              <div>
                <div style={{ 
                  fontWeight: '600', 
                  color: COLORS.dark,
                  marginBottom: '4px' 
                }}>
                  {feedback.isAnonymous ? (
                    <span style={{ color: COLORS.darkGray }}>🕵️ Anonymous Participant</span>
                  ) : (
                    <span>
                      {feedback.participantId?.firstName} {feedback.participantId?.lastName}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '24px' }}>
                  {renderStars(feedback.rating)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: COLORS.darkGray 
                }}>
                  {new Date(feedback.createdAt).toLocaleDateString()} at{' '}
                  {new Date(feedback.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>

            {/* Feedback Content */}
            {feedback.comments && (
              <div style={{ 
                color: COLORS.dark,
                lineHeight: '1.6',
                fontSize: '15px',
                whiteSpace: 'pre-wrap'
              }}>
                {feedback.comments}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackList;
