import { Router } from 'express';
import * as controller from './transaction.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { upload } from '../../middlewares/upload.middleware';

const router = Router();

// --- Rute untuk Pengguna (Customer) ---
router.post('/', authMiddleware, controller.createTransactionController);
router.get('/me', authMiddleware, controller.getMyTransactionsController);

// [RUTE BARU] Rute untuk mendapatkan detail satu transaksi
router.get('/:id', authMiddleware, controller.getTransactionByIdController);

router.post(
  '/:id/upload', 
  authMiddleware, 
  upload.single('paymentProof'), 
  controller.uploadPaymentProofController
);
router.post('/:id/cancel', authMiddleware, controller.cancelTransactionController);


// --- Rute untuk Penyelenggara (Organizer) ---
router.get('/organizer', authMiddleware, controller.getOrganizerTransactionsController);
router.post('/organizer/:id/approve', authMiddleware, controller.approveTransactionController);
router.post('/organizer/:id/reject', authMiddleware, controller.rejectTransactionController);

export default router;