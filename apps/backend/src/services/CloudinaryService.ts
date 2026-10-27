import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from '../config';

// ─────────────────────────────────────────────────────────────────────────────
// CloudinaryService — Singleton for secure image upload/delete/optimize
// Stores images under: TimeToMeal/canteens/{canteenId}/dishes/
// ─────────────────────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  folder: string;
}

export class CloudinaryService {
  private static instance: CloudinaryService;
  private isConfigured: boolean;

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  private readonly ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  private readonly ROOT_FOLDER = 'TimeToMeal';

  private constructor() {
    const cloudName = config.cloudinaryCloudName;
    const apiKey = config.cloudinaryApiKey;
    let apiSecret = config.cloudinaryApiSecret;

    // Clean up double-dash artifacts from copy-pasting
    if (apiSecret.startsWith('--')) {
      apiSecret = apiSecret.replace(/^--/, '-');
    }

    this.isConfigured = !!(cloudName && apiKey && apiSecret);

    if (this.isConfigured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      console.log('☁️  CloudinaryService initialized successfully');
    } else {
      console.warn('⚠️  CloudinaryService: Missing credentials — operating in mock mode');
    }
  }

  public static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  // ─── VALIDATION ──────────────────────────────────────────────────────────────

  /**
   * Validates base64 image data for type and size.
   * Throws an Error if validation fails.
   */
  private validateBase64Image(base64Data: string): void {
    // Extract MIME type from data URI
    const mimeMatch = base64Data.match(/^data:(image\/\w+);base64,/);
    if (!mimeMatch) {
      throw new Error('Invalid image data. Expected a base64-encoded data URI (data:image/...;base64,...).');
    }

    const mimeType = mimeMatch[1];
    if (!this.ALLOWED_FORMATS.includes(mimeType)) {
      throw new Error(`Unsupported image format: ${mimeType}. Allowed: JPG, JPEG, PNG, WEBP.`);
    }

    // Estimate file size from base64 length (~75% of base64 string length)
    const base64Body = base64Data.split(',')[1] || '';
    const estimatedBytes = Math.ceil((base64Body.length * 3) / 4);
    if (estimatedBytes > this.MAX_FILE_SIZE) {
      const sizeMB = (estimatedBytes / (1024 * 1024)).toFixed(1);
      throw new Error(`Image size (${sizeMB} MB) exceeds the 5 MB limit.`);
    }
  }

  // ─── UPLOAD ──────────────────────────────────────────────────────────────────

  /**
   * Uploads a base64-encoded image to Cloudinary.
   * @param base64Image - Full data URI string (data:image/png;base64,...)
   * @param folder - Target folder path (will be prefixed with ROOT_FOLDER)
   * @returns CloudinaryUploadResult with public_id, secure_url, dimensions, etc.
   */
  public async uploadImage(base64Image: string, folder: string = ''): Promise<CloudinaryUploadResult> {
    this.validateBase64Image(base64Image);

    const fullFolder = folder
      ? `${this.ROOT_FOLDER}/${folder.replace(/^\/+|\/+$/g, '')}`
      : this.ROOT_FOLDER;

    if (!this.isConfigured) {
      console.warn('CloudinaryService: Mock mode — returning simulated upload result');
      return this.createMockResult(fullFolder);
    }

    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(base64Image, {
        folder: fullFolder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
        overwrite: false,
        unique_filename: true,
      });

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        folder: fullFolder,
      };
    } catch (err: any) {
      console.error('CloudinaryService.uploadImage error:', err);
      throw new Error(`Cloudinary upload failed: ${err.message || 'Unknown error'}`);
    }
  }

  /**
   * Uploads a food image for a specific canteen.
   * Enforces folder: TimeToMeal/canteens/{canteenId}/dishes/
   */
  public async uploadFoodImage(base64Image: string, canteenId: string): Promise<CloudinaryUploadResult> {
    const folder = `canteens/${canteenId}/dishes`;
    return this.uploadImage(base64Image, folder);
  }

  /**
   * Uploads a user profile image.
   * Enforces folder: TimeToMeal/users/profile-images/
   */
  public async uploadProfileImage(base64Image: string): Promise<CloudinaryUploadResult> {
    return this.uploadImage(base64Image, 'users/profile-images');
  }

  /**
   * Uploads a system image (logo, banner, etc.).
   * Enforces folder: TimeToMeal/system/{subfolder}/
   */
  public async uploadSystemImage(base64Image: string, subfolder: string): Promise<CloudinaryUploadResult> {
    return this.uploadImage(base64Image, `system/${subfolder}`);
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────────

  /**
   * Deletes an image from Cloudinary by its public_id.
   */
  public async deleteImage(publicId: string): Promise<{ success: boolean; result: string }> {
    if (!publicId) {
      throw new Error('Public ID is required to delete an image.');
    }

    if (!this.isConfigured) {
      console.warn('CloudinaryService: Mock mode — simulating deletion');
      return { success: true, result: 'mock_deleted' };
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return {
        success: result.result === 'ok',
        result: result.result,
      };
    } catch (err: any) {
      console.error('CloudinaryService.deleteImage error:', err);
      throw new Error(`Cloudinary deletion failed: ${err.message || 'Unknown error'}`);
    }
  }

  /**
   * Deletes a food image and ensures the public_id belongs to the correct canteen folder.
   * Security: Prevents deleting images outside the canteen's folder.
   */
  public async deleteFoodImage(publicId: string, canteenId: string): Promise<{ success: boolean; result: string }> {
    const expectedPrefix = `${this.ROOT_FOLDER}/canteens/${canteenId}/`;
    if (!publicId.startsWith(expectedPrefix)) {
      throw new Error(`Forbidden: Cannot delete image outside canteen folder. Expected prefix: ${expectedPrefix}`);
    }
    return this.deleteImage(publicId);
  }

  // ─── UPDATE (Replace) ───────────────────────────────────────────────────────

  /**
   * Replaces a food image: deletes the old one and uploads a new one.
   */
  public async updateFoodImage(
    newBase64Image: string,
    oldPublicId: string | null,
    canteenId: string
  ): Promise<CloudinaryUploadResult> {
    // Delete old image if it exists (non-blocking — don't fail if delete fails)
    if (oldPublicId) {
      try {
        await this.deleteFoodImage(oldPublicId, canteenId);
      } catch (err) {
        console.warn('CloudinaryService: Failed to delete old image during update:', err);
      }
    }
    return this.uploadFoodImage(newBase64Image, canteenId);
  }

  // ─── URL OPTIMIZATION ───────────────────────────────────────────────────────

  /**
   * Generates an optimized Cloudinary URL with auto-format and auto-quality.
   */
  public generateOptimizedUrl(publicId: string, options?: { width?: number; height?: number }): string {
    if (!this.isConfigured) {
      return `https://res.cloudinary.com/demo/image/upload/${publicId}`;
    }

    const transformations: any[] = [
      { quality: 'auto', fetch_format: 'auto' },
    ];

    if (options?.width || options?.height) {
      transformations.push({
        width: options.width,
        height: options.height,
        crop: 'fill',
        gravity: 'auto',
      });
    }

    return cloudinary.url(publicId, {
      secure: true,
      transformation: transformations,
    });
  }

  // ─── MOCK ────────────────────────────────────────────────────────────────────

  private createMockResult(folder: string): CloudinaryUploadResult {
    const mockId = `${folder}/mock_${Date.now()}`;
    return {
      public_id: mockId,
      secure_url: `https://res.cloudinary.com/demo/image/upload/v1/${mockId}.jpg`,
      url: `http://res.cloudinary.com/demo/image/upload/v1/${mockId}.jpg`,
      width: 800,
      height: 600,
      format: 'jpg',
      bytes: 0,
      folder,
    };
  }
}
