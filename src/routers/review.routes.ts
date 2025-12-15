import { Router } from "express";
import { createReviewController } from "../controllers/review.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware"; // Impor middleware upload

const router = Router();

// Tambahkan middleware upload untuk menangani file 'imageUrl'
router.post(
  "/",
  authMiddleware,
  upload.single("imageUrl"),
  createReviewController
);

export default router;
