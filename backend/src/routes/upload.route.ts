import {Router} from "express";
import {requireAuth, requireRole} from "../middlewares/auth.middleware.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import logger from "../config/logger.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // 5MB cap

router.post('/', requireAuth, requireRole('ADMIN'), upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  try {
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'tabletab/menu-items' },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file!.buffer);
    });
    
    logger.info(`Image uploaded to Cloudinary: ${uploadResult.secure_url}`);
    res.status(201).json({ imageUrl: uploadResult.secure_url });
  } catch (err) {
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Unknown error';
    logger.error('Image upload failed:', err);
    res.status(500).json({ error: 'Image upload failed', details: message });
  }
});

export default router;