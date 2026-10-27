export const CLOUDINARY_CONFIG = {
  cloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo',
  uploadPreset: process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned',
};
