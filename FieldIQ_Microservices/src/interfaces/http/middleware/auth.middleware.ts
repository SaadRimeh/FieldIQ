import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    name: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization header missing or malformed' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      role: string;
      name: string;
    };

    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch (err) {
    const message =
      err instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token';
    res.status(401).json({ success: false, error: message });
  }
}

export function adminOnly(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  next();
}

export function employeeOnly(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'EMPLOYEE') {
    res.status(403).json({ success: false, error: 'Employee access required' });
    return;
  }
  next();
}
