import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { COLORS, STYLES } from '../constants/theme';

const PaymentProofUpload = ({ registrationId, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;

        const token = localStorage.getItem('token');
        await axios.post(
          `${API_BASE_URL}/api/registrations/${registrationId}/upload-payment-proof`,
          { paymentProof: base64String },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (onSuccess) onSuccess();
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload payment proof');
      setLoading(false);
    }
  };

  return (
    <div style={{
      ...STYLES.card,
      background: `linear-gradient(135deg, ${COLORS.warning}15, ${COLORS.secondary}15)`,
      border: `2px dashed ${COLORS.warning}`
    }}>
      <h3 style={{ color: COLORS.dark, marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>
        💳 Upload Payment Proof
      </h3>
      <p style={{ color: COLORS.darkGray, marginBottom: '24px', fontSize: '14px' }}>
        Please upload a screenshot or photo of your payment transaction
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

      {/* File Input */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          width: '100%',
          padding: '40px 20px',
          border: `2px dashed ${COLORS.lightGray}`,
          borderRadius: '12px',
          textAlign: 'center',
          cursor: 'pointer',
          background: COLORS.white,
          transition: 'all 0.3s'
        }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📸</div>
          <div style={{ color: COLORS.dark, fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
            {selectedFile ? selectedFile.name : 'Click to select payment proof'}
          </div>
          <div style={{ color: COLORS.darkGray, fontSize: '14px' }}>
            Supports: JPG, PNG, JPEG (Max 5MB)
          </div>
        </label>
      </div>

      {/* Preview */}
      {preview && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: COLORS.dark, fontWeight: '500', marginBottom: '12px' }}>Preview:</p>
          <img
            src={preview}
            alt="Payment proof preview"
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'contain',
              borderRadius: '8px',
              border: `1px solid ${COLORS.lightGray}`
            }}
          />
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        style={{
          ...STYLES.button,
          width: '100%',
          background: selectedFile && !loading ? COLORS.secondary : COLORS.lightGray,
          opacity: !selectedFile || loading ? 0.6 : 1,
          cursor: !selectedFile || loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Uploading...' : 'Submit Payment Proof'}
      </button>

      <p style={{
        marginTop: '16px',
        fontSize: '12px',
        color: COLORS.darkGray,
        textAlign: 'center'
      }}>
        ⚠️ Your order will be pending approval until the organizer verifies your payment
      </p>
    </div>
  );
};

export default PaymentProofUpload;
