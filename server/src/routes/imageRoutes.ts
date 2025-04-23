import express from 'express';
import multer from 'multer';
import { 
  getImages, 
  getImageById, 
  createImage, 
  updateImage, 
  deleteImage 
} from '../controllers/imageController.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET all images
router.get('/', async (req, res, next) => {
  try {
    await getImages(req, res);
  } catch (error) {
    next(error);
  }
});

// GET image by ID
router.get('/:id', async (req, res, next) => {
  try {
    await getImageById(req, res);
  } catch (error) {
    next(error);
  }
});

// POST create new image with metadata and upload to S3
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    await createImage(req, res);
  } catch (error) {
    next(error);
  }
});

// PUT update image by ID
router.put('/:id', async (req, res, next) => {
  try {
    await updateImage(req, res);
  } catch (error) {
    next(error);
  }
});

// DELETE image by ID
router.delete('/:id', async (req, res, next) => {
  try {
    await deleteImage(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
