import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COLORS, STYLES } from '../constants/theme';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);

    if (!result.success) {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.info} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        ...STYLES.card,
        maxWidth: '440px',
        width: '100%',
        padding: '48px 40px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            margin: '0 0 8px 0',
            fontSize: '32px',
            fontWeight: '600',
            color: COLORS.dark,
          }}>
            Welcome Back
          </h1>
          <p style={{ 
            margin: 0,
            color: COLORS.darkGray,
            fontSize: '15px'
          }}>
            Sign in to continue to Felicity
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ 
            background: '#fef2f2',
            color: COLORS.accent,
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: `1px solid ${COLORS.accent}`,
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.accent,
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0 8px',
                fontWeight: 'bold',
              }}
            >
              ×
            </button>
          </div>
        )}
      
        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              color: COLORS.dark,
              fontWeight: '500',
              fontSize: '14px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              style={{
                ...STYLES.input,
                fontSize: '15px',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              color: COLORS.dark,
              fontWeight: '500',
              fontSize: '14px'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              style={{
                ...STYLES.input,
                fontSize: '15px',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...STYLES.button,
              width: '100%',
              background: loading ? COLORS.lightGray : COLORS.primary,
              color: COLORS.white,
              fontSize: '16px',
              fontWeight: '600',
              padding: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '28px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: COLORS.lightGray }}></div>
          <span style={{ 
            padding: '0 16px',
            color: COLORS.darkGray,
            fontSize: '13px',
            fontWeight: '500'
          }}>
            OR
          </span>
          <div style={{ flex: 1, height: '1px', background: COLORS.lightGray }}></div>
        </div>

        {/* Register Link */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ 
            margin: 0,
            color: COLORS.darkGray,
            fontSize: '14px'
          }}>
            Don't have an account?{' '}
            <Link 
              to="/register"
              style={{ 
                color: COLORS.primary,
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Create Account
            </Link>
          </p>
        </div>

        {/* Footer Note */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: COLORS.veryLightGray,
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: COLORS.darkGray,
            lineHeight: '1.5'
          }}>
            <strong>Test Credentials:</strong><br />
            Admin: admin@felicity.iiit.ac.in / Admin@123456
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
