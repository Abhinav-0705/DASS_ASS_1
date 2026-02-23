// Professional color palette for the event management system
export const COLORS = {
  // Primary colors - Professional blues and neutrals
  primary: '#1a73e8',        // Google Blue
  primaryDark: '#1557b0',
  primaryLight: '#4285f4',
  
  // Secondary colors
  secondary: '#34a853',      // Success green
  secondaryDark: '#0d904f',
  
  // Accent colors
  accent: '#ea4335',         // Error/danger red
  accentDark: '#c5221f',
  
  warning: '#fbbc04',        // Warning yellow
  info: '#4285f4',           // Info blue
  
  // Neutral colors
  dark: '#202124',
  darkGray: '#5f6368',
  gray: '#80868b',
  lightGray: '#dadce0',
  veryLightGray: '#f1f3f4',
  white: '#ffffff',
  
  // Background colors
  background: '#f8f9fa',
  cardBackground: '#ffffff',
  
  // Status colors
  draft: '#fbbc04',          // Yellow
  published: '#34a853',      // Green
  ongoing: '#4285f4',        // Blue
  completed: '#80868b',      // Gray
  cancelled: '#ea4335',      // Red
  
  // Event type colors
  normal: '#1a73e8',
  merchandise: '#ea8600',
  
  // Participant type colors
  iiit: '#1a73e8',
  nonIiit: '#ea8600',
};

// Common styles
export const STYLES = {
  card: {
    background: COLORS.white,
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    padding: '24px',
  },
  
  cardHover: {
    boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
  },
  
  button: {
    borderRadius: '4px',
    padding: '10px 24px',
    fontWeight: '500',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  input: {
    borderRadius: '4px',
    padding: '10px 12px',
    border: `1px solid ${COLORS.lightGray}`,
    fontSize: '14px',
    width: '100%',
  },
};

// Status badge styles
export const getStatusBadge = (status) => {
  const statusColors = {
    draft: COLORS.draft,
    published: COLORS.published,
    ongoing: COLORS.ongoing,
    completed: COLORS.completed,
    cancelled: COLORS.cancelled,
    confirmed: COLORS.secondary,
    pending: COLORS.warning,
  };

  return {
    padding: '4px 12px',
    borderRadius: '12px',
    background: statusColors[status] || COLORS.gray,
    color: COLORS.white,
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'uppercase',
    display: 'inline-block',
  };
};
