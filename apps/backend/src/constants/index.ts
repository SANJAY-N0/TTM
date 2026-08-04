import { Response } from 'express';

export enum UserRole {
  STUDENT = 'STUDENT',
  CANTEEN = 'CANTEEN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export const sendSuccess = <T>(res: Response, message: string, data?: T, statusCode = 200) => {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data: data || {}
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (res: Response, message: string, errors: any[] = [], statusCode = 400) => {
  const payload: ApiResponse = {
    success: false,
    message,
    errors
  };
  return res.status(statusCode).json(payload);
};
