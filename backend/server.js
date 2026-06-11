import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';
import Room from './models/Room.js';
import User from './models/User.js';
import Booking from './models/Booking.js';
import initialRooms from './config/initialRooms.js';

// Load environmental variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsing with large payload limit for Base64 images
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Register API Routes
app.use('/api', apiRoutes);

// Simple healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Serve Static Frontend Files (production build) with custom headers to prevent browser caching of index.html
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (path.basename(filePath) === 'index.html') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// Fallback all other routes to index.html for Single Page App (SPA) routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server after establishing DB connection
const startServer = async () => {
  // Connect to live MongoDB
  const conn = await connectDB();
  
  if (conn) {
    try {
      // Auto-seed admin user if not present
      const adminUser = await User.findOne({ username: 'aakrisht' });
      if (!adminUser) {
        console.log('🌱 Seeding admin user...');
        const newAdmin = new User({
          username: 'aakrisht',
          password: '12345678',
          role: 'admin'
        });
        await newAdmin.save();
        console.log('✅ Admin user "aakrisht" seeded successfully.');
      } else {
        console.log('📊 Admin user "aakrisht" already exists.');
      }

      // Auto-seed rooms if database is empty, doesn't have Indian hotels, or lacks photo galleries
      const roomCount = await Room.countDocuments();
      const hasIndianHotels = await Room.findOne({ location: /India/i });
      const hasGallery = await Room.findOne({ images: { $exists: true, $not: { $size: 0 } } });
      if (roomCount < 10 || !hasIndianHotels || !hasGallery) {
        console.log('🌱 Clearing old inventory and auto-seeding premium Indian hotels with galleries...');
        await Room.deleteMany({});
        await Booking.deleteMany({}); // Clear old mock bookings to avoid orphaned references
        await Room.insertMany(initialRooms);
        console.log('✅ Auto-seeding completed. 26 premium Indian hotels inserted.');
      } else {
        console.log(`📊 Database has ${roomCount} active room listings.`);
      }
    } catch (err) {
      console.error('⚠️ Seeding on startup failed:', err.message);
    }
  } else {
    console.log('⚠️ Running in offline/disconnected mode. Please configure MONGODB_URI to enable persistent queries.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 PromptInn Backend Server running on http://localhost:${PORT}`);
  });
};

startServer();
