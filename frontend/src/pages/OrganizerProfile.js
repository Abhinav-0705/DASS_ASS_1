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

  const [formData, setFormData] = useState({
    organizerName: '',
    category: 'club',
    description: '',
    contactEmail: '',
    contactNumber: '',
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
          <p style={{ color: COLORS.darkGray, margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.6' }}>
            To reset your password, please use the <strong>Password Reset Request</strong> option.
            Your request will be reviewed by an administrator, and a new password will be sent to your registered email.
          </p>
          <div style={{
            padding: '12px 16px',
            background: `${COLORS.info}15`,
            border: `1px solid ${COLORS.info}`,
            borderRadius: '8px',
            color: COLORS.info,
            fontSize: '14px',
          }}>
            🔒 Password changes are managed by the admin for security purposes.
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerProfile;
