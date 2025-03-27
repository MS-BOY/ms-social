import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface UploadResult {
  url: string;
  publicId: string;
  resourceType: string;
}

/**
 * Upload a file to Cloudinary
 * @param fileBuffer - Buffer containing the file data
 * @param options - Upload options (folder, resource_type, etc.)
 * @returns Promise<UploadResult>
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: { folder?: string; resource_type?: 'image' | 'video' | 'raw' | 'auto' } = {}
): Promise<UploadResult> {
  try {
    // Set default options
    const uploadOptions = {
      folder: options.folder || 'echo-social',
      resource_type: options.resource_type || 'auto' as 'auto', // 'auto' detects if it's image or video
    };

    // Convert Buffer to base64 for Cloudinary upload
    const base64File = `data:;base64,${fileBuffer.toString('base64')}`;
    
    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(base64File, uploadOptions, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param resourceType - The resource type (image, video, etc.)
 * @returns Promise<boolean>
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'image'
): Promise<boolean> {
  try {
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
}

export default cloudinary;