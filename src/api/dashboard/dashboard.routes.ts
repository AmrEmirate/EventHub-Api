import { Router } from 'express';
// [PERBAIKAN] Impor hanya satu controller yang ada
import { getOrganizerDashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// [PERBAIKAN] Gunakan hanya satu rute untuk mengambil semua data dasbor
router.get('/', authMiddleware, getOrganizerDashboardController);

export default router;