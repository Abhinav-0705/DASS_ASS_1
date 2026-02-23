import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { COLORS, STYLES } from '../constants/theme';

const EventFeedback = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [feedbacks, setFeedbacks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRating, setSelectedRating] = useState('');

  useEffect(() => {
    fetchFeedback();
  }, [eventId, selectedRating]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API_BASE_URL}/api/feedback/event/${eventId}`;
      if (selectedRating) {
        url += `?rating=${selectedRating}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFeedbacks(response.data.feedbacks);
      setStatistics(response.data.statistics);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setError(error.response?.data?.message || 'Failed to fetch feedback');
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: COLORS.darkGray }}>Loading feedback...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button
            onClick={() => navigate(-1)}
            style={{
              ...STYLES.button,
              background: COLORS.white,
              color: COLORS.primary,
              border: `1px solid ${COLORS.primary}`,
              marginBottom: '16px'
            }}
          >
            ← Back
          </button>
          <h1 style={{ margin: '0 0 8px 0', color: COLORS.dark, fontSize: '32px', fontWeight: '600' }}>
            📊 Event Feedback
          </h1>
          <p style={{ color: COLORS.darkGray, margin: 0 }}>
            Anonymous feedback from participants
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          ...STYLES.card,
          background: `${COLORS.accent}15`,
          border: `1px solid ${COLORS.accent}`,
          marginBottom: '24px'
        }}>
          <p style={{ color: COLORS.accent, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div style={{ 
          ...STYLES.card, 
          marginBottom: '32px',
          background: `linear-gradient(135deg, ${COLORS.primary}15, ${COLORS.secondary}15)`
        }}>
          <h2 style={{ margin: '0 0 24px 0', color: COLORS.dark, fontSize: '24px', fontWeight: '600' }}>
            📈 Overall Statistics
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {/* Average Rating */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', color: COLORS.warning, marginBottom: '8px' }}>
                {statistics.averageRating}
              </div>
              <div style={{ fontSize: '32px', color: COLORS.warning }}>
                {renderStars(Math.round(statistics.averageRating))}
              </div>
              <div style={{ color: COLORS.darkGray, marginTop: '8px' }}>Average Rating</div>
            </div>

            {/* Total Feedbacks */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', color: COLORS.primary, marginBottom: '8px' }}>
                {statistics.totalFeedbacks}
              </div>
              <div style={{ color: COLORS.darkGray }}>Total Feedbacks</div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div style={{ marginTop: '32px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: COLORS.dark, fontSize: '18px' }}>Rating Distribution</h3>
            {[5, 4, 3, 2, 1].map(rating => {
              const count = statistics.ratingDistribution[rating];
              const percentage = statistics.totalFeedbacks > 0 
                ? (count / statistics.totalFeedbacks * 100).toFixed(0) 
                : 0;
              
              return (
                <div key={rating} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '80px', color: COLORS.darkGray, fontSize: '14px' }}>
                    {rating} ★
                  </div>
                  <div style={{ 
                    flex: 1, 
                    background: COLORS.veryLightGray, 
                    borderRadius: '8px', 
                    height: '24px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      background: COLORS.warning,
                      height: '100%',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ width: '80px', color: COLORS.darkGray, fontSize: '14px', textAlign: 'right' }}>
                    {count} ({percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ ...STYLES.card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ color: COLORS.dark, fontWeight: '500' }}>Filter by Rating:</label>
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            style={{ ...STYLES.input, width: 'auto', flex: 'none' }}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          {selectedRating && (
            <button
              onClick={() => setSelectedRating('')}
              style={{
                ...STYLES.button,
                background: COLORS.white,
                color: COLORS.accent,
                border: `1px solid ${COLORS.accent}`,
                padding: '8px 16px'
              }}
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <div style={{
          ...STYLES.card,
          textAlign: 'center',
          padding: '60px 20px',
          background: COLORS.veryLightGray
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ color: COLORS.dark, marginBottom: '8px' }}>No Feedback Yet</h3>
          <p style={{ color: COLORS.darkGray, margin: 0 }}>
            {selectedRating 
              ? `No feedback with ${selectedRating} star rating`
              : 'No participants have submitted feedback for this event yet'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {feedbacks.map((feedback) => (
            <div key={feedback._id} style={STYLES.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ fontSize: '24px', color: COLORS.warning }}>
                  {renderStars(feedback.rating)}
                </div>
                <div style={{ fontSize: '12px', color: COLORS.darkGray }}>
                  {formatDate(feedback.createdAt)}
                </div>
              </div>
              <p style={{ 
                color: COLORS.dark, 
                lineHeight: '1.6', 
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {feedback.comment}
              </p>
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: COLORS.veryLightGray,
                borderRadius: '6px',
                fontSize: '12px',
                color: COLORS.darkGray
              }}>
                🔒 Anonymous Feedback
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventFeedback;
