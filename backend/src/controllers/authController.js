// backend/src/controllers/authController.js

import User from '../models/User.js';
import Room from '../models/Room.js';
import { generateToken } from '../utils/generateToken.js';

// ─────────────────────────────────────────────
// WHAT IS A CONTROLLER?
// A controller = the actual business logic of a route
//
// Route file says:    "POST /register → call registerUser"
// Controller says:    "Here's exactly what registerUser does"
//
// WHY SEPARATE?
// Keeps routes clean (just paths)
// Controllers focus only on logic
// Easy to test and maintain
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (no token needed)
// ─────────────────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    // 1. Extract data from request body
    // req.body is the JSON data frontend sent us
    const { username, email, password } = req.body;

    // 2. Validate — check all fields are present
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Please provide username, email and password' 
      });
    }

    // 3. Check if email already registered
    // findOne returns null if not found
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ 
        message: 'Email is already registered' 
      });
    }

    // 4. Check if username already taken
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ 
        message: 'Username is already taken' 
      });
    }

    // 5. Create user in database
    // Password will be AUTO-HASHED by our pre-save hook in User.js
    // We don't manually hash here — the model handles it
    const user = await User.create({
      username,
      email,
      password,        // plain text here → model hashes it before saving
    });

    // 6. Auto-join user to a default "General" room
    // WHY: New users should see some activity immediately
    // We find or create a General room and add this user
    let generalRoom = await Room.findOne({ name: 'General' });

    if (!generalRoom) {
      // Create General room if it doesn't exist yet
      generalRoom = await Room.create({
        name: 'General',
        description: 'Welcome to ChatSphere! Everyone is here.',
        createdBy: user._id,
        members: [user._id],
        avatar: '🌍',
      });
    } else {
      // Add user to existing General room
      await Room.findByIdAndUpdate(generalRoom._id, {
        $addToSet: { members: user._id }, // $addToSet = add only if not already in array
      });
    }

    // Add room to user's rooms list
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { rooms: generalRoom._id },
    });

    // 7. Generate JWT token
    const token = generateToken(user._id);

    // 8. Send response
    // Status 201 = "Created" (use for successful creation, not 200)
    res.status(201).json({
      message: 'Registration successful',
      token,                    // Frontend stores this for future requests
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline,
        rooms: [generalRoom._id],
      },
    });

  } catch (error) {
    // Mongoose validation error — schema rules violated
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};


// ─────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public (no token needed)
// ─────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    // 1. Extract credentials
    const { email, password } = req.body;

    // 2. Validate
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Please provide email and password' 
      });
    }

    // 3. Find user by email
    // .select('+password') → password has select:false in schema
    // We explicitly request it here because we NEED to compare it
    const user = await User.findOne({ email }).select('+password');

    // 4. Check user exists AND password matches
    // We check BOTH together — never reveal which one failed (security!)
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // 5. Update user online status
    await User.findByIdAndUpdate(user._id, { 
      isOnline: true,
      lastSeen: new Date(),
    });

    // 6. Get user's rooms
    const userWithRooms = await User.findById(user._id).populate('rooms', 'name avatar description');

    // 7. Generate token
    const token = generateToken(user._id);

    // 8. Send response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isOnline: true,
        rooms: userWithRooms.rooms,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};


// ─────────────────────────────────────────────
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private (needs token)
// ─────────────────────────────────────────────
export const logoutUser = async (req, res) => {
  try {
    // Set user as offline in database
    // req.user comes from authMiddleware (it attached the user)
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
    });

    // JWT is stateless — we can't "delete" a token on server
    // The frontend just deletes the token from its storage
    // WHY: This is a limitation of JWT — tokens are valid until expiry
    // Solution for production: use a token blacklist or short expiry + refresh tokens
    res.status(200).json({ 
      message: 'Logged out successfully' 
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};


// ─────────────────────────────────────────────
// @desc    Get currently logged in user's profile
// @route   GET /api/auth/me
// @access  Private (needs token)
// ─────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    // req.user is already attached by authMiddleware
    // We just populate their rooms and return
    const user = await User.findById(req.user._id)
      .populate('rooms', 'name avatar description members');

    res.status(200).json({ user });

  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};