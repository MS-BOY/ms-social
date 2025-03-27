import multer from 'multer';
import { Request, Response, Router } from 'express';
import { uploadToCloudinary, deleteFromCloudinary } from './cloudinary';

// Set up multer for in-memory storage (we'll send buffer directly to Cloudinary)
const storage = multer.memoryStorage();

// Configure upload limits - 10MB max for images, 50MB for videos
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only images and videos are allowed.') as any);
    }
  },
});

// Create router
const uploadRouter = Router();

// Middleware to handle multer errors
const handleMulterErrors = (err: any, req: Request, res: Response, next: Function) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Max size is 10MB for images and 50MB for videos.' 
      });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Routes
uploadRouter.post('/media', upload.single('file'), handleMulterErrors, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    const folder = fileType === 'image' ? 'images' : 'videos';

    // Upload to Cloudinary
    const result = await uploadToCloudinary(fileBuffer, {
      folder,
      resource_type: fileType as 'image' | 'video'
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Error uploading file' });
  }
});

// Route to delete media
uploadRouter.delete('/media/:publicId', async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;
    const resourceType = (req.query.type as 'image' | 'video' | 'raw' | 'auto') || 'image';

    // Delete from Cloudinary
    const result = await deleteFromCloudinary(publicId, resourceType);

    if (result) {
      return res.status(200).json({ message: 'File deleted successfully' });
    } else {
      return res.status(404).json({ message: 'File not found or already deleted' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ message: 'Error deleting file' });
  }
});

export default uploadRouter;