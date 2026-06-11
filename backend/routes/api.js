import express from 'express';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { parsePromptToMongo } from '../services/geminiParser.js';

const router = express.Router();
import initialRooms from '../config/initialRooms.js';

// Seed data helper
// Helper to seed rooms if database is empty or lacks Indian hotels
router.get('/seed', async (req, res) => {
  try {
    const count = await Room.countDocuments();
    const hasIndianHotels = await Room.findOne({ location: /India/i });
    if (count < 10 || !hasIndianHotels) {
      await Room.deleteMany({});
      await Booking.deleteMany({});
      await Room.insertMany(initialRooms);
      return res.status(201).json({ message: "Database wiped and re-seeded with 26 premium Indian hotels!" });
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

// Bookings: Update booking (Admin/User)
router.put('/bookings/:id', async (req, res) => {
  try {
    const { customerName, checkIn, checkOut, roomId } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    
    // If room is changing, update availability
    if (roomId && roomId !== booking.room.toString()) {
      // Revert old room
      const oldRoom = await Room.findById(booking.room);
      if (oldRoom) {
        oldRoom.availableRooms += 1;
        await oldRoom.save();
      }
      
      // Deduct from new room
      const newRoom = await Room.findById(roomId);
      if (!newRoom) {
        return res.status(404).json({ error: "New room not found." });
      }
      if (newRoom.availableRooms <= 0) {
        return res.status(400).json({ error: "No inventory available in new room." });
      }
      newRoom.availableRooms -= 1;
      await newRoom.save();
      booking.room = roomId;
    }

    if (customerName) booking.customerName = customerName;
    if (checkIn) booking.checkIn = new Date(checkIn);
    if (checkOut) booking.checkOut = new Date(checkOut);
    
    // Recalculate price if dates or room changed
    if (checkIn || checkOut || (roomId && roomId !== booking.room.toString())) {
      const room = await Room.findById(booking.room);
      if (room) {
        const start = new Date(booking.checkIn);
        const end = new Date(booking.checkOut);
        const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        booking.totalPrice = room.price * nights;
      }
    }

    const saved = await booking.save();
    const populated = await Booking.findById(saved._id).populate('room');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bookings: Delete/Cancel booking (Admin/User)
router.delete('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    
    // Increment room availability back
    const room = await Room.findById(booking.room);
    if (room) {
      room.availableRooms = Math.min(room.totalRooms, room.availableRooms + 1);
      await room.save();
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted/cancelled successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Users: Get all users (Admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Users: Create new user (Admin)
router.post('/users', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }
    const normalizedUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: normalizedUsername });
    if (existing) {
      return res.status(400).json({ error: "Username is already taken." });
    }
    const newUser = new User({
      username: normalizedUsername,
      password: password,
      role: role || 'user'
    });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Users: Update user (Admin)
router.put('/users/:id', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (username) {
      const normalizedUsername = username.trim().toLowerCase();
      if (normalizedUsername !== user.username) {
        const existing = await User.findOne({ username: normalizedUsername });
        if (existing) {
          return res.status(400).json({ error: "Username is already taken." });
        }
        user.username = normalizedUsername;
      }
    }
    if (password) user.password = password;
    if (role) user.role = role;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Users: Delete user (Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    // Delete all bookings associated with this user
    await Booking.deleteMany({ user: req.params.id });
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User and associated bookings deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
