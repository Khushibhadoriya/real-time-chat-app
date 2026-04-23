// backend/src/routes/roomRoutes.js

import { Router } from 'express';
import {
  createRoom,
  getAllRooms,
  getMyRooms,
  getRoomById,
  joinRoom,
  leaveRoom,
} from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// All routes here are protected (user must be logged in)
// protect middleware runs before every route handler below

router.use(protect); // ← applies protect to ALL routes in this file

// GET  /api/rooms         → get all public rooms
// POST /api/rooms         → create a new room
router.route('/')
  .get(getAllRooms)
  .post(createRoom);


// GET /api/rooms/my    → only MY rooms (for sidebar)
// ⚠️ This MUST be before /:roomId route
// WHY: Express reads routes top to bottom
// If /:roomId is first, "my" gets matched as a roomId param
  
router.get('/my', getMyRooms);
// GET  /api/rooms/:roomId        → get one room
router.get('/:roomId', getRoomById);

// POST /api/rooms/:roomId/join   → join a room
router.post('/:roomId/join', joinRoom);

// POST /api/rooms/:roomId/leave  → leave a room
router.post('/:roomId/leave', leaveRoom);

export default router;