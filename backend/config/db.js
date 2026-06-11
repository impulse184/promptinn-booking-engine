import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) {
      console.warn('⚠️ WARNING: MONGODB_URI is not defined in environment variables. Backend will not connect to database.');
      return null;
    }
    
    // Connect to MongoDB
    const conn = await mongoose.connect(connStr);
    console.log(`🔌 MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
