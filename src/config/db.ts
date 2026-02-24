import mongoose from 'mongoose';
import { MONGO_URI } from './env';

mongoose.set('strictQuery', true);
export const connectDB = async () => {
  const uri = MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not defined in .env');

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected to database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
export default connectDB;
