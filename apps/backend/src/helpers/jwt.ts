import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'timetomeal_super_secret_jwt_key_2026';

export const signToken = (payload: object, expiresIn = '7d'): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

export const verifyToken = <T>(token: string): T => {
  return jwt.verify(token, JWT_SECRET) as T;
};
