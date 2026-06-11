import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
    index: true,
  },
  price: {
    type: Number,
    required: true,
    index: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 4.5,
  },
  amenities: {
    type: [String],
    default: [],
    index: true,
  },
  image: {
    type: String,
    default: '',
  },
  totalRooms: {
    type: Number,
    required: true,
    default: 5,
  },
  availableRooms: {
    type: Number,
    required: true,
    default: 5,
  },
  mapQuery: {
    type: String,
    default: '',
  },
  images: {
    type: [String],
    default: [],
  }
}, {
  timestamps: true
});

// Case-insensitive index for location searches
roomSchema.index({ location: 'text' });

const Room = mongoose.model('Room', roomSchema);

export default Room;
