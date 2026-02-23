import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { COLORS, STYLES } from '../constants/theme';

const PasswordResetRequest = () => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/password-reset/my-requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMyRequests(response.data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (reason.trim().length < 10) {
      setError('Please provide a detailed reason (at least 10 characters)');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/password-reset/request`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Password reset request submitted successfully!');
      setReason('');
      fetchMyRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: `${COLORS.warning}15`, color: COLORS.warning, text: '⏳ Pending' },
      approved: { bg: `${COLORS.secondary}15`, color: COLORS.secondary, text: '✅ Approved' },
      rejected: { bg: `${COLORS.accent}15`, color: COLORS.accent, text: '❌ Rejected' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span style={{
        background: badge.bg,
        color: badge.color,
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 8px 0', color: COLORS.dark, fontSize: '32px', fontWeight: '600' }}>
        🔐 Password Reset Request
      </h1>
      <p style={{ color: COLORS.darkGray, marginBottom: '32px' }}>
        Request a password reset from the administrator
      </p>

      {/* Alerts */}
      {error && (
        <div style={{
          ...STYLES.card,
          background: `${COLORS.accent}15`,
          border: `1px solid ${COLORS.accent}`,
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <p style={{ color: COLORS.accent, margin: 0 }}>{error}</p>
          <button onClick={() => setError('')} style={{
            background: 'none',
            border: 'none',
            color: COLORS.accent,
            fontSize: '20px',
            cursor: 'pointer'
          }}>×</button>
        </div>
      )}

      {success && (
        <div style={{
          ...STYLES.card,
          background: `${COLORS.secondary}15`,
          border: `1px solid ${COLORS.secondary}`,
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <p style={{ color: COLORS.secondary, margin: 0 }}>{success}</p>
          <button onClick={() => setSuccess('')} style={{
            background: 'none',
            border: 'none',
            color: COLORS.secondary,
            fontSize: '20px',
            cursor: 'pointer'
          }}>×</button>
        </div>
      )}

      {/* Request Form */}
      <div style={{ ...STYLES.card, marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 24px 0', color: COLORS.dark, fontSize: '24px', fontWeight: '600' }}>
          Submit New Request
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
              Reason for Password Reset *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed reason why you need a password reset..."
              rows="5"
              style={{
                ...STYLES.input,
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <p style={{ fontSize: '12px', color: COLORS.darkGray, marginTop: '4px' }}>
              Minimum 10 characters required
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || reason.trim().length < 10}
            style={{
              ...STYLES.button,
              width: '100%',
              opacity: (loading || reason.trim().length < 10) ? 0.6 : 1,
              cursor: (loading || reason.trim().length < 10) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* Request History */}
      <div style={STYLES.card}>
        <h2 style={{ margin: '0 0 24px 0', color: COLORS.dark, fontSize: '24px', fontWeight: '600' }}>
          📋 Request History
        </h2>

        {myRequests.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: COLORS.veryLightGray,
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
            <p style={{ color: COLORS.darkGray, margin: 0 }}>
              No password reset requests yet
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {myRequests.map((request) => (
              <div key={request._id} style={{
                padding: '20px',
                background: COLORS.veryLightGray,
                borderRadius: '8px',
                border: `1px solid ${COLORS.lightGray}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', color: COLORS.darkGray, fontSize: '14px' }}>
                      Requested: {new Date(request.requestDate).toLocaleString()}
                    </p>
                    {request.reviewedAt && (
                      <p style={{ margin: 0, color: COLORS.darkGray, fontSize: '14px' }}>
                        Reviewed: {new Date(request.reviewedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div style={{
                  background: COLORS.white,
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}>
                  <strong style={{ color: COLORS.dark }}>Reason:</strong>
                  <p style={{ margin: '8px 0 0 0', color: COLORS.darkGray, whiteSpace: 'pre-wrap' }}>
                    {request.reason}
                  </p>
                </div>

                {request.adminComments && (
                  <div style={{
                    background: request.status === 'approved' ? `${COLORS.secondary}15` : `${COLORS.accent}15`,
                    padding: '12px',
                    borderRadius: '6px',
                    border: `1px solid ${request.status === 'approved' ? COLORS.secondary : COLORS.accent}`
                  }}>
                    <strong style={{ color: request.status === 'approved' ? COLORS.secondary : COLORS.accent }}>
                      Admin Response:
                    </strong>
                    <p style={{ margin: '8px 0 0 0', color: COLORS.dark }}>
                      {request.adminComments}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordResetRequest;
