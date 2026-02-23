import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { COLORS, STYLES } from '../constants/theme';

const PasswordResetManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);
  const [adminComments, setAdminComments] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [selectedFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/password-reset/all?status=${selectedFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(response.data.requests);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to fetch requests');
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!adminComments.trim()) {
      setError('Please provide admin comments');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/api/password-reset/${requestId}/approve`,
        { adminComments },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewPassword(response.data.newPassword);
      setSuccess('Password reset approved! Share the new password with the organizer.');
      setProcessingId(null);
      setAdminComments('');
      fetchRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    if (!adminComments.trim() || adminComments.trim().length < 5) {
      setError('Please provide a reason for rejection (at least 5 characters)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/api/password-reset/${requestId}/reject`,
        { adminComments },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Password reset request rejected');
      setProcessingId(null);
      setAdminComments('');
      fetchRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reject request');
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

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: COLORS.darkGray }}>Loading requests...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 8px 0', color: COLORS.dark, fontSize: '32px', fontWeight: '600' }}>
        🔐 Password Reset Management
      </h1>
      <p style={{ color: COLORS.darkGray, marginBottom: '32px' }}>
        Review and process password reset requests from organizers
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
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: newPassword ? '16px' : 0 }}>
            <p style={{ color: COLORS.secondary, margin: 0, fontWeight: '600' }}>{success}</p>
            <button onClick={() => { setSuccess(''); setNewPassword(''); }} style={{
              background: 'none',
              border: 'none',
              color: COLORS.secondary,
              fontSize: '20px',
              cursor: 'pointer'
            }}>×</button>
          </div>
          {newPassword && (
            <div style={{
              background: COLORS.white,
              padding: '16px',
              borderRadius: '8px',
              border: `2px solid ${COLORS.secondary}`
            }}>
              <strong style={{ color: COLORS.dark }}>🔑 New Password:</strong>
              <div style={{
                marginTop: '8px',
                padding: '12px',
                background: COLORS.veryLightGray,
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '18px',
                fontWeight: '600',
                color: COLORS.primary,
                letterSpacing: '2px'
              }}>
                {newPassword}
              </div>
              <p style={{ marginTop: '8px', fontSize: '14px', color: COLORS.darkGray, margin: '8px 0 0 0' }}>
                ⚠️ Please share this password securely with the organizer. This will not be shown again.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filter */}
      <div style={{ ...STYLES.card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ color: COLORS.dark, fontWeight: '500' }}>Filter:</label>
          {['pending', 'approved', 'rejected', ''].map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: selectedFilter === filter ? 'none' : `1px solid ${COLORS.lightGray}`,
                background: selectedFilter === filter ? COLORS.primary : COLORS.white,
                color: selectedFilter === filter ? COLORS.white : COLORS.darkGray,
                cursor: 'pointer',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {filter || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div style={{
          ...STYLES.card,
          textAlign: 'center',
          padding: '60px',
          background: COLORS.veryLightGray
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ color: COLORS.dark, marginBottom: '8px' }}>No Requests</h3>
          <p style={{ color: COLORS.darkGray, margin: 0 }}>
            {selectedFilter 
              ? `No ${selectedFilter} password reset requests`
              : 'No password reset requests found'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {requests.map((request) => (
            <div key={request._id} style={STYLES.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: COLORS.dark, fontSize: '20px' }}>
                    {request.organizerId?.organizerName || 'Unknown Organizer'}
                  </h3>
                  <p style={{ margin: '0 0 4px 0', color: COLORS.darkGray, fontSize: '14px' }}>
                    📧 {request.organizerId?.email}
                  </p>
                  <p style={{ margin: '0 0 4px 0', color: COLORS.darkGray, fontSize: '14px' }}>
                    🏛️ Club: {request.organizerId?.clubName || 'N/A'}
                  </p>
                  <p style={{ margin: 0, color: COLORS.darkGray, fontSize: '14px' }}>
                    📅 Requested: {new Date(request.requestDate).toLocaleString()}
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div style={{
                background: COLORS.veryLightGray,
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <strong style={{ color: COLORS.dark }}>Reason:</strong>
                <p style={{ margin: '8px 0 0 0', color: COLORS.darkGray, whiteSpace: 'pre-wrap' }}>
                  {request.reason}
                </p>
              </div>

              {request.status === 'pending' && (
                <div>
                  {processingId === request._id ? (
                    <div style={{
                      background: COLORS.veryLightGray,
                      padding: '20px',
                      borderRadius: '8px'
                    }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                        Admin Comments *
                      </label>
                      <textarea
                        value={adminComments}
                        onChange={(e) => setAdminComments(e.target.value)}
                        placeholder="Provide reason for approval/rejection..."
                        rows="3"
                        style={{ ...STYLES.input, resize: 'vertical', marginBottom: '12px' }}
                      />
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => handleApprove(request._id)}
                          style={{
                            ...STYLES.button,
                            background: COLORS.secondary,
                            flex: 1
                          }}
                        >
                          ✅ Approve & Generate Password
                        </button>
                        <button
                          onClick={() => handleReject(request._id)}
                          style={{
                            ...STYLES.button,
                            background: COLORS.accent,
                            flex: 1
                          }}
                        >
                          ❌ Reject Request
                        </button>
                        <button
                          onClick={() => {
                            setProcessingId(null);
                            setAdminComments('');
                          }}
                          style={{
                            ...STYLES.button,
                            background: COLORS.lightGray,
                            color: COLORS.darkGray
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setProcessingId(request._id)}
                      style={{
                        ...STYLES.button,
                        width: '100%'
                      }}
                    >
                      Process Request
                    </button>
                  )}
                </div>
              )}

              {request.status !== 'pending' && request.adminComments && (
                <div style={{
                  background: request.status === 'approved' ? `${COLORS.secondary}15` : `${COLORS.accent}15`,
                  padding: '16px',
                  borderRadius: '8px',
                  border: `1px solid ${request.status === 'approved' ? COLORS.secondary : COLORS.accent}`
                }}>
                  <strong style={{ color: request.status === 'approved' ? COLORS.secondary : COLORS.accent }}>
                    Admin Response:
                  </strong>
                  <p style={{ margin: '8px 0 0 0', color: COLORS.dark }}>
                    {request.adminComments}
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: COLORS.darkGray }}>
                    Reviewed: {new Date(request.reviewedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordResetManagement;
