import { v2 as cloudinary } from 'cloudinary';
import { EnvironmentService } from '../services/EnvironmentService';

export const configureCloudinary = () => {
  const envService = EnvironmentService.getInstance();
  const isProd = envService.isProduction();
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  const apiKey = process.env.CLOUDINARY_API_KEY || '';
  let apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  
  if (apiSecret.startsWith('--')) {
    apiSecret = apiSecret.replace(/^--/, '-');
  }

  const isConfigured = !!(cloudName && apiKey && apiSecret);

  if (isConfigured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
  }
  
  return { isConfigured, cloudinary, isProd };
};
