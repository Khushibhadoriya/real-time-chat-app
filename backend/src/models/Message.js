// backend/src/models/Message.js

import mongoose from 'mongoose';

// ─────────────────────────────────────────────
// MESSAGE SCHEMA
// Every message sent in the app = one document here
// ─────────────────────────────────────────────

const messageSchema = new mongoose.Schema(
  {
    // WHO sent this message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',                 // Links to User collection
      required: true,
    },

    // WHICH room this message belongs to
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',                 // Links to Room collection
      required: true,
    },

    // THE actual message text
    content: {
      type: String,
      required: [true, 'Message cannot be empty'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },

    // Message type — for future features
    // 'text' = normal message
    // 'system' = "John joined the room" type messages
    type: {
      type: String,
      enum: ['text', 'system'],    // Only these two values allowed
      default: 'text',
    },

    // Track who has read this message (for read receipts later)
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },

  {
    // createdAt → this IS the message timestamp shown in chat UI
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// INDEX — For performance
// WHY: When we load messages for a room, we query by room + sort by time
// Adding an index on these fields makes that query MUCH faster
// Without index: MongoDB scans every message (slow for 1M messages)
// With index: MongoDB jumps directly to relevant messages (fast)
// ─────────────────────────────────────────────
messageSchema.index({ room: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;