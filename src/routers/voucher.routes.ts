import { Router } from "express";
import {
  getMyVouchersController,
  createOrganizerVoucherController,
} from "../controllers/voucher.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Rute untuk customer mendapatkan vouchernya
router.get("/me", authMiddleware, getMyVouchersController);

// [RUTE BARU] Rute untuk organizer membuat voucher
router.post("/organizer", authMiddleware, createOrganizerVoucherController);

export default router;
