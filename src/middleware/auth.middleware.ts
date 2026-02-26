import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';

interface JwtPayload {
  id: string;
}

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    username: string;
    email: string;
  };
}

export const isAuthenticated = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.esports_token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
