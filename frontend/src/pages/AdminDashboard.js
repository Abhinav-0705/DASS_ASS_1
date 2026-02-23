import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createOrganizer,
  getOrganizers,
  deleteOrganizer,
  resetOrganizerPassword,
  getParticipants,
} from '../services/adminService';
import { COLORS, STYLES, getStatusBadge } from '../constants/theme';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [organizers, setOrganizers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newOrganizer, setNewOrganizer] = useState({
    organizerName: '',
    email: '',
    password: '',
    category: 'club',
    description: '',
    contactEmail: '',
  });

  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [organizersData, participantsData] = await Promise.all([
        getOrganizers(),
        getParticipants(),
      ]);
      setOrganizers(organizersData.organizers);
      setParticipants(participantsData.participants);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch data');
      setLoading(false);
    }
  };

  const handleCreateOrganizer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await createOrganizer(newOrganizer);
      setSuccess('Organizer created successfully');
      setShowCreateModal(false);
      setNewOrganizer({
        organizerName: '',
        email: '',
        password: '',
        category: 'club',
        description: '',
        contactEmail: '',
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create organizer');
    }
  };

  const handleDeleteOrganizer = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this organizer?')) {
      try {
        await deleteOrganizer(id);
        setSuccess('Organizer deactivated successfully');
        fetchData();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete organizer');
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (resetPasswordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await resetOrganizerPassword(selectedOrganizer._id, resetPasswordData.newPassword);
      setSuccess('Password reset successfully');
      setShowResetPasswordModal(false);
      setResetPasswordData({ newPassword: '', confirmPassword: '' });
      setSelectedOrganizer(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
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
        Loading dashboard...
      </div>
    );
  }

  // Calculate statistics
  const activeOrganizers = organizers.filter(org => org.isActive).length;
  const inactiveOrganizers = organizers.filter(org => !org.isActive).length;
  const iiitParticipants = participants.filter(p => p.participantType === 'iiit').length;
  const nonIiitParticipants = participants.filter(p => p.participantType !== 'iiit').length;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: COLORS.background,
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ 
          ...STYLES.card,
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', color: COLORS.dark, fontSize: '32px' }}>
                Admin Dashboard
              </h2>
              <p style={{ margin: 0, color: COLORS.darkGray, fontSize: '16px' }}>
                Welcome back, {user?.name}
              </p>
            </div>
            <Link
              to="/admin/password-resets"
              style={{
                ...STYLES.button,
                background: COLORS.secondary,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              🔐 Password Reset Requests
            </Link>
          </div>
        </div>

        {/* Alert Messages */}
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
        {success && (
          <div style={{ 
            background: '#f0fdf4',
            color: COLORS.secondary,
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: `1px solid ${COLORS.secondary}`,
          }}>
            {success}
          </div>
        )}

        {/* Statistics Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            ...STYLES.card,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            color: COLORS.white
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Organizers</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{organizers.length}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
              {activeOrganizers} active, {inactiveOrganizers} inactive
            </div>
          </div>

          <div style={{ 
            ...STYLES.card,
            background: `linear-gradient(135deg, ${COLORS.info}, ${COLORS.primary})`,
            color: COLORS.white
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Participants</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{participants.length}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
              {iiitParticipants} IIIT, {nonIiitParticipants} Non-IIIT
            </div>
          </div>

          <div style={{ 
            ...STYLES.card,
            background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.secondaryDark})`,
            color: COLORS.white
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Active Organizers</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{activeOrganizers}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
              {((activeOrganizers / organizers.length) * 100 || 0).toFixed(0)}% of total
            </div>
          </div>

          <div style={{ 
            ...STYLES.card,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
            color: COLORS.white
          }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>IIIT Students</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{iiitParticipants}</div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
              {((iiitParticipants / participants.length) * 100 || 0).toFixed(0)}% of participants
            </div>
          </div>
        </div>

        {/* Organizers Section */}
        <div style={{ 
          ...STYLES.card,
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: COLORS.dark, fontSize: '24px' }}>
              Organizers ({organizers.length})
            </h3>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                ...STYLES.button,
                background: COLORS.primary,
                color: COLORS.white,
              }}
            >
              + Create Organizer
            </button>
          </div>

          {organizers.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.lightGray}` }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Organizer Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Contact Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizers.map((org) => (
                    <tr key={org._id} style={{ borderBottom: `1px solid ${COLORS.veryLightGray}` }}>
                      <td style={{ padding: '12px', fontWeight: '500', color: COLORS.dark }}>
                        {org.organizerName || org.name}
                      </td>
                      <td style={{ padding: '12px', color: COLORS.darkGray, fontSize: '14px' }}>{org.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          background: org.category === 'club' ? '#e3f2fd' : 
                                     org.category === 'council' ? '#f3e5f5' :
                                     org.category === 'fest_team' ? '#fff3e0' : '#e0f2f1',
                          color: org.category === 'club' ? '#1976d2' : 
                                 org.category === 'council' ? '#7b1fa2' :
                                 org.category === 'fest_team' ? '#f57c00' : '#00796b',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {org.category || org.organizationType}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: COLORS.darkGray, fontSize: '14px' }}>{org.contactEmail || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={getStatusBadge(org.isActive ? 'confirmed' : 'cancelled')}>
                          {org.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedOrganizer(org);
                              setShowResetPasswordModal(true);
                            }}
                            style={{
                              ...STYLES.button,
                              padding: '6px 12px',
                              background: COLORS.info,
                              color: COLORS.white,
                              fontSize: '12px',
                            }}
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleDeleteOrganizer(org._id)}
                            disabled={!org.isActive}
                            style={{
                              ...STYLES.button,
                              padding: '6px 12px',
                              background: org.isActive ? COLORS.accent : COLORS.lightGray,
                              color: COLORS.white,
                              fontSize: '12px',
                              cursor: org.isActive ? 'pointer' : 'not-allowed',
                              opacity: org.isActive ? 1 : 0.5,
                            }}
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: COLORS.darkGray }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏢</div>
              <p>No organizers found. Click "Create Organizer" to add one!</p>
            </div>
          )}
        </div>

        {/* Participants Section */}
        <div style={{ 
          ...STYLES.card,
          marginBottom: '24px',
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: COLORS.dark, fontSize: '24px' }}>
            Participants ({participants.length})
          </h3>

          {participants.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.lightGray}` }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>College/Org</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Contact</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: COLORS.darkGray, fontWeight: '600' }}>Registered On</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant) => (
                    <tr key={participant._id} style={{ borderBottom: `1px solid ${COLORS.veryLightGray}` }}>
                      <td style={{ padding: '12px', fontWeight: '500', color: COLORS.dark }}>
                        {participant.firstName && participant.lastName 
                          ? `${participant.firstName} ${participant.lastName}` 
                          : participant.name}
                      </td>
                      <td style={{ padding: '12px', color: COLORS.darkGray, fontSize: '14px' }}>{participant.email}</td>
                      <td style={{ padding: '12px', color: COLORS.darkGray, fontSize: '14px' }}>{participant.collegeOrOrgName || '-'}</td>
                      <td style={{ padding: '12px', color: COLORS.darkGray, fontSize: '14px' }}>{participant.contactNumber || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          background: participant.participantType === 'iiit' ? '#e3f2fd' : '#fff3e0',
                          color: participant.participantType === 'iiit' ? '#1976d2' : '#f57c00',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}>
                          {participant.participantType === 'iiit' ? 'IIIT' : 'Non-IIIT'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={getStatusBadge(participant.isActive ? 'confirmed' : 'cancelled')}>
                          {participant.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: COLORS.darkGray, fontSize: '14px' }}>
                        {new Date(participant.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: COLORS.darkGray }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
              <p>No participants registered yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Organizer Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: COLORS.white,
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ 
              margin: '0 0 24px 0', 
              color: COLORS.primary,
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Create Organizer Account
            </h3>
            <form onSubmit={handleCreateOrganizer}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500', fontSize: '14px' }}>
                  Organizer Name
                </label>
                <input
                  type="text"
                  value={newOrganizer.organizerName}
                  onChange={(e) =>
                    setNewOrganizer({ ...newOrganizer, organizerName: e.target.value })
                  }
                  placeholder="e.g., Tech Club IIIT"
                  required
                  style={STYLES.input}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500', fontSize: '14px' }}>
                  Category
                </label>
                <select
                  value={newOrganizer.category}
                  onChange={(e) =>
                    setNewOrganizer({
                      ...newOrganizer,
                      category: e.target.value,
                    })
                  }
                  required
                  style={STYLES.input}
                >
                  <option value="club">Club</option>
                  <option value="council">Council</option>
                  <option value="fest_team">Fest Team</option>
                  <option value="department">Department</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500', fontSize: '14px' }}>
                  Description
                </label>
                <textarea
                  value={newOrganizer.description}
                  onChange={(e) =>
                    setNewOrganizer({ ...newOrganizer, description: e.target.value })
                  }
                  placeholder="Describe the organizer's purpose and activities"
                  rows="3"
                  required
                  style={{ ...STYLES.input, resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500', fontSize: '14px' }}>
                  Login Email
                </label>
                <input
                  type="email"
                  value={newOrganizer.email}
                  onChange={(e) =>
                    setNewOrganizer({ ...newOrganizer, email: e.target.value })
                  }
                  placeholder="Login email for the organizer"
                  required
                  style={STYLES.input}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500', fontSize: '14px' }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  value={newOrganizer.contactEmail}
                  onChange={(e) =>
                    setNewOrganizer({ ...newOrganizer, contactEmail: e.target.value })
                  }
                  placeholder="Public contact email"
                  required
                  style={STYLES.input}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500', fontSize: '14px' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={newOrganizer.password}
                  onChange={(e) =>
                    setNewOrganizer({ ...newOrganizer, password: e.target.value })
                  }
                  minLength="6"
                  required
                  style={STYLES.input}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    ...STYLES.button,
                    background: COLORS.lightGray,
                    color: COLORS.darkGray,
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    flex: 1,
                    ...STYLES.button,
                    background: COLORS.primary,
                    color: COLORS.white,
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: COLORS.white,
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ 
              margin: '0 0 24px 0', 
              color: COLORS.info,
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Reset Password
            </h3>
            <p style={{ 
              color: COLORS.darkGray, 
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              Reset password for: <strong style={{ color: COLORS.dark }}>{selectedOrganizer?.name || selectedOrganizer?.organizerName}</strong>
            </p>
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500', fontSize: '14px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={resetPasswordData.newPassword}
                  onChange={(e) =>
                    setResetPasswordData({
                      ...resetPasswordData,
                      newPassword: e.target.value,
                    })
                  }
                  required
                  style={STYLES.input}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: COLORS.dark, fontWeight: '500', fontSize: '14px' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={resetPasswordData.confirmPassword}
                  onChange={(e) =>
                    setResetPasswordData({
                      ...resetPasswordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  style={STYLES.input}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setResetPasswordData({ newPassword: '', confirmPassword: '' });
                    setSelectedOrganizer(null);
                  }}
                  style={{
                    flex: 1,
                    ...STYLES.button,
                    background: COLORS.lightGray,
                    color: COLORS.darkGray,
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    flex: 1,
                    ...STYLES.button,
                    background: COLORS.info,
                    color: COLORS.white,
                  }}
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
