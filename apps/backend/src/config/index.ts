import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-timetomeal-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Cashfree Payment Gateway
  cashfreeAppId: process.env.CASHFREE_APP_ID || 'TEST1115864987dc532ebfcdde0745ef94685111',
  cashfreeSecretKey: process.env.CASHFREE_SECRET_KEY || 'TvYRWi6_uF8azvYG0V_SBJAJgjE',
  cashfreeEnv: process.env.CASHFREE_ENV || 'SANDBOX',

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
};
