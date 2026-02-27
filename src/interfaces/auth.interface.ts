import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    username: string;
    email: string;
  };
}
export interface JwtPayload {
  id: string;
}
