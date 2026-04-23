// backend/src/controllers/roomController.js

import Room from '../models/Room.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

// ─────────────────────────────────────────────
// @desc    Create a new chat room
// @route   POST /api/rooms
// @access  Private (must be logged in)
// ─────────────────────────────────────────────
export const createRoom = async (req, res) => {
  try {
    const { name, description, avatar } = req.body;

    // Validate room name
    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    // Check if room name already taken
    const roomExists = await Room.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } // case-insensitive check
    });

    if (roomExists) {
      return res.status(400).json({ message: 'Room name already taken' });
    }

    // Create the room
    // req.user._id = the logged in user (from authMiddleware)
    const room = await Room.create({
      name,
      description: description || '',
      avatar: avatar || '💬',
      createdBy: req.user._id,
      members: [req.user._id], // Creator is automatically a member
    });

    // Add room to creator's rooms list
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { rooms: room._id },
    });

    // Populate createdBy field before sending response
    // WHY: Frontend needs the creator's name, not just their ID
    const populatedRoom = await Room.findById(room._id)
      .populate('createdBy', 'username avatar')
      .populate('members', 'username avatar isOnline');

    res.status(201).json({
      message: 'Room created successfully',
      room: populatedRoom,
    });

  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error creating room' });
  }
};


// ─────────────────────────────────────────────
// @desc    Get all public rooms (for discovery)
// @route   GET /api/rooms
// @access  Private
// ─────────────────────────────────────────────
export const getAllRooms = async (req, res) => {
  try {
    // Find all non-private rooms
    // Sort by newest first
    const rooms = await Room.find({ isPrivate: false })
      .populate('createdBy', 'username avatar')
      .populate('members', 'username avatar isOnline')
      .sort({ createdAt: -1 });

    res.status(200).json({ rooms });

  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
};

// ─────────────────────────────────────────────
// @desc    Get ONLY rooms current user is a member of
// @route   GET /api/rooms/my
// @access  Private
// WHY SEPARATE ENDPOINT:
// Sidebar should show YOUR rooms only
// /api/rooms is for "browse all" discovery feature
// ─────────────────────────────────────────────
export const getMyRooms = async (req, res) => {
  try {
    // Find rooms where current user's _id is in the members array
    const rooms = await Room.find({
      members: { $in: [req.user._id] },  // $in = "user._id exists in members array"
      isPrivate: false,
    })
      .populate('createdBy', 'username avatar')
      .populate('members', 'username avatar isOnline')
      .sort({ createdAt: -1 });

    res.status(200).json({ rooms });

  } catch (error) {
    console.error('Get my rooms error:', error);
    res.status(500).json({ message: 'Server error fetching your rooms' });
  }
};

// ─────────────────────────────────────────────
// @desc    Get a single room by ID
// @route   GET /api/rooms/:roomId
// @access  Private
// ─────────────────────────────────────────────
export const getRoomById = async (req, res) => {
  try {
    // req.params.roomId = the :roomId part from the URL
    // Example: GET /api/rooms/665abc123 → req.params.roomId = "665abc123"
    const room = await Room.findById(req.params.roomId)
      .populate('createdBy', 'username avatar')
      .populate('members', 'username avatar isOnline lastSeen');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json({ room });

  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error fetching room' });
  }
};


// ─────────────────────────────────────────────
// @desc    Join an existing room
// @route   POST /api/rooms/:roomId/join
// @access  Private
// ─────────────────────────────────────────────
export const joinRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is already a member
    // .toString() because MongoDB ObjectId !== string, need to convert
    const isMember = room.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ message: 'You are already in this room' });
    }

    // Add user to room's members list
    // $addToSet = add only if not already present (prevents duplicates)
    await Room.findByIdAndUpdate(req.params.roomId, {
      $addToSet: { members: req.user._id },
    });

    // Add room to user's rooms list
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { rooms: req.params.roomId },
    });

    // Get updated room with populated data
    const updatedRoom = await Room.findById(req.params.roomId)
      .populate('createdBy', 'username avatar')
      .populate('members', 'username avatar isOnline');

    res.status(200).json({
      message: `Joined ${room.name} successfully`,
      room: updatedRoom,
    });

  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error joining room' });
  }
};


// ─────────────────────────────────────────────
// @desc    Leave a room
// @route   POST /api/rooms/:roomId/leave
// @access  Private
// ─────────────────────────────────────────────
export const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Can't leave General room
    if (room.name === 'General') {
      return res.status(400).json({ message: 'You cannot leave the General room' });
    }

    // Remove user from room members
    // $pull = remove a value from an array
    await Room.findByIdAndUpdate(req.params.roomId, {
      $pull: { members: req.user._id },
    });

    // Remove room from user's rooms
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { rooms: req.params.roomId },
    });

    res.status(200).json({ message: `Left ${room.name} successfully` });

  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ message: 'Server error leaving room' });
  }
};