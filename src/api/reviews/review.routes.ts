import { Router } from 'express';
import { createReviewController } from './review.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware'; // Impor middleware upload

const router = Router();

// Tambahkan middleware upload untuk menangani file 'imageUrl'
router.post('/', authMiddleware, upload.single('imageUrl'), createReviewController);

export default router;
