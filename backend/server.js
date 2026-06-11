import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';
import Room from './models/Room.js';

// Load environmental variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api', apiRoutes);

// Simple healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Start server after establishing DB connection
const startServer = async () => {
  // Connect to live MongoDB
  const conn = await connectDB();
  
  if (conn) {
    try {
      // Auto-seed rooms if database is empty on start
      const roomCount = await Room.countDocuments();
      if (roomCount === 0) {
        console.log('🌱 Database is empty. Auto-seeding initial hotel rooms...');
        // We import the initialRooms directly from api.js or re-define here
        // Seeding by calling the internal router logic or helper:
        const initialRooms = [
          {
            title: "Tokyo Luxury Spa & Suites",
            description: "Experience world-class hospitality in the heart of Tokyo. Features a full-service hot spring spa, indoor swimming pool, and stunning skyline views.",
            location: "Tokyo, Japan",
            price: 380,
            rating: 4.8,
            amenities: ["wifi", "pool", "spa", "ac", "breakfast"],
            image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80",
            totalRooms: 5,
            availableRooms: 5
          },
          {
            title: "London Budget Cozy Inn",
            description: "Affordable and cozy rooms located steps away from public transport. Includes free English breakfast and high-speed Wi-Fi.",
            location: "London, UK",
            price: 85,
            rating: 4.1,
            amenities: ["wifi", "breakfast", "parking"],
            image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
            totalRooms: 10,
            availableRooms: 10
          },
          {
            title: "Seattle Urban Gym & Lofts",
            description: "Sleek, modern apartments in downtown Seattle. Equipped with a complete in-unit kitchen, pet-friendly services, and access to a premium fitness center.",
            location: "Seattle, USA",
            price: 210,
            rating: 4.6,
            amenities: ["wifi", "gym", "ac", "kitchen", "pets"],
            image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80",
            totalRooms: 6,
            availableRooms: 6
          },
          {
            title: "Paris Garden Boutique Stay",
            description: "Charming rooms overlooking a private garden in Paris. Fully air-conditioned with a full kitchen layout for longer stays.",
            location: "Paris, France",
            price: 175,
            rating: 4.7,
            amenities: ["wifi", "ac", "breakfast", "kitchen"],
            image: "https://images.unsplash.com/photo-1499955085172-a104c9463ece?auto=format&fit=crop&w=600&q=80",
            totalRooms: 4,
            availableRooms: 4
          },
          {
            title: "Miami Palm Beach Villa",
            description: "Vibrant beachside villa with an outdoor pool, private cabanas, and valet parking. Pet-friendly and fully equipped.",
            location: "Miami, USA",
            price: 295,
            rating: 4.9,
            amenities: ["wifi", "pool", "spa", "parking", "ac", "pets"],
            image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
            totalRooms: 3,
            availableRooms: 3
          }
        ];
        await Room.insertMany(initialRooms);
        console.log('✅ Auto-seeding completed. 5 listings inserted.');
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
