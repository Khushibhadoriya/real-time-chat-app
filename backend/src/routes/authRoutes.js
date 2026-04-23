// backend/src/routes/authRoutes.js

import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

// ─────────────────────────────────────────────
// WHAT IS A ROUTER?
// Express Router = a mini Express app for a specific feature
// We group all auth-related routes here
//
// In server.js we said:  app.use('/api/auth', authRoutes)
// So every route here is prefixed with /api/auth
//
// router.post('/register') → full path: POST /api/auth/register
// router.post('/login')    → full path: POST /api/auth/login
// router.get('/me')        → full path: GET  /api/auth/me
// ─────────────────────────────────────────────

const router = Router();

// Public routes — no token needed
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private routes — protect middleware runs FIRST
// If token valid → getMe runs
// If token invalid → protect sends 401 and getMe never runs
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);

export default router;