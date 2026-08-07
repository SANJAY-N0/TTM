import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { sendError, UserRole } from '../constants';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    college_id?: string;
    canteen_id?: string;
  };
}

export const authenticateJwt = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Unauthorized access. Token missing or invalid.', [], 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token.', [], 401);
  }
};

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Forbidden. You do not have permission to perform this action.', [], 403);
    }
    next();
  };
};

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`);
      return sendError(res, 'Validation Error', formattedErrors, 400);
    }
    req.body = result.data;
    next();
  };
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('⚠️ Centralized Error Handler Caught Exception:', err.message || err);
  // Security rule: Never expose stack traces or raw SQL errors to clients in production
  const isProd = config.env === 'production';
  const message = isProd ? 'Internal Server Error' : (err.message || 'Something went wrong');
  return sendError(res, message, [], err.statusCode || 500);
};
