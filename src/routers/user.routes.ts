import { Router } from "express";
import {
  getMeController,
  updateMeController,
  changePasswordController,
  updateMyAvatarController,
} from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.get("/me", authMiddleware, getMeController);
router.put("/me", authMiddleware, updateMeController);
router.put("/me/change-password", authMiddleware, changePasswordController);

// [RUTE BARU] Rute untuk upload avatar
// Gunakan middleware `upload.single('avatar')` untuk menangani satu file dari field bernama 'avatar'
router.put(
  "/me/avatar",
  authMiddleware,
  upload.single("avatar"),
  updateMyAvatarController
);

export default router;
