import {   Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AuthRequest, JwtPayload } from '../interfaces/auth.interface';
import { AppError } from '../utils/AppError';

export const isAuthenticated = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];  

    if (!token) return next(new AppError('Unauthorized', 401));

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new AppError('User not found', 401));

    req.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
