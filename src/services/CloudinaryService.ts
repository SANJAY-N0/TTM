import { configureCloudinary } from '../lib/cloudinary';

export class CloudinaryService {
  private static instance: CloudinaryService;
  
  private constructor() {}

  public static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  public async uploadImage(imageString: string, folder: string) {
    const { isConfigured, cloudinary, isProd } = configureCloudinary();
    
    if (!isConfigured) {
      console.log(`[CloudinaryService] Mock upload to folder ${folder}`);
      return {
        secure_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
        public_id: `mock_id_${Date.now()}`,
        format: 'jpg',
        bytes: 1024,
        width: 800,
        height: 600,
        is_mock: true
      };
    }

    try {
      const result = await cloudinary.uploader.upload(imageString, {
        folder: isProd ? folder : `dev_${folder}`,
        resource_type: 'auto'
      });
      
      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        is_mock: false
      };
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      throw new Error(err.message || 'Failed to upload image');
    }
  }

  public async deleteImage(publicId: string) {
    const { isConfigured, cloudinary } = configureCloudinary();
    
    if (!isConfigured || publicId.startsWith('mock_id_')) {
      console.log(`[CloudinaryService] Mock delete for ${publicId}`);
      return { success: true, is_mock: true };
    }
    
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return { success: true, result };
    } catch (err: any) {
      console.error('Cloudinary delete error:', err);
      throw new Error(err.message || 'Failed to delete image');
    }
  }
}
