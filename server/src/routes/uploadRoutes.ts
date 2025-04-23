import express from 'express';
import multer from 'multer';
import { uploadImage, getImages, deleteImage } from '../controllers/uploadController.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    await uploadImage(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    await getImages(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteImage(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
