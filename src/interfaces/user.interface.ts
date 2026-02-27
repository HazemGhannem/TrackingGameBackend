import { Document, Types } from 'mongoose';

export interface IUser {
  username: string;
  email: string;
  password: string;
  favorites: Types.ObjectId[];
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidate: string): Promise<boolean>;
}
export interface LoginData {
  email: string;
  password: string;
}
