import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { COLORS, STYLES } from '../constants/theme';

const FeedbackForm = ({ eventId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasFeedback, setHasFeedback] = useState(false);

  useEffect(() => {
    checkExistingFeedback();
  }, [eventId]);

  const checkExistingFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/feedback/my-feedback/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasFeedback(response.data.hasFeedback);
    } catch (error) {
      console.error('Error checking feedback:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please enter a comment');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '${API_BASE_URL}/api/feedback',
        { eventId, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHasFeedback(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (hasFeedback) {
    return (
      <div style={{
        ...STYLES.card,
        textAlign: 'center',
        padding: '40px',
        background: `linear-gradient(135deg, ${COLORS.secondary}15, ${COLORS.primary}15)`
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h3 style={{ color: COLORS.dark, marginBottom: '8px' }}>Thank You!</h3>
        <p style={{ color: COLORS.darkGray, margin: 0 }}>
          You have already submitted feedback for this event
        </p>
      </div>
    );
  }

  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={STYLES.card}>
      <h3 style={{ color: COLORS.dark, marginBottom: '8px', fontSize: '20px', fontWeight: '600' }}>
        📝 Share Your Feedback
      </h3>
      <p style={{ color: COLORS.darkGray, marginBottom: '24px', fontSize: '14px' }}>
        Your feedback is anonymous and helps us improve future events
      </p>

      {error && (
        <div style={{
          background: `${COLORS.accent}15`,
          border: `1px solid ${COLORS.accent}`,
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: COLORS.accent, fontSize: '14px' }}>{error}</span>
          <button
            onClick={() => setError('')}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.accent,
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 4px'
            }}
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Star Rating */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '12px', color: COLORS.dark, fontWeight: '500' }}>
            Rating *
          </label>
          <div style={{ display: 'flex', gap: '8px', fontSize: '32px' }}>
            {stars.map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  transition: 'transform 0.2s',
                  transform: (hoveredRating >= star || rating >= star) ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                <span style={{
                  color: (hoveredRating >= star || rating >= star) ? COLORS.warning : COLORS.lightGray
                }}>
                  ★
                </span>
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p style={{ color: COLORS.darkGray, fontSize: '14px', marginTop: '8px' }}>
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          )}
        </div>

        {/* Comment */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
            Comment *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience and suggestions..."
            rows="5"
            style={{
              ...STYLES.input,
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            ...STYLES.button,
            width: '100%',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;
