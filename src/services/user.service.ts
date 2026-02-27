import jwt from 'jsonwebtoken';
import { IUser, IUserDocument, LoginData } from '../interfaces/user.interface';
import { User } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { JWT_SECRET } from '../config/env';

export const signupUser = async (userData: IUser) => {
  const { username, email, password } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  const newUser: IUserDocument = await User.create({
    username,
    email,
    password,
  });
  return newUser.toJSON();
};

export const loginUser = async ({ email, password }: LoginData) => {
  if (!JWT_SECRET) {
    throw new AppError('JWT_SECRET is not defined', 500);
  }

  const user: IUserDocument | null = await User.findOne({ email }).select(
    '+password',
  );
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return { token, user: user.toJSON() };
};
