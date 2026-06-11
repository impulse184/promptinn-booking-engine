import express from 'express';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { parsePromptToMongo } from '../services/geminiParser.js';

const router = express.Router();

// Seed data helper
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
    description: "Charming rooms overlooking a quiet private garden in Paris. Fully air-conditioned with a full kitchen layout for longer stays.",
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

// Helper to seed rooms if database is empty
router.get('/seed', async (req, res) => {
  try {
    const count = await Room.countDocuments();
    if (count === 0) {
      await Room.insertMany(initialRooms);
      return res.status(201).json({ message: "Database seeded successfully with initial hotel listings!" });
    }
    res.json({ message: `Database already has ${count} listings. Seeding skipped.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth: Register
router.post('/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const normalizedUsername = username.trim().toLowerCase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    const role = normalizedUsername === 'aakrisht' ? 'admin' : 'user';

    const newUser = new User({
      username: normalizedUsername,
      password: password,
      role
    });

    await newUser.save();
    
    res.status(201).json({
      message: "Registration successful!",
      user: {
        _id: newUser._id,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth: Login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const normalizedUsername = username.trim().toLowerCase();
    
    const user = await User.findOne({ username: normalizedUsername });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    res.json({
      message: "Login successful!",
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Search Endpoint
router.post('/search', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Search prompt is required." });
    }

    // Call Gemini Parser to translate natural language prompt to MongoDB filter object
    const parserResult = await parsePromptToMongo(prompt);
    const { filter, explanation } = parserResult;

    // Search MongoDB using the parsed filter
    const rooms = await Room.find(filter);

    res.json({
      filter,
      explanation,
      rooms
    });
  } catch (error) {
    console.error('API Search Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// CRUD: Get all rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({});
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRUD: Create new room (Admin)
router.post('/rooms', async (req, res) => {
  try {
    const { title, description, location, price, rating, amenities, image, totalRooms } = req.body;
    
    const newRoom = new Room({
      title,
      description,
      location,
      price: Number(price),
      rating: Number(rating) || 4.5,
      amenities: Array.isArray(amenities) ? amenities : [],
      image: image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      totalRooms: Number(totalRooms) || 5,
      availableRooms: Number(totalRooms) || 5
    });

    const savedRoom = await newRoom.save();
    res.status(201).json(savedRoom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// CRUD: Update room (Admin)
router.put('/rooms/:id', async (req, res) => {
  try {
    const { title, description, location, price, rating, amenities, image, totalRooms, availableRooms } = req.body;
    
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        location,
        price: Number(price),
        rating: Number(rating),
        amenities: Array.isArray(amenities) ? amenities : [],
        image,
        totalRooms: Number(totalRooms),
        availableRooms: Number(availableRooms)
      },
      { new: true, runValidators: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({ error: "Room not found." });
    }

    res.json(updatedRoom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// CRUD: Delete room (Admin)
router.delete('/rooms/:id', async (req, res) => {
  try {
    const deletedRoom = await Room.findByIdAndDelete(req.params.id);
    if (!deletedRoom) {
      return res.status(404).json({ error: "Room not found." });
    }
    // Delete any associated bookings
    await Booking.deleteMany({ room: req.params.id });
    res.json({ message: "Room and associated bookings deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bookings: Place booking
router.post('/bookings', async (req, res) => {
  try {
    const { roomId, customerName, checkIn, checkOut, userId } = req.body;
    
    if (!roomId || !customerName || !checkIn || !checkOut) {
      return res.status(400).json({ error: "Missing required booking details." });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room listing not found." });
    }

    if (room.availableRooms <= 0) {
      return res.status(400).json({ error: "No inventory available. This room is fully booked!" });
    }

    // Calculate nights and price
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const totalPrice = room.price * nights;

    // Save booking
    const newBooking = new Booking({
      room: roomId,
      user: userId,
      customerName,
      checkIn: start,
      checkOut: end,
      totalPrice
    });

    // Update Room availability atomically
    room.availableRooms -= 1;
    await room.save();
    
    const savedBooking = await newBooking.save();
    
    // Return booking with populated room details
    const populated = await Booking.findById(savedBooking._id).populate('room');
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bookings: Get all bookings (optional filter by userId)
router.get('/bookings', async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { user: userId } : {};
    const bookings = await Booking.find(query).populate('room').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
