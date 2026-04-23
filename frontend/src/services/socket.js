// frontend/src/services/socket.js

import { io } from 'socket.io-client';

// ─────────────────────────────────────────────
// SOCKET SINGLETON
//
// WHY SINGLETON?
// We want ONE socket connection for the entire app
// If we created a new socket in every component:
//   → 10 components = 10 connections = chaos
//
// Singleton pattern: create once, reuse everywhere
// ─────────────────────────────────────────────

let socket = null;

// Call this ONCE when user logs in
export const connectSocket = (token) => {
  // If socket already exists and connected — don't create another and — return existing one
  if (socket?.connected) {
    console.log('🔌 Socket already connected, reusing:', socket.id);
    return socket;
  }
 // If socket exists but disconnected — clean it up first
  if (socket) {
    console.log('🔌 Cleaning up old socket before reconnecting');
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  console.log('🔌 Creating new socket connection...');
  socket = io('http://localhost:5003', {
    // Send JWT token during connection handshake
    // Our socketHandler.js reads this in authenticateSocket()
    auth: { token },

    // Reconnection settings
    reconnection: true,           // auto reconnect if connection drops
    reconnectionAttempts: 5,      // try 5 times
    reconnectionDelay: 1000,      // wait 1 second between attempts
     transports: ['websocket', 'polling'],

  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('🔌 Socket connection error:', error.message);
  });

  return socket;
};

// Call this when user logs out
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket disconnected and cleaned up');
  }
};

// Use this everywhere in the app to get the socket instance
export const getSocket = () => socket;