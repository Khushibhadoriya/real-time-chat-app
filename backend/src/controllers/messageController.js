// backend/src/controllers/messageController.js

import Message from '../models/Message.js';
import Room from '../models/Room.js';

// ─────────────────────────────────────────────
// @desc    Get messages for a room (chat history)
// @route   GET /api/messages/:roomId
// @access  Private
// ─────────────────────────────────────────────
export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Pagination — load last 50 messages by default
    // WHY pagination: loading 10,000 messages at once would crash the browser
    // We load the most recent 50, and can load more when user scrolls up
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check user is a member of this room
    // Security: users shouldn't read messages from rooms they didn't join
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const isMember = room.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ 
        message: 'You are not a member of this room' 
      });
    }

    // Fetch messages for this room
    // .sort({ createdAt: -1 }) = newest first
    // .skip() and .limit() = pagination
    // .populate('sender') = replace sender ID with actual user data
    const messages = await Message.find({ room: roomId })
      .populate('sender', 'username avatar isOnline')
      .sort({ createdAt: -1 })    // newest first
      .skip(skip)
      .limit(limit);

    // Reverse so oldest message is at top (normal chat order)
    // We fetched newest first for efficient pagination
    // then reverse for correct display order
    const orderedMessages = messages.reverse();

    // Get total count for pagination info
    const totalMessages = await Message.countDocuments({ room: roomId });

    res.status(200).json({
      messages: orderedMessages,
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
        hasMore: skip + limit < totalMessages, // are there older messages?
      },
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};


// ─────────────────────────────────────────────
// @desc    Send a message via HTTP (fallback)
//          NOTE: Main message sending goes through Socket.io
//          This HTTP route is a fallback / for testing
// @route   POST /api/messages/:roomId
// @access  Private
// ─────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Verify room exists and user is member
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const isMember = room.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ 
        message: 'You are not a member of this room' 
      });
    }

    // Create message in database
    const message = await Message.create({
      sender: req.user._id,
      room: roomId,
      content: content.trim(),
    });

    // Populate sender info before returning
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar isOnline');

    res.status(201).json({ message: populatedMessage });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
};