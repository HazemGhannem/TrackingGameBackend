import { Request, Response } from 'express';
import { signupUser, loginUser } from '../services/user.service';

export const signup = async (req: Request, res: Response) => {
  try {
    const user = await signupUser(req.body);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
};

// Login controller
export const login = async (req: Request, res: Response) => {
  try {
    console.log(req.body, 'hel');
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: true,  
      sameSite: 'none',  
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(200).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 401).json({ error: err.message });
  }
};
