// backend/src/models/Room.js

import mongoose from 'mongoose';

// ─────────────────────────────────────────────
// ROOM SCHEMA
// A Room = a group chat channel (like #general in Discord)
// ─────────────────────────────────────────────

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Room name must be at least 2 characters'],
      maxlength: [30, 'Room name cannot exceed 30 characters'],
    },

    description: {
      type: String,
      default: '',
      maxlength: [100, 'Description cannot exceed 100 characters'],
    },

    // Who created this room
    // ref: 'User' → links to User collection
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Array of users in this room
    // Each element is a User _id
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Room avatar/icon (emoji or image url)
    avatar: {
      type: String,
      default: '💬',               // Default emoji icon
    },

    // Is this a private room (direct message) or public group?
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
  }
);

const Room = mongoose.model('Room', roomSchema);

export default Room;