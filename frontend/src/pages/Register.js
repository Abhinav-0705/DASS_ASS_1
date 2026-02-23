import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerParticipant } from '../services/authService';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    participantType: 'iiit',
    collegeOrOrgName: '',
    contactNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Contact number validation
    if (!/^[0-9]{10}$/.test(formData.contactNumber)) {
      setError('Contact number must be exactly 10 digits');
      return;
    }

    // IIIT email validation
    if (formData.participantType === 'iiit') {
      const isIIITEmail =
        formData.email.endsWith('@iiit.ac.in') ||
        formData.email.endsWith('@students.iiit.ac.in');
      
      if (!isIIITEmail) {
        setError('IIIT participants must use IIIT-issued email ID');
        return;
      }
    }

    setLoading(true);

    try {
      const data = await registerParticipant({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        participantType: formData.participantType,
        collegeOrOrgName: formData.collegeOrOrgName,
        contactNumber: formData.contactNumber,
      });

      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect to dashboard
        navigate('/participant/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register as Participant</h2>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="participantType">Participant Type</label>
          <select
            id="participantType"
            name="participantType"
            value={formData.participantType}
            onChange={handleChange}
            required
          >
            <option value="iiit">IIIT Student</option>
            <option value="non-iiit">Non-IIIT Participant</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="collegeOrOrgName">
            {formData.participantType === 'iiit' ? 'College Name' : 'College/Organization Name'}
          </label>
          <input
            type="text"
            id="collegeOrOrgName"
            name="collegeOrOrgName"
            value={formData.collegeOrOrgName}
            onChange={handleChange}
            placeholder="e.g., IIIT Hyderabad"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="contactNumber">Contact Number</label>
          <input
            type="tel"
            id="contactNumber"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            maxLength="10"
            pattern="[0-9]{10}"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email {formData.participantType === 'iiit' && '(IIIT Email Required)'}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={
              formData.participantType === 'iiit'
                ? 'example@iiit.ac.in'
                : 'your@email.com'
            }
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <div className="auth-links">
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
