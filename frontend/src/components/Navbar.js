import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('${API_BASE_URL}/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // silent fail
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user && (user.role === 'participant' || user.role === 'organizer')) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch('${API_BASE_URL}/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleNotifClick = async (notif) => {
    try {
      if (!notif.isRead) {
        const token = localStorage.getItem('token');
        await axios.patch(`${API_BASE_URL}/api/notifications/${notif._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setShowNotifDropdown(false);
      // Navigate to the event detail page
      if (notif.eventId?._id) {
        if (user.role === 'organizer') {
          navigate(`/organizer/event/${notif.eventId._id}`);
        } else {
          navigate(`/participant/event/${notif.eventId._id}`);
        }
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!isAuthenticated || !user) return null;

  const isActive = (path) => location.pathname === path;

  const navbarStyles = {
    navbar: {
      background: COLORS.white,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      borderBottom: `1px solid ${COLORS.veryLightGray}`,
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '64px',
    },
    logo: {
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    logoText: {
      fontSize: '24px',
      fontWeight: '600',
      color: COLORS.primary,
      margin: 0,
    },
    logoSubtext: {
      fontSize: '12px',
      color: COLORS.darkGray,
      fontWeight: '400',
      marginLeft: '8px',
    },
    navLinks: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    },
    navLink: {
      textDecoration: 'none',
      color: COLORS.darkGray,
      fontSize: '14px',
      fontWeight: '500',
      padding: '8px 16px',
      borderRadius: '6px',
      transition: 'all 0.2s',
    },
    navLinkActive: {
      background: COLORS.primary,
      color: COLORS.white,
    },
    navLinkHover: {
      background: COLORS.veryLightGray,
      color: COLORS.dark,
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    userInfo: {
      fontSize: '14px',
      color: COLORS.dark,
      fontWeight: '500',
      paddingRight: '16px',
      borderRight: `1px solid ${COLORS.lightGray}`,
    },
    logoutButton: {
      padding: '8px 20px',
      background: COLORS.white,
      border: `1px solid ${COLORS.lightGray}`,
      borderRadius: '6px',
      color: COLORS.darkGray,
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    logoutButtonHover: {
      background: COLORS.accent,
      color: COLORS.white,
      borderColor: COLORS.accent,
    },
  };

  const NavLink = ({ to, children }) => {
    const active = isActive(to);
    const [hover, setHover] = useState(false);

    return (
      <Link
        to={to}
        style={{
          ...navbarStyles.navLink,
          ...(active ? navbarStyles.navLinkActive : {}),
          ...(hover && !active ? navbarStyles.navLinkHover : {}),
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {children}
      </Link>
    );
  };

  const LogoutButton = () => {
    const [hover, setHover] = useState(false);

    return (
      <button
        onClick={handleLogout}
        style={{
          ...navbarStyles.logoutButton,
          ...(hover ? navbarStyles.logoutButtonHover : {}),
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        Logout
      </button>
    );
  };

  // Notification Bell Component
  const NotificationBell = () => (
    <div ref={notifRef} style={{ position: 'relative' }}>
      <button
        onClick={() => { setShowNotifDropdown(prev => !prev); }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '22px',
          position: 'relative',
          padding: '4px 8px',
          borderRadius: '6px',
          transition: 'background 0.2s',
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '2px',
            background: COLORS.accent,
            color: COLORS.white,
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '11px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${COLORS.white}`,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifDropdown && (
        <div style={{
          position: 'absolute',
          top: '44px',
          right: '0',
          width: '360px',
          maxHeight: '440px',
          background: COLORS.white,
          borderRadius: '10px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          border: `1px solid ${COLORS.lightGray}`,
          zIndex: 2000,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: `1px solid ${COLORS.veryLightGray}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: '600', fontSize: '15px', color: COLORS.dark }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: COLORS.primary,
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: COLORS.darkGray,
              }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔔</div>
                <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${COLORS.veryLightGray}`,
                    cursor: 'pointer',
                    background: notif.isRead ? COLORS.white : `${COLORS.primary}08`,
                    transition: 'background 0.15s',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.veryLightGray}
                  onMouseLeave={e => e.currentTarget.style.background = notif.isRead ? COLORS.white : `${COLORS.primary}08`}
                >
                  {!notif.isRead && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: COLORS.primary,
                      flexShrink: 0,
                      marginTop: '6px',
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: '0 0 4px 0',
                      fontSize: '13px',
                      color: COLORS.dark,
                      fontWeight: notif.isRead ? '400' : '500',
                      lineHeight: '1.4',
                    }}>
                      {notif.message}
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '11px',
                      color: COLORS.gray,
                    }}>
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Participant Navigation
  if (user.role === 'participant') {
    return (
      <nav style={navbarStyles.navbar}>
        <div style={navbarStyles.container}>
          <Link to="/participant/dashboard" style={navbarStyles.logo}>
            <h1 style={navbarStyles.logoText}>
              Felicity
              <span style={navbarStyles.logoSubtext}>Events</span>
            </h1>
          </Link>

          <div style={navbarStyles.navLinks}>
            <NavLink to="/participant/dashboard">Dashboard</NavLink>
            <NavLink to="/participant/browse-events">Browse Events</NavLink>
            <NavLink to="/participant/clubs">Clubs</NavLink>
            <NavLink to="/participant/profile">Profile</NavLink>
          </div>

          <div style={navbarStyles.rightSection}>
            <NotificationBell />
            <span style={navbarStyles.userInfo}>
              {user.firstName} {user.lastName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>
    );
  }

  // Organizer Navigation
  if (user.role === 'organizer') {
    return (
      <nav style={navbarStyles.navbar}>
        <div style={navbarStyles.container}>
          <Link to="/organizer/dashboard" style={navbarStyles.logo}>
            <h1 style={navbarStyles.logoText}>
              Felicity
              <span style={navbarStyles.logoSubtext}>Organizer</span>
            </h1>
          </Link>

          <div style={navbarStyles.navLinks}>
            <NavLink to="/organizer/dashboard">Dashboard</NavLink>
            <NavLink to="/organizer/ongoing-events">Ongoing Events</NavLink>
            <NavLink to="/organizer/profile">Profile</NavLink>
          </div>

          <div style={navbarStyles.rightSection}>
            <NotificationBell />
            <span style={navbarStyles.userInfo}>
              {user.organizerName || user.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>
    );
  }

  // Admin Navigation
  if (user.role === 'admin') {
    return (
      <nav style={navbarStyles.navbar}>
        <div style={navbarStyles.container}>
          <Link to="/admin/dashboard" style={navbarStyles.logo}>
            <h1 style={navbarStyles.logoText}>
              Felicity
              <span style={navbarStyles.logoSubtext}>Admin</span>
            </h1>
          </Link>

          <div style={navbarStyles.navLinks}>
            <NavLink to="/admin/dashboard">Dashboard</NavLink>
          </div>

          <div style={navbarStyles.rightSection}>
            <span style={navbarStyles.userInfo}>
              Administrator
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>
    );
  }

  // Default fallback
  return null;
};

// Helper: relative time string
function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default Navbar;

