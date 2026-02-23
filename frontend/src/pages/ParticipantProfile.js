import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { COLORS, STYLES } from '../constants/theme';

const ParticipantProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    participantType: '',
    college: '',
    contactNumber: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await api.get('/participant/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Backend returns { success: true, user }
      const userData = response.data.user || response.data;
      
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        participantType: userData.participantType || '',
        college: userData.collegeOrOrgName || '',
        contactNumber: userData.contactNumber || ''
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to fetch profile data');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      
      await api.put('/participant/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setSaving(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      
      await api.put(
        '/participant/profile/password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
      setChangingPassword(false);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.message || 'Failed to change password');
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.info} 100%)`,
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: COLORS.white, fontSize: '18px' }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.info} 100%)`,
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ color: COLORS.white, fontSize: '36px', margin: '0 0 10px 0' }}>
            👤 My Profile
          </h1>
          <p style={{ color: COLORS.white, fontSize: '16px', opacity: 0.9 }}>
            Manage your account information
          </p>
        </div>

        {/* Alerts */}
        {success && (
          <div style={{
            ...STYLES.card,
            marginBottom: '20px',
            padding: '15px',
            background: '#d4edda',
            border: `1px solid #c3e6cb`,
            color: '#155724',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>✅ {success}</span>
            <button
              onClick={() => setSuccess('')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#155724'
              }}
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div style={{
            ...STYLES.card,
            marginBottom: '20px',
            padding: '15px',
            background: '#f8d7da',
            border: `1px solid #f5c6cb`,
            color: '#721c24',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>❌ {error}</span>
            <button
              onClick={() => setError('')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#721c24'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Profile Information Card */}
        <div style={{ ...STYLES.card, marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px'
          }}>
            <h2 style={{ margin: 0, color: COLORS.primary, fontSize: '24px' }}>
              Profile Information
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  ...STYLES.button,
                  background: COLORS.primary,
                  padding: '8px 20px'
                }}
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* First Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    ...STYLES.input,
                    background: isEditing ? COLORS.white : COLORS.veryLightGray
                  }}
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    ...STYLES.input,
                    background: isEditing ? COLORS.white : COLORS.veryLightGray
                  }}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  disabled
                  style={{
                    ...STYLES.input,
                    background: COLORS.veryLightGray,
                    cursor: 'not-allowed'
                  }}
                />
                <small style={{ color: COLORS.darkGray, fontSize: '12px' }}>
                  Email cannot be changed
                </small>
              </div>

              {/* Participant Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                  Participant Type
                </label>
                <select
                  name="participantType"
                  value={profileData.participantType}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    ...STYLES.input,
                    background: isEditing ? COLORS.white : COLORS.veryLightGray
                  }}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="iiit">IIIT Student</option>
                  <option value="non-iiit">External Participant</option>
                </select>
              </div>

              {/* College */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                  College
                </label>
                <input
                  type="text"
                  name="college"
                  value={profileData.college}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    ...STYLES.input,
                    background: isEditing ? COLORS.white : COLORS.veryLightGray
                  }}
                  required
                />
              </div>

              {/* Contact Number */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={profileData.contactNumber}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  style={{
                    ...STYLES.input,
                    background: isEditing ? COLORS.white : COLORS.veryLightGray
                  }}
                  required
                />
              </div>
            </div>

            {isEditing && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...STYLES.button,
                    background: COLORS.secondary,
                    flex: 1,
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile(); // Reset to original data
                  }}
                  style={{
                    ...STYLES.button,
                    background: COLORS.lightGray,
                    color: COLORS.dark,
                    flex: 1
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Change Password Card */}
        <div style={{ ...STYLES.card }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, color: COLORS.primary, fontSize: '24px' }}>
              Change Password
            </h2>
            {!showPasswordSection && (
              <button
                onClick={() => setShowPasswordSection(true)}
                style={{
                  ...STYLES.button,
                  background: COLORS.warning,
                  padding: '8px 20px'
                }}
              >
                🔒 Change Password
              </button>
            )}
          </div>

          {showPasswordSection && (
            <form onSubmit={handleChangePassword}>
              <div style={{ display: 'grid', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    style={STYLES.input}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    style={STYLES.input}
                    required
                    minLength="6"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: COLORS.dark, fontWeight: '500' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    style={STYLES.input}
                    required
                    minLength="6"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="submit"
                  disabled={changingPassword}
                  style={{
                    ...STYLES.button,
                    background: COLORS.secondary,
                    flex: 1,
                    opacity: changingPassword ? 0.6 : 1
                  }}
                >
                  {changingPassword ? 'Changing...' : '🔐 Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  style={{
                    ...STYLES.button,
                    background: COLORS.lightGray,
                    color: COLORS.dark,
                    flex: 1
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!showPasswordSection && (
            <p style={{ color: COLORS.darkGray, fontSize: '14px', margin: 0 }}>
              Keep your account secure by changing your password regularly
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantProfile;
