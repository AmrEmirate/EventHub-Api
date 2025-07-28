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

// [BARU] Sajikan file statis dari folder 'public'
// Ini memungkinkan akses ke http://localhost:8000/uploads/namafile.jpg
app.use(express.static('public'));

// Rate Limiter umum untuk semua API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah 15 menit',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate Limiter khusus untuk endpoint login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Terlalu banyak percobaan login, silakan coba lagi setelah 15 menit',
});

app.use('/api/', apiLimiter);

// --- Rute Dasar ---
app.get('/', (req: Request, res: Response) => {
  res.send('Selamat datang di API Platform Manajemen Event!');
});

// --- Pendaftaran Rute Fitur ---
app.use('/api/v1/auth', loginLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/vouchers', voucherRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// --- Pendaftaran Rute Cron Job ---
app.use('/api/cron/expire-transactions', expireTransactionsHandler);
app.use('/api/cron/expire-points', expirePointsHandler);

// --- Middleware Penangan Error ---
app.use(errorMiddleware);

// Jalankan Server
app.listen(port, () => {
  console.log(`⚡️ [server]: Server berjalan di http://localhost:${port}`);
});