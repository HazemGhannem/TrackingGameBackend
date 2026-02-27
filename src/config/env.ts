import dotenv from 'dotenv';
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET as string;
export const MONGO_URI = process.env.MONGO_URI as string;
export const PORT = process.env.PORT as string;
export const RIOT_API_KEY = process.env.RIOT_API_KEY as string;
export const REDIS_URL = process.env.REDIS_URL as string;
export const FRONTEND_URL = process.env.FRONTEND_URL as string;
