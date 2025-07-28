import { Router } from 'express';
import { getMyNotificationsController, markAsReadController } from './notification.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// Rute untuk mendapatkan notifikasi milik pengguna
router.get('/me', authMiddleware, getMyNotificationsController);

// Rute untuk menandai semua notifikasi sebagai sudah dibaca
router.post('/me/mark-as-read', authMiddleware, markAsReadController);

export default router;