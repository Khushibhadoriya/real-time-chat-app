// backend/src/routes/messageRoutes.js

import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// All message routes require authentication
router.use(protect);

// GET  /api/messages/:roomId          → get chat history
// POST /api/messages/:roomId          → send a message (HTTP fallback)
router.route('/:roomId')
  .get(getMessages)
  .post(sendMessage);

export default router;