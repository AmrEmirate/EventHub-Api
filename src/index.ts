import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
// [PERBAIKAN] Ubah cara impor swaggerDocument
import * as swaggerDocument from './swagger';

// Impor Rute
import authRoutes from './api/auth/auth.routes';
import eventRoutes from './api/events/events.routes';
import transactionRoutes from './api/transactions/transaction.routes';
import userRoutes from './api/users/user.routes';
import voucherRoutes from './api/vouchers/voucher.routes';
import reviewRoutes from './api/reviews/review.routes';
import dashboardRoutes from './api/dashboard/dashboard.routes';
import notificationRoutes from './api/notifications/notification.routes';
import { errorMiddleware } from './middlewares/error.middleware';

// Impor tugas cron
import './api/cron/expire-transactions';
import './api/cron/expire-points';
import './api/cron/cancel-pending-confirmations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// --- Middleware ---

// Konfigurasi CORS untuk mengizinkan permintaan dari frontend
const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan file statis dari folder 'public'
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// --- Rute API ---
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/events', eventRoutes);
apiRouter.use('/transactions', transactionRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/vouchers', voucherRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/notifications', notificationRoutes);

app.use('/api/v1', apiRouter);

// --- Dokumentasi API (Swagger) ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Penanganan Error ---
app.use(errorMiddleware);

// --- Jalankan Server ---
app.listen(PORT, () => {
  console.log(`⚡️ Server berjalan di http://localhost:${PORT}`);
});

export default app;
