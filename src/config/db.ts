import mongoose from 'mongoose';
import { MONGO_URI } from './env';

mongoose.set('strictQuery', true);

const connectDB = async (): Promise<void> => {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI not defined in environment variables');
  }

  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    mongoose.connection.on('connected', () => {
      console.info(`MongoDB connected: ${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
};

export default connectDB;
export { connectDB };
