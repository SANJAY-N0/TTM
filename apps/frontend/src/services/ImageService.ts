export class ImageService {
  private static instance: ImageService;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  
  private constructor() {}

  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }
  
  public validateImage(file: File) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid image format. Only JPG, PNG, and WEBP are allowed.');
    }
    
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('Image size exceeds 5MB limit.');
    }
    
    return true;
  }

  private async uploadToApi(base64Image: string, folder: string) {
    const response = await fetch('/api/cloudinary/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image, folder })
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload image');
    }
    return response.json();
  }

  public async uploadFoodImage(base64Image: string, canteenId: string) {
    return this.uploadToApi(base64Image, `canteens/${canteenId}/dishes`);
  }

  public async uploadProfileImage(base64Image: string) {
    return this.uploadToApi(base64Image, 'users/students');
  }
  
  public async uploadLogo(base64Image: string, canteenId: string) {
    return this.uploadToApi(base64Image, `canteens/${canteenId}/logo`);
  }

  public async deleteImage(publicId: string) {
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: publicId })
    });
    if (!response.ok) throw new Error('Failed to delete image');
    return response.json();
  }

  public async replaceFoodImage(newBase64: string, oldPublicId: string, canteenId: string) {
    if (oldPublicId) {
      await this.deleteImage(oldPublicId).catch(err => console.warn('Failed to delete old image:', err));
    }
    return this.uploadFoodImage(newBase64, canteenId);
  }
}
