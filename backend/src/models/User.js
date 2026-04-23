import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: [true, 'Username is required'],    // [condition, error message]
      unique: true,                                 // No two users can have same username
      trim: true,                                   // Removes extra spaces: "  john  " → "john"
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,                                 // No two users can have same email
      lowercase: true,                              // Stores as lowercase always
      trim: true,
      // Basic email format validation using regex
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      // select: false means this field WON'T be returned in queries by default
      // WHY: You never want to accidentally send password to frontend
      // To get it: User.findOne().select('+password')
      select: false,
    }, avatar: {
      type: String,
      // Default avatar using DiceBear API — generates unique avatar from username
      // We'll use this so every user has a profile picture automatically
      default: '',
    },

    isOnline: {
      type: Boolean,
      default: false,               // User starts as offline
    },

    lastSeen: {
      type: Date,
      default: Date.now,            // Timestamp of last activity
    },
    //  Which rooms this user has joined
    // Array of Room IDs — ref:'Room' means it points to Room collection
    rooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
      },
    ],
},{
    // timestamps: true automatically adds:
    // createdAt → when user registered
    // updatedAt → when user profile was last changed
    timestamps: true,
  })

  //MIDDLEWARE — Runs BEFORE saving to database
// This is called a "pre-save hook"

// userSchema.pre('save', async function (next) {
//   // "this" refers to the current user document being saved

//   // IMPORTANT: Only hash password if it was changed
//   // WHY: If user updates their username, we don't want to re-hash their password
//   // isModified() checks if a specific field was changed
//   if (!this.isModified('password')) {
//     return next(); // Skip hashing, move to next middleware
//   }

//   // bcrypt.genSalt(10) → generates a "salt" (random string)
//   // Salt is added to password before hashing so same passwords hash differently
//   // 10 = cost factor (how many times to process) — higher = more secure but slower
//   // 10 is the industry standard sweet spot
//   const salt = await bcrypt.genSalt(10);

//   // Hash the password with the salt
//   // "password123" + salt → "$2b$10$xyz..." (unreadable, irreversible)
//   this.password = await bcrypt.hash(this.password, salt);

//   // Set default avatar using username
//   if (!this.avatar) {
//     this.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.username}`;
//   }

//   next(); // Continue to save
// });

userSchema.pre('save', async function () {
  // 'this' = the user document being saved

  // Only hash if password was actually changed
  // isModified() = did this field change since last save?
  if (!this.isModified('password')) {
    return; // ← just return, no next()
  }

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // Set default avatar if not set
  if (!this.avatar) {
    this.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.username}`;
  }

  // ← no next() here either — async function just ends
});

// ─────────────────────────────────────────────
// INSTANCE METHOD — comparePassword
// WHY: We need to check if login password matches stored hash
// We add it as a method ON the user document
// Usage: const isMatch = await user.comparePassword("password123")
// ─────────────────────────────────────────────

userSchema.methods.comparePassword = async function (enteredPassword) {
  // bcrypt.compare takes plaintext + hash → returns true/false
  // It can't "decrypt" — it hashes the entered password the same way and compares
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─────────────────────────────────────────────
// CREATE THE MODEL
// mongoose.model('User', userSchema)
// 'User' → collection name in MongoDB will be 'users' (lowercase + plural, auto)
// ─────────────────────────────────────────────

const User = mongoose.model('User', userSchema);

export default User;