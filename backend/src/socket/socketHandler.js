// backend/src/socket/socketHandler.js

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Room from '../models/Room.js';

// ─────────────────────────────────────────────
// SOCKET AUTHENTICATION MIDDLEWARE
//
// WHY: Just like HTTP routes need authMiddleware,
// Socket connections need authentication too.
// We verify the JWT token when socket first connects.
//
// HOW: Frontend sends token when connecting:
// socket = io('http://localhost:5003', {
//   auth: { token: "eyJhbG..." }
// })
// ─────────────────────────────────────────────

const authenticateSocket = async (socket, next) => {
  try {
    // Get token from socket handshake auth
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket object
    // WHY: Every socket event handler can access socket.user
    socket.user = user;

    next(); // ✅ Authentication passed

  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};


// ─────────────────────────────────────────────
// MAIN SOCKET HANDLER
// This function is called from server.js with the io instance
// ─────────────────────────────────────────────

export const initializeSocket = (io) => {

  // Apply authentication middleware to ALL socket connections
  // Every new connection must pass this check first
  io.use(authenticateSocket);

  // Store online users: Map { userId → socketId }
  // WHY Map: fast lookup, easy to add/remove
  const onlineUsers = new Map();

  // ─────────────────────────────────────────────
  // CONNECTION EVENT
  // Fires when a client successfully connects and passes auth
  // ─────────────────────────────────────────────
  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`⚡ ${user.username} connected | Socket: ${socket.id}`);

    // Track this user as online
    onlineUsers.set(user._id.toString(), socket.id);

    // Update user's online status in database
    await User.findByIdAndUpdate(user._id, { 
      isOnline: true,
      lastSeen: new Date() 
    });

    // Broadcast to ALL connected clients that this user is online
    // socket.broadcast.emit = send to everyone EXCEPT this socket
    socket.broadcast.emit('userOnline', {
      userId: user._id,
      username: user.username,
      avatar: user.avatar,
    });

    // Send the current online users list to the newly connected user
    // So they immediately see who's already online
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('onlineUsers', onlineUserIds);


    // ─────────────────────────────────────────
    // JOIN ROOM EVENT
    // Fires when user clicks on a chat room
    // ─────────────────────────────────────────
    socket.on('joinRoom', async (roomId) => {
      try {
        // Verify user is a member of this room (security check)
        const room = await Room.findById(roomId);
        if (!room) return;

        const isMember = room.members.some(
          (id) => id.toString() === user._id.toString()
        );
        if (!isMember) return;

        // Socket.io room join
        // After this: io.to(roomId).emit() sends to everyone in this room
        socket.join(roomId);
        console.log(`🏠 ${user.username} joined room: ${room.name}`);

        // Notify everyone in the room that this user joined
        // socket.to(roomId) = everyone in room EXCEPT the user who just joined
        socket.to(roomId).emit('userJoinedRoom', {
          userId: user._id,
          username: user.username,
          avatar: user.avatar,
          roomId,
        });

      } catch (error) {
        console.error('joinRoom error:', error);
      }
    });


    // ─────────────────────────────────────────
    // LEAVE ROOM EVENT
    // Fires when user switches to a different room
    // ─────────────────────────────────────────
    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
      console.log(`🚪 ${user.username} left room: ${roomId}`);

      socket.to(roomId).emit('userLeftRoom', {
        userId: user._id,
        username: user.username,
        roomId,
      });
    });


    // ─────────────────────────────────────────
    // SEND MESSAGE EVENT
    // This is the core real-time feature
    // ─────────────────────────────────────────
    socket.on('sendMessage', async (data) => {
      try {
        // data = { roomId, content } sent from frontend
        const { roomId, content } = data;

        // Validate
        if (!content || !content.trim()) return;
        if (!roomId) return;

        // Verify user is member of this room
        const room = await Room.findById(roomId);
        if (!room) return;

        const isMember = room.members.some(
          (id) => id.toString() === user._id.toString()
        );
        if (!isMember) return;

        // Save message to database
        const message = await Message.create({
          sender: user._id,
          room: roomId,
          content: content.trim(),
        });

        // Populate sender data for the response
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar isOnline');

        // Emit 'newMessage' to EVERYONE in the room (including sender)
        // WHY include sender: their own message should show immediately
        // io.to(roomId) = emit to all sockets in this room
        io.to(roomId).emit('newMessage', {
          _id: populatedMessage._id,
          content: populatedMessage.content,
          sender: populatedMessage.sender,
          room: roomId,
          createdAt: populatedMessage.createdAt,
        });

        console.log(`💬 Message in ${room.name} by ${user.username}`);

      } catch (error) {
        console.error('sendMessage socket error:', error);
        // Emit error back to sender only
        socket.emit('messageError', { message: 'Failed to send message' });
      }
    });


    // ─────────────────────────────────────────
    // TYPING INDICATOR EVENTS
    // Shows "John is typing..." to other users
    // ─────────────────────────────────────────
    socket.on('typing', (roomId) => {
      // Tell everyone in the room EXCEPT the typer
      socket.to(roomId).emit('typingStatus', {
        userId: user._id,
        username: user.username,
        isTyping: true,
        roomId,
      });
    });

    socket.on('stopTyping', (roomId) => {
      socket.to(roomId).emit('typingStatus', {
        userId: user._id,
        username: user.username,
        isTyping: false,
        roomId,
      });
    });


    // ─────────────────────────────────────────
    // DISCONNECT EVENT
    // Fires when user closes tab, loses internet, etc.
    // ─────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ ${user.username} disconnected`);

      // Remove from online users map
      onlineUsers.delete(user._id.toString());

      // Update database
      await User.findByIdAndUpdate(user._id, {
        isOnline: false,
        lastSeen: new Date(),
      });

      // Notify ALL connected clients this user went offline
      io.emit('userOffline', {
        userId: user._id,
        username: user.username,
        lastSeen: new Date(),
      });
    });

  }); // end io.on('connection')

}; // end initializeSocket