// backend/src/utils/db.js

import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // mongoose v7+ removed useNewUrlParser and useUnifiedTopology
    // They are now default — no need to pass them
    const connection = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    throw error;
  }
};