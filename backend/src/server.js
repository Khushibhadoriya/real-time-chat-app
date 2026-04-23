// backend/src/server.js

// ─────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { connectDB } from './utils/db.js';

// ⏸️ COMMENTED OUT — We'll uncomment as we build each feature
import authRoutes from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import { initializeSocket } from './socket/socketHandler.js';

// ─────────────────────────────────────────────
// APP INITIALIZATION
// ─────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ChatSphere server is running! 🚀',
    timestamp: new Date().toISOString()
  });
});

// ⏸️ COMMENTED OUT — Will uncomment when route files are created
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.url} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────
// SOCKET.IO — Basic setup for now
// ⏸️ initializeSocket(io) is commented — full logic coming in Phase 4
// ─────────────────────────────────────────────
// io.on('connection', (socket) => {
//   console.log(`⚡ Socket connected: ${socket.id}`);
//   socket.on('disconnect', () => {
//     console.log(`❌ Socket disconnected: ${socket.id}`);
//   });
// });
// ─────────────────────────────────────────────
// ✅ CRITICAL FIX:
// REMOVED the old basic io.on('connection') handler
// CALLING initializeSocket(io) instead
//
// Old handler had NO authentication — socket.user was always undefined
// initializeSocket runs authenticateSocket middleware first
// which sets socket.user = logged in user
// Without socket.user → sendMessage crashes silently → no messages
// ─────────────────────────────────────────────
initializeSocket(io);

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5003;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log('');
    console.log('🚀 ─────────────────────────────────────────');
    console.log(`✅  ChatSphere Server running on port ${PORT}`);
    console.log(`🌍  Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗  Health: http://localhost:${PORT}/api/health`);
    console.log('🚀 ─────────────────────────────────────────');
    console.log('');
  });
}).catch((error) => {
  console.error('❌ Failed to connect to MongoDB:', error.message);
  process.exit(1);
});

export { io };