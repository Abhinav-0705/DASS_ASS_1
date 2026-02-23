import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import { COLORS, STYLES } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const DiscussionForum = ({ eventId }) => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    fetchDiscussions();
    const interval = setInterval(fetchDiscussions, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchDiscussions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/discussions/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiscussions(response.data.discussions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setPosting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/discussions`,
        { eventId, message, replyTo: replyTo?._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('');
      setReplyTo(null);
      fetchDiscussions();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to post message');
    } finally {
      setPosting(false);
    }
  };

  const handlePin = async (discussionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/api/discussions/${discussionId}/pin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDiscussions();
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  const handleDelete = async (discussionId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/api/discussions/${discussionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDiscussions();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReact = async (discussionId, emoji) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/discussions/${discussionId}/react`,
        { emoji },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDiscussions();
    } catch (error) {
      console.error('Error reacting:', error);
    }
  };

  const getAuthorName = (discussion) => {
    if (discussion.authorRole === 'organizer') {
      return discussion.authorId?.organizerName || 'Organizer';
    }
    return `${discussion.authorId?.firstName || ''} ${discussion.authorId?.lastName || ''}`;
  };

  const renderDiscussion = (discussion, isReply = false) => (
    <div
      key={discussion._id}
      style={{
        background: discussion.isAnnouncement
          ? `linear-gradient(135deg, ${COLORS.primary}15, ${COLORS.secondary}15)`
          : isReply
            ? COLORS.veryLightGray
            : COLORS.white,
        padding: '16px',
        borderRadius: '8px',
        border: discussion.isPinned
          ? `2px solid ${COLORS.warning}`
          : `1px solid ${COLORS.lightGray}`,
        marginBottom: '12px',
        marginLeft: isReply ? '40px' : '0'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <strong style={{ color: COLORS.dark }}>
              {getAuthorName(discussion)}
            </strong>
            {discussion.authorRole === 'organizer' && (
              <span style={{
                background: COLORS.primary,
                color: COLORS.white,
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                ORGANIZER
              </span>
            )}
            {discussion.isPinned && (
              <span style={{ fontSize: '16px' }}>📌</span>
            )}
            {discussion.isAnnouncement && (
              <span style={{
                background: COLORS.secondary,
                color: COLORS.white,
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                ANNOUNCEMENT
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: COLORS.darkGray }}>
            {new Date(discussion.createdAt).toLocaleString()}
          </p>
        </div>

        {user.role === 'organizer' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handlePin(discussion._id)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px'
              }}
              title={discussion.isPinned ? 'Unpin' : 'Pin'}
            >
              📌
            </button>
            <button
              onClick={() => handleDelete(discussion._id)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px',
                color: COLORS.accent
              }}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Message */}
      <p style={{ margin: '0 0 12px 0', color: COLORS.dark, whiteSpace: 'pre-wrap' }}>
        {discussion.message}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Reactions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['👍', '❤️', '👏', '🎉'].map(emoji => {
            const count = discussion.reactions?.filter(r => r.emoji === emoji).length || 0;
            return (
              <button
                key={emoji}
                onClick={() => handleReact(discussion._id, emoji)}
                style={{
                  background: count > 0 ? `${COLORS.primary}15` : 'transparent',
                  border: `1px solid ${count > 0 ? COLORS.primary : COLORS.lightGray}`,
                  borderRadius: '12px',
                  padding: '4px 8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {emoji}
                {count > 0 && <span style={{ fontSize: '12px', color: COLORS.darkGray }}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Reply Button */}
        {!isReply && (
          <button
            onClick={() => setReplyTo(discussion)}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.primary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            💬 Reply
          </button>
        )}
      </div>

      {/* Show replies */}
      {!isReply && discussions.filter(d => d.replyTo?._id === discussion._id).map(reply =>
        renderDiscussion(reply, true)
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: COLORS.darkGray }}>Loading discussions...</p>
      </div>
    );
  }

  return (
    <div style={STYLES.card}>
      <h2 style={{ margin: '0 0 24px 0', color: COLORS.dark, fontSize: '24px', fontWeight: '600' }}>
        💬 Discussion Forum
      </h2>

      {/* Organizer Info Box */}
      {user.role === 'organizer' && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: COLORS.white,
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>🎯 Organizer Controls</h4>
          <p style={{ margin: '0', fontSize: '14px', opacity: 0.9 }}>
            • Your messages are automatically marked as <strong>ANNOUNCEMENTS</strong><br />
            • Use 📌 to pin/unpin important messages<br />
            • Use 🗑️ to delete inappropriate messages<br />
            • Reply to participant queries using the 💬 Reply button
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: `${COLORS.accent}15`,
          border: `1px solid ${COLORS.accent}`,
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span style={{ color: COLORS.accent, fontSize: '14px' }}>{error}</span>
          <button onClick={() => setError('')} style={{
            background: 'none',
            border: 'none',
            color: COLORS.accent,
            cursor: 'pointer',
            fontSize: '18px'
          }}>×</button>
        </div>
      )}

      {/* Post Form */}
      <form onSubmit={handlePost} style={{ marginBottom: '24px' }}>
        {replyTo && (
          <div style={{
            background: COLORS.veryLightGray,
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: COLORS.darkGray, fontSize: '14px' }}>
              💬 Replying to <strong>{getAuthorName(replyTo)}</strong>
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              style={{
                background: 'none',
                border: 'none',
                color: COLORS.accent,
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          </div>
        )}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={replyTo ? 'Write your reply...' : user.role === 'organizer' ? 'Post an announcement, answer questions, or share updates...' : 'Share your thoughts, ask questions...'}
          rows="4"
          style={{
            ...STYLES.input,
            resize: 'vertical',
            marginBottom: '12px'
          }}
        />
        <button
          type="submit"
          disabled={posting || !message.trim()}
          style={{
            ...STYLES.button,
            width: '100%',
            opacity: (posting || !message.trim()) ? 0.6 : 1,
            cursor: (posting || !message.trim()) ? 'not-allowed' : 'pointer'
          }}
        >
          {posting ? 'Posting...' : replyTo ? '💬 Post Reply' : user.role === 'organizer' ? '📢 Post Announcement' : '📤 Post Message'}
        </button>
      </form>

      {/* Discussions List */}
      <div>
        {discussions.filter(d => !d.replyTo).length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: COLORS.veryLightGray,
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
            <p style={{ color: COLORS.darkGray, margin: 0 }}>
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          discussions
            .filter(d => !d.replyTo) // Only show top-level discussions
            .map(discussion => renderDiscussion(discussion))
        )}
      </div>
    </div>
  );
};

export default DiscussionForum;
