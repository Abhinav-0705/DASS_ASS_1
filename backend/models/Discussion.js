const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorRole: {
    type: String,
    enum: ['participant', 'organizer'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String // 👍, ❤️, 👏, 🎉
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

discussionSchema.index({ eventId: 1, createdAt: -1 });

module.exports = mongoose.model('Discussion', discussionSchema);
