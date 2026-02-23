import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import QrScanner from 'react-qr-scanner';
import { COLORS, STYLES } from '../constants/theme';

const QRScanner = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [ticketId, setTicketId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scannedParticipant, setScannedParticipant] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceReport();
  }, [eventId]);

  const fetchAttendanceReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/attendance/event/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReport(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report:', error);
      setLoading(false);
    }
  };

  const handleQRScan = (data) => {
    if (data) {
      setTicketId(data.text);
      setShowCamera(false);
      // Auto-submit after scanning
      scanTicket(data.text);
    }
  };

  const handleQRError = (err) => {
    console.error('QR Scanner error:', err);
    setError('Error accessing camera. Please check camera permissions.');
  };

  const scanTicket = async (scannedTicketId) => {
    if (!scannedTicketId || !scannedTicketId.trim()) {
      setError('Invalid ticket ID');
      return;
    }

    setScanning(true);
    setError('');
    setSuccess('');
    setScannedParticipant(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/attendance/scan`,
        { ticketId: scannedTicketId.trim(), scanMethod: 'qr-camera' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(response.data.message);
      setScannedParticipant(response.data.participant);
      setTicketId('');
      fetchAttendanceReport();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to scan ticket');
    } finally {
      setScanning(false);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    
    if (!ticketId.trim()) {
      setError('Please enter a ticket ID');
      return;
    }

    await scanTicket(ticketId);
  };

  const handleManualCheckIn = async (registrationId) => {
    if (!window.confirm('Manually mark attendance for this participant?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/attendance/manual`,
        { registrationId, notes: 'Manual check-in by organizer' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Attendance marked manually');
      fetchAttendanceReport();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const exportToCSV = () => {
    if (!report || !report.report) return;

    const headers = ['Ticket ID', 'Name', 'Email', 'Registration Date', 'Attended', 'Check-in Time', 'Scan Method'];
    const rows = report.report.map(item => [
      item.ticketId || 'N/A',
      item.participantName,
      item.participantEmail,
      new Date(item.registrationDate).toLocaleString(),
      item.attended ? 'Yes' : 'No',
      item.checkInTime ? new Date(item.checkInTime).toLocaleString() : 'N/A',
      item.scanMethod || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${eventId}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: COLORS.darkGray }}>Loading attendance data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
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
            📱 QR Scanner & Attendance
          </h1>
          <p style={{ color: COLORS.darkGray, margin: 0 }}>
            Scan participant tickets and track attendance
          </p>
        </div>
        <button
          onClick={exportToCSV}
          style={{
            ...STYLES.button,
            background: COLORS.secondary
          }}
        >
          📥 Export CSV
        </button>
      </div>

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
          <div>
            <p style={{ color: COLORS.secondary, margin: '0 0 8px 0', fontWeight: '600' }}>{success}</p>
            {scannedParticipant && (
              <p style={{ color: COLORS.darkGray, margin: 0, fontSize: '14px' }}>
                {scannedParticipant.name} ({scannedParticipant.email})
              </p>
            )}
          </div>
          <button onClick={() => setSuccess('')} style={{
            background: 'none',
            border: 'none',
            color: COLORS.secondary,
            fontSize: '20px',
            cursor: 'pointer'
          }}>×</button>
        </div>
      )}

      {/* Scanner */}
      <div style={{ ...STYLES.card, marginBottom: '32px', background: `linear-gradient(135deg, ${COLORS.primary}15, ${COLORS.secondary}15)` }}>
        <h2 style={{ margin: '0 0 24px 0', color: COLORS.dark, fontSize: '24px', fontWeight: '600' }}>
          🎫 Scan Ticket
        </h2>
        
        {/* Camera Scanner */}
        {showCamera ? (
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              background: COLORS.dark,
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <QrScanner
                delay={300}
                onError={handleQRError}
                onScan={handleQRScan}
                style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}
                constraints={{
                  video: { facingMode: 'environment' }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowCamera(false)}
                style={{
                  ...STYLES.button,
                  background: COLORS.accent
                }}
              >
                ✖️ Close Camera
              </button>
            </div>
            <p style={{ textAlign: 'center', color: COLORS.darkGray, fontSize: '14px', marginTop: '12px' }}>
              Point your camera at the QR code to scan
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <button
              onClick={() => setShowCamera(true)}
              style={{
                ...STYLES.button,
                background: COLORS.secondary,
                fontSize: '16px',
                padding: '14px 28px'
              }}
            >
              📷 Open Camera Scanner
            </button>
            <p style={{ color: COLORS.darkGray, fontSize: '14px', marginTop: '12px' }}>
              Or enter ticket ID manually below
            </p>
          </div>
        )}

        {/* Manual Entry */}
        <form onSubmit={handleScan}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Enter ticket ID manually..."
              style={{ ...STYLES.input, flex: 1 }}
            />
            <button
              type="submit"
              disabled={scanning}
              style={{
                ...STYLES.button,
                opacity: scanning ? 0.6 : 1,
                minWidth: '120px'
              }}
            >
              {scanning ? 'Scanning...' : '🔍 Scan'}
            </button>
          </div>
        </form>
        <p style={{ marginTop: '12px', fontSize: '14px', color: COLORS.darkGray }}>
          💡 Tip: Use a barcode scanner or type the ticket ID manually
        </p>
      </div>

      {/* Statistics */}
      {report && report.stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ ...STYLES.card, background: `linear-gradient(135deg, ${COLORS.primary}15, ${COLORS.primary}25)`, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', color: COLORS.primary, fontWeight: '600', marginBottom: '8px' }}>
              {report.stats.total}
            </div>
            <div style={{ color: COLORS.darkGray, fontSize: '14px' }}>Total Registrations</div>
          </div>
          <div style={{ ...STYLES.card, background: `linear-gradient(135deg, ${COLORS.secondary}15, ${COLORS.secondary}25)`, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', color: COLORS.secondary, fontWeight: '600', marginBottom: '8px' }}>
              {report.stats.attended}
            </div>
            <div style={{ color: COLORS.darkGray, fontSize: '14px' }}>Attended</div>
          </div>
          <div style={{ ...STYLES.card, background: `linear-gradient(135deg, ${COLORS.warning}15, ${COLORS.warning}25)`, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', color: COLORS.warning, fontWeight: '600', marginBottom: '8px' }}>
              {report.stats.notAttended}
            </div>
            <div style={{ color: COLORS.darkGray, fontSize: '14px' }}>Not Attended</div>
          </div>
          <div style={{ ...STYLES.card, background: `linear-gradient(135deg, ${COLORS.info}15, ${COLORS.info}25)`, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', color: COLORS.info, fontWeight: '600', marginBottom: '8px' }}>
              {report.stats.attendanceRate}%
            </div>
            <div style={{ color: COLORS.darkGray, fontSize: '14px' }}>Attendance Rate</div>
          </div>
        </div>
      )}

      {/* Attendance List */}
      {report && report.report && (
        <div style={STYLES.card}>
          <h2 style={{ margin: '0 0 24px 0', color: COLORS.dark, fontSize: '24px', fontWeight: '600' }}>
            📋 Attendance List
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: COLORS.veryLightGray }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${COLORS.lightGray}` }}>Ticket ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${COLORS.lightGray}` }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${COLORS.lightGray}` }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: `2px solid ${COLORS.lightGray}` }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${COLORS.lightGray}` }}>Check-in Time</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: `2px solid ${COLORS.lightGray}` }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {report.report.map((item) => (
                  <tr key={item.registrationId} style={{ borderBottom: `1px solid ${COLORS.veryLightGray}` }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
                      {item.ticketId || 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>{item.participantName}</td>
                    <td style={{ padding: '12px', color: COLORS.darkGray, fontSize: '14px' }}>
                      {item.participantEmail}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {item.attended ? (
                        <span style={{
                          background: `${COLORS.secondary}15`,
                          color: COLORS.secondary,
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          ✅ Present
                        </span>
                      ) : (
                        <span style={{
                          background: `${COLORS.lightGray}`,
                          color: COLORS.darkGray,
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          ⏳ Absent
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: COLORS.darkGray }}>
                      {item.checkInTime ? new Date(item.checkInTime).toLocaleString() : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {!item.attended && (
                        <button
                          onClick={() => handleManualCheckIn(item.registrationId)}
                          style={{
                            ...STYLES.button,
                            padding: '6px 12px',
                            fontSize: '13px',
                            background: COLORS.warning
                          }}
                        >
                          Manual Check-in
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
