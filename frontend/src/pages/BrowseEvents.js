import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const BrowseEvents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, normal, merchandise
  const [filterEligibility, setFilterEligibility] = useState('all'); // all, iiit_only, external_only, eligible
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFollowedOnly, setShowFollowedOnly] = useState(false);
  
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);

  useEffect(() => {
    fetchEvents();
    fetchTrendingEvents();
    fetchFollowedOrganizers();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await api.get('/events', {
        params: {
          status: 'published',
          limit: 100
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter events that haven't passed registration deadline
      const now = new Date();
      const available = response.data.events.filter(event => 
        new Date(event.registrationDeadline) > now
      );

      setEvents(available);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const fetchTrendingEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get events created/published in last 24 hours, sorted by registration count
      const response = await api.get('/events', {
        params: {
          status: 'published',
          limit: 100
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recent = response.data.events
        .filter(event => new Date(event.createdAt) >= last24h)
        .sort((a, b) => b.currentRegistrations - a.currentRegistrations)
        .slice(0, 5);

      setTrendingEvents(recent);
    } catch (err) {
      console.error('Error fetching trending events:', err);
    }
  };

  const fetchFollowedOrganizers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/participant/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.user.preferences?.followedOrganizers) {
        // Extract the IDs from the followed organizers
        const ids = response.data.user.preferences.followedOrganizers.map(org => 
          typeof org === 'string' ? org : org._id
        );
        setFollowedOrganizers(ids);
      }
    } catch (err) {
      console.error('Error fetching followed organizers:', err);
    }
  };

  // Apply filters
  const getFilteredEvents = () => {
    let filtered = [...events];

    // Search filter (fuzzy matching on event name and organizer name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => {
        const eventName = event.eventName?.toLowerCase() || '';
        const organizerName = event.organizerId?.organizerName?.toLowerCase() || '';
        
        // Simple fuzzy matching - check if search terms appear in name
        const searchTerms = query.split(' ');
        return searchTerms.some(term => 
          eventName.includes(term) || organizerName.includes(term)
        );
      });
    }

    // Event type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.eventType === filterType);
    }

    // Eligibility filter
    if (filterEligibility !== 'all') {
      if (filterEligibility === 'eligible') {
        // Show events user is eligible for
        filtered = filtered.filter(event => {
          if (event.eligibility === 'all') return true;
          if (event.eligibility === 'iiit_only' && user.participantType === 'iiit') return true;
          if (event.eligibility === 'external_only' && user.participantType !== 'iiit') return true;
          return false;
        });
      } else {
        filtered = filtered.filter(event => event.eligibility === filterEligibility);
      }
    }

    // Date range filter
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      filtered = filtered.filter(event => new Date(event.eventStartDate) >= fromDate);
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      filtered = filtered.filter(event => new Date(event.eventStartDate) <= toDate);
    }

    // Followed clubs filter
    if (showFollowedOnly && followedOrganizers.length > 0) {
      filtered = filtered.filter(event => {
        const orgId = event.organizerId?._id || event.organizerId;
        return followedOrganizers.includes(orgId);
      });
    }

    return filtered;
  };

  const filteredEvents = getFilteredEvents();

  const handleEventClick = (eventId) => {
    navigate(`/participant/event/${eventId}`);
  };

  const handleOrganizerClick = (organizerId) => {
    navigate(`/participant/club/${organizerId}`);
  };

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', padding: '20px' }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '15px', 
        padding: '30px', 
        marginBottom: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#667eea', fontSize: '32px' }}>🔍 Browse Events</h2>
        <p style={{ color: '#666', fontSize: '16px' }}>Discover and register for upcoming events</p>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Trending Events */}
      {trendingEvents.length > 0 && (
        <div style={{ 
          marginBottom: '30px', 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: 'white', fontSize: '24px' }}>
            🔥 Trending Events (Last 24 hours)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {trendingEvents.map(event => (
              <div 
                key={event._id}
                style={{
                  padding: '20px',
                  background: 'white',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onClick={() => handleEventClick(event._id)}
              >
                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>{event.eventName}</h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                  <strong>{event.organizerId?.organizerName}</strong>
                </p>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#999' }}>
                  🎫 {event.currentRegistrations} registrations
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ 
        marginBottom: '20px',
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#667eea', fontSize: '20px' }}>🎯 Search & Filters</h3>
        
        {/* Search */}
        <div className="form-group">
          <label>Search Events or Organizers</label>
          <input
            type="text"
            placeholder="Search by event name or organizer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                // Trigger re-render by setting search query
                setSearchQuery(e.target.value);
              }
            }}
          />
        </div>

        {/* Filters Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
          <div className="form-group">
            <label>Event Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="normal">Normal Events</option>
              <option value="merchandise">Merchandise</option>
            </select>
          </div>

          <div className="form-group">
            <label>Eligibility</label>
            <select value={filterEligibility} onChange={(e) => setFilterEligibility(e.target.value)}>
              <option value="all">All Events</option>
              <option value="eligible">Eligible for Me</option>
              <option value="iiit_only">IIIT Only</option>
              <option value="external_only">External Only</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '25px' }}>
              <input
                type="checkbox"
                checked={showFollowedOnly}
                onChange={(e) => setShowFollowedOnly(e.target.checked)}
              />
              Followed Clubs Only
            </label>
          </div>
        </div>

        {/* Date Range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
          <div className="form-group">
            <label>From Date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>To Date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              // Force re-render with current filters
              setSearchQuery(searchQuery);
            }}
            style={{ 
              flex: 1,
              padding: '12px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#5568d3'}
            onMouseOut={(e) => e.target.style.background = '#667eea'}
          >
            🔍 Search Events
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
              setFilterEligibility('all');
              setFilterDateFrom('');
              setFilterDateTo('');
              setShowFollowedOnly(false);
            }}
            style={{ 
              flex: 1,
              padding: '12px',
              background: '#e0e0e0',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#d0d0d0'}
            onMouseOut={(e) => e.target.style.background = '#e0e0e0'}
          >
            ✖️ Clear All Filters
          </button>
        </div>
      </div>

      {/* Events List */}
      <div style={{ 
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#667eea', fontSize: '20px' }}>
          🎪 All Events ({filteredEvents.length})
        </h3>
        
        {showFollowedOnly && followedOrganizers.length === 0 && (
          <div style={{
            padding: '20px',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            color: '#856404',
            marginBottom: '20px'
          }}>
            <strong>ℹ️ No followed clubs:</strong> You haven't followed any clubs yet. Go to the <span 
              onClick={() => navigate('/participant/clubs')}
              style={{ color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}
            >Clubs page</span> to follow clubs and see their events here.
          </div>
        )}
        
        {filteredEvents.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Type</th>
                <th>Organizer</th>
                <th>Eligibility</th>
                <th>Start Date</th>
                <th>Deadline</th>
                <th>Spots Left</th>
                <th>Fee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => {
                const spotsLeft = event.registrationLimit - event.currentRegistrations;
                const isEligible = 
                  event.eligibility === 'all' ||
                  (event.eligibility === 'iiit_only' && user.participantType === 'iiit') ||
                  (event.eligibility === 'external_only' && user.participantType !== 'iiit');

                return (
                  <tr key={event._id}>
                    <td>
                      <span 
                        style={{ color: '#2196F3', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => handleEventClick(event._id)}
                      >
                        {event.eventName}
                      </span>
                    </td>
                    <td>{event.eventType}</td>
                    <td>
                      <span 
                        style={{ color: '#4CAF50', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => handleOrganizerClick(event.organizerId?._id)}
                      >
                        {event.organizerId?.organizerName || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {event.eligibility === 'all' ? 'All' : 
                       event.eligibility === 'iiit_only' ? 'IIIT Only' : 'External Only'}
                      {!isEligible && <span style={{ color: 'red', marginLeft: '5px' }}>⚠️</span>}
                    </td>
                    <td>{new Date(event.eventStartDate).toLocaleDateString()}</td>
                    <td>{new Date(event.registrationDeadline).toLocaleDateString()}</td>
                    <td>
                      <span style={{ color: spotsLeft < 10 ? 'red' : 'green' }}>
                        {spotsLeft}/{event.registrationLimit}
                      </span>
                    </td>
                    <td>₹{event.registrationFee}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleEventClick(event._id)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ marginTop: '20px' }}>
            {searchQuery || filterType !== 'all' || filterEligibility !== 'all' || filterDateFrom || filterDateTo || showFollowedOnly
              ? 'No events match your filters.'
              : 'No events available at the moment.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default BrowseEvents;
