import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Impor Rute Fitur
import authRoutes from './api/auth/auth.routes';
import userRoutes from './api/users/user.routes';
import voucherRoutes from './api/vouchers/voucher.routes';
import eventRoutes from './api/events/events.routes';
import transactionRoutes from './api/transactions/transaction.routes';
import reviewRoutes from './api/reviews/review.routes';
import dashboardRoutes from './api/dashboard/dashboard.routes';
import notificationRoutes from './api/notifications/notification.routes'; // <-- Impor baru

// Impor Handler Cron Job
import expireTransactionsHandler from './api/cron/expire-transactions';
import expirePointsHandler from './api/cron/expire-points';

// Impor Middleware Error
import { errorMiddleware } from './middlewares/error.middleware';

dotenv.config();
const app: Express = express();
const port = process.env.PORT || 8000;

// --- Middleware Keamanan ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate Limiter
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use('/api/', apiLimiter);

// --- Rute Dasar ---
app.get('/', (req: Request, res: Response) => {
  res.send('Selamat datang di API EventHub!');
});

// --- Pendaftaran Rute Fitur ---
app.use('/api/v1/auth', loginLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/vouchers', voucherRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/notifications', notificationRoutes); // <-- Daftarkan rute baru di sini

// --- Pendaftaran Rute Cron Job ---
app.use('/api/cron/expire-transactions', expireTransactionsHandler);
app.use('/api/cron/expire-points', expirePointsHandler);

// --- Middleware Penangan Error ---
app.use(errorMiddleware);

// Jalankan Server
app.listen(port, () => {
  console.log(`⚡️ Server berjalan di http://localhost:${port}`);
});