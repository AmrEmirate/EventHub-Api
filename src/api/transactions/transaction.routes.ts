import { Router } from 'express';
import * as controller from './transaction.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

// --- Rute untuk Pengguna (Customer) ---
router.post('/', authMiddleware, controller.createTransactionController);
router.get('/me', authMiddleware, controller.getMyTransactionsController);

// --- Rute untuk Penyelenggara (Organizer) ---
// [PERBAIKAN] Pindahkan rute statis ini ke ATAS rute dinamis '/:id'
router.get('/organizer', authMiddleware, controller.getOrganizerTransactionsController);
router.post('/organizer/:id/approve', authMiddleware, controller.approveTransactionController);
router.post('/organizer/:id/reject', authMiddleware, controller.rejectTransactionController);

// [PERBAIKAN] Rute dinamis '/:id' sekarang berada di bawah rute yang lebih spesifik
router.get('/:id', authMiddleware, controller.getTransactionByIdController);

router.post(
  '/:id/upload', 
  authMiddleware, 
  upload.single('paymentProof'), 
  controller.uploadPaymentProofController
);
router.post('/:id/cancel', authMiddleware, controller.cancelTransactionController);

export default router;