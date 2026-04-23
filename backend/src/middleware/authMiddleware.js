// backend/src/middleware/authMiddleware.js

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ─────────────────────────────────────────────
// WHAT IS MIDDLEWARE?
// A function that runs BETWEEN the request and the route handler
//
// Request → [authMiddleware] → Route Handler → Response
//
// If token is valid → call next() → continue to route
// If token is invalid → send 401 error → stop here
//
// WHY: Protects private routes like "get messages" or "send message"
// Only logged-in users can access these
// ─────────────────────────────────────────────

export const protect = async (req, res, next) => {
  try {
    let token;

    // JWT is sent in the Authorization header like:
    // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    // We check if header exists and starts with "Bearer"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Split "Bearer TOKEN" → ["Bearer", "TOKEN"] → take index [1]
      token = req.headers.authorization.split(' ')[1];
    }

    // No token found → user not logged in
    if (!token) {
      return res.status(401).json({ 
        message: 'Not authorized, no token provided' 
      });
    }

    // Verify the token using our secret
    // If token was tampered with or expired → jwt.verify throws an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { userId: "abc123", iat: 1234567890, exp: 1234567890 }

    // Find the user in database using the userId from token
    // .select('-password') → exclude password field from result
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        message: 'User not found, token invalid' 
      });
    }

    // Attach user to request object
    // WHY: Route handlers can now access req.user to know who is logged in
    // Example: in messageController, req.user._id = the sender's id
    req.user = user;

    next(); // ✅ Token valid, continue to the actual route

  } catch (error) {
    // jwt.verify throws specific errors we can handle:
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};