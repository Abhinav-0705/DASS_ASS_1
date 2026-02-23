import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { COLORS, STYLES } from '../constants/theme';

const PaymentApprovals = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, pending, approved, rejected
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPaymentRequests();
  }, [eventId]);

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/registrations/event/${eventId}/payment-approvals`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRegistrations(response.data.registrations);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      setError(error.response?.data?.message || 'Failed to fetch payment requests');
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId) => {
    if (!window.confirm('Are you sure you want to approve this payment? This will generate a ticket and decrement stock.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/api/registrations/${registrationId}/approve-payment`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Payment approved successfully!');
      fetchPaymentRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to approve payment');
    }
  };

  const handleReject = async (registrationId) => {
    if (!rejectionReason.trim()) {
      setError('Please enter a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/api/registrations/${registrationId}/reject-payment`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Payment rejected');
      setRejectingId(null);
      setRejectionReason('');
      fetchPaymentRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reject payment');
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (selectedFilter === 'all') return true;
    return reg.paymentApprovalStatus === selectedFilter;
  });

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
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
        <p style={{ color: COLORS.darkGray }}>Loading payment requests...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => navigate(`/organizer/event/${eventId}`)}
          style={{
            ...STYLES.button,
            background: COLORS.white,
            color: COLORS.primary,
            border: `1px solid ${COLORS.primary}`,
            marginBottom: '16px'
          }}
        >
          ← Back to Event
        </button>
        <h1 style={{ margin: '0 0 8px 0', color: COLORS.dark, fontSize: '32px', fontWeight: '600' }}>
          💳 Payment Approvals
        </h1>
        <p style={{ color: COLORS.darkGray, margin: 0 }}>
          Review and approve payment proofs for merchandise orders
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          ...STYLES.card,
          background: `${COLORS.accent}15`,
          border: `1px solid ${COLORS.accent}`,
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
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
          justifyContent: 'space-between',
          alignItems: 'center'
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

      {/* Filter */}
      <div style={{ ...STYLES.card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ color: COLORS.dark, fontWeight: '500' }}>Filter:</label>
          {['all', 'pending', 'approved', 'rejected'].map(filter => (
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
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ ...STYLES.card, background: `linear-gradient(135deg, ${COLORS.warning}15, ${COLORS.warning}25)` }}>
          <div style={{ fontSize: '32px', color: COLORS.warning, fontWeight: '600', marginBottom: '8px' }}>
            {registrations.filter(r => r.paymentApprovalStatus === 'pending').length}
          </div>
          <div style={{ color: COLORS.darkGray, fontSize: '14px' }}>Pending Approval</div>
        </div>
        <div style={{ ...STYLES.card, background: `linear-gradient(135deg, ${COLORS.secondary}15, ${COLORS.secondary}25)` }}>
          <div style={{ fontSize: '32px', color: COLORS.secondary, fontWeight: '600', marginBottom: '8px' }}>
            {registrations.filter(r => r.paymentApprovalStatus === 'approved').length}
          </div>
          <div style={{ color: COLORS.darkGray, fontSize: '14px' }}>Approved</div>
        </div>
        <div style={{ ...STYLES.card, background: `linear-gradient(135deg, ${COLORS.accent}15, ${COLORS.accent}25)` }}>
          <div style={{ fontSize: '32px', color: COLORS.accent, fontWeight: '600', marginBottom: '8px' }}>
            {registrations.filter(r => r.paymentApprovalStatus === 'rejected').length}
          </div>
          <div style={{ color: COLORS.darkGray, fontSize: '14px' }}>Rejected</div>
        </div>
      </div>

      {/* Payment Requests List */}
      {filteredRegistrations.length === 0 ? (
        <div style={{
          ...STYLES.card,
          textAlign: 'center',
          padding: '60px 20px',
          background: COLORS.veryLightGray
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ color: COLORS.dark, marginBottom: '8px' }}>No Payment Requests</h3>
          <p style={{ color: COLORS.darkGray, margin: 0 }}>
            {selectedFilter === 'all' 
              ? 'No payment proofs have been uploaded yet'
              : `No ${selectedFilter} payment requests`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {filteredRegistrations.map((registration) => (
            <div key={registration._id} style={STYLES.card}>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {/* Payment Proof Image */}
                <div style={{ flex: '0 0 300px' }}>
                  <img
                    src={registration.paymentProof}
                    alt="Payment proof"
                    style={{
                      width: '100%',
                      height: '300px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: `1px solid ${COLORS.lightGray}`,
                      background: COLORS.veryLightGray,
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(registration.paymentProof, '_blank')}
                  />
                  <p style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: COLORS.darkGray,
                    textAlign: 'center'
                  }}>
                    Click to view full size
                  </p>
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', color: COLORS.dark, fontSize: '20px' }}>
                        {registration.participantId?.firstName} {registration.participantId?.lastName}
                      </h3>
                      <p style={{ margin: '0 0 4px 0', color: COLORS.darkGray, fontSize: '14px' }}>
                        ✉️ {registration.participantId?.email}
                      </p>
                      <p style={{ margin: 0, color: COLORS.darkGray, fontSize: '14px' }}>
                        📅 Uploaded: {formatDate(registration.paymentProofUploadedAt)}
                      </p>
                    </div>
                    {getStatusBadge(registration.paymentApprovalStatus)}
                  </div>

                  <div style={{
                    background: COLORS.veryLightGray,
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                      <div>
                        <strong style={{ color: COLORS.darkGray }}>Amount:</strong> ₹{registration.paymentAmount}
                      </div>
                      <div>
                        <strong style={{ color: COLORS.darkGray }}>Ticket ID:</strong> {registration.ticketId || 'Not generated'}
                      </div>
                      <div>
                        <strong style={{ color: COLORS.darkGray }}>Registration ID:</strong> {registration._id.slice(-8)}
                      </div>
                      <div>
                        <strong style={{ color: COLORS.darkGray }}>Status:</strong> {registration.status}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Pending */}
                  {registration.paymentApprovalStatus === 'pending' && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleApprove(registration._id)}
                        style={{
                          ...STYLES.button,
                          background: COLORS.secondary,
                          flex: 1
                        }}
                      >
                        ✅ Approve Payment
                      </button>
                      <button
                        onClick={() => setRejectingId(registration._id)}
                        style={{
                          ...STYLES.button,
                          background: COLORS.accent,
                          flex: 1
                        }}
                      >
                        ❌ Reject Payment
                      </button>
                    </div>
                  )}

                  {/* Rejection Form */}
                  {rejectingId === registration._id && (
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      background: `${COLORS.accent}15`,
                      borderRadius: '8px'
                    }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                        Rejection Reason *
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a reason for rejection..."
                        rows="3"
                        style={{ ...STYLES.input, resize: 'vertical', marginBottom: '12px' }}
                      />
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => handleReject(registration._id)}
                          style={{
                            ...STYLES.button,
                            background: COLORS.accent,
                            flex: 1
                          }}
                        >
                          Confirm Rejection
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectionReason('');
                          }}
                          style={{
                            ...STYLES.button,
                            background: COLORS.lightGray,
                            color: COLORS.darkGray,
                            flex: 1
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show approval/rejection details */}
                  {registration.paymentApprovalStatus === 'approved' && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      background: `${COLORS.secondary}15`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: COLORS.secondary
                    }}>
                      ✅ Approved on {formatDate(registration.paymentApprovedAt)}
                    </div>
                  )}

                  {registration.paymentApprovalStatus === 'rejected' && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      background: `${COLORS.accent}15`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: COLORS.accent
                    }}>
                      <strong>❌ Rejected:</strong> {registration.paymentRejectionReason}
                      <br />
                      <small>{formatDate(registration.paymentApprovedAt)}</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentApprovals;
