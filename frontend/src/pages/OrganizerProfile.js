import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { COLORS, STYLES } from '../constants/theme';

const OrganizerProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [formData, setFormData] = useState({
    organizerName: '',
    category: 'club',
    description: '',
    contactEmail: '',
    contactNumber: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizers/profile');
      const profile = response.data.organizer;
      setFormData({
        organizerName: profile.organizerName || profile.name,
        category: profile.category || profile.organizationType,
        description: profile.description || '',
        contactEmail: profile.contactEmail || '',
        contactNumber: profile.contactNumber || '',
      });
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch profile');
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/organizers/profile', formData);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      updateUser(response.data.organizer);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await api.put('/organizers/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
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
        Loading profile...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: COLORS.background,
      padding: '24px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          ...STYLES.card,
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', color: COLORS.dark, fontSize: '28px' }}>
                Organizer Profile
              </h2>
              <p style={{ margin: 0, color: COLORS.darkGray }}>
                Manage your organization information and settings
              </p>
            </div>
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

        {/* Profile Form */}
        <div style={{ ...STYLES.card, marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, color: COLORS.dark, fontSize: '20px' }}>
              Organization Information
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  ...STYLES.button,
                  background: COLORS.primary,
                  color: COLORS.white,
                }}
              >
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleUpdate}>
            {/* Login Email (Non-editable) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                Login Email (Cannot be changed)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                style={{
                  ...STYLES.input,
                  background: COLORS.veryLightGray,
                  color: COLORS.darkGray,
                  cursor: 'not-allowed',
                }}
              />
            </div>

            {/* Organization Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                Organization Name *
              </label>
              <input
                type="text"
                value={formData.organizerName}
                onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                disabled={!isEditing}
                required
                style={{
                  ...STYLES.input,
                  background: isEditing ? COLORS.white : COLORS.veryLightGray,
                  cursor: isEditing ? 'text' : 'not-allowed',
                }}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={!isEditing}
                required
                style={{
                  ...STYLES.input,
                  background: isEditing ? COLORS.white : COLORS.veryLightGray,
                  cursor: isEditing ? 'pointer' : 'not-allowed',
                }}
              >
                <option value="club">Club</option>
                <option value="council">Council</option>
                <option value="fest_team">Fest Team</option>
                <option value="department">Department</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!isEditing}
                required
                rows="4"
                style={{
                  ...STYLES.input,
                  background: isEditing ? COLORS.white : COLORS.veryLightGray,
                  cursor: isEditing ? 'text' : 'not-allowed',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Contact Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                Contact Email *
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                disabled={!isEditing}
                required
                style={{
                  ...STYLES.input,
                  background: isEditing ? COLORS.white : COLORS.veryLightGray,
                  cursor: isEditing ? 'text' : 'not-allowed',
                }}
              />
            </div>

            {/* Contact Number */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                Contact Number
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                disabled={!isEditing}
                style={{
                  ...STYLES.input,
                  background: isEditing ? COLORS.white : COLORS.veryLightGray,
                  cursor: isEditing ? 'text' : 'not-allowed',
                }}
              />
            </div>

            {isEditing && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile();
                  }}
                  style={{
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
                    ...STYLES.button,
                    background: COLORS.primary,
                    color: COLORS.white,
                  }}
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Security Section */}
        <div style={{ ...STYLES.card }}>
          <h3 style={{ margin: '0 0 16px 0', color: COLORS.dark, fontSize: '20px' }}>
            Security
          </h3>
          <button
            onClick={() => setShowPasswordModal(true)}
            style={{
              ...STYLES.button,
              background: COLORS.accent,
              color: COLORS.white,
            }}
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
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
          zIndex: 1000,
        }}>
          <div style={{
            background: COLORS.white,
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          }}>
            <h3 style={{ margin: '0 0 24px 0', color: COLORS.dark, fontSize: '24px' }}>
              Change Password
            </h3>
            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  style={STYLES.input}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength="6"
                  style={STYLES.input}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  style={STYLES.input}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  style={{
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
                    ...STYLES.button,
                    background: COLORS.accent,
                    color: COLORS.white,
                  }}
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerProfile;
