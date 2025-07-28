import { Router } from 'express';
import { getMyVouchersController, createOrganizerVoucherController } from './voucher.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// Rute untuk customer mendapatkan vouchernya
router.get('/me', authMiddleware, getMyVouchersController);

// [RUTE BARU] Rute untuk organizer membuat voucher
router.post('/organizer', authMiddleware, createOrganizerVoucherController);

export default router;