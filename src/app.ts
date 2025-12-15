import express, { Request, Response, NextFunction } from "express";
import "./types"; // Force load types
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
// [PERBAIKAN] Ubah cara impor swaggerDocument
import swaggerDocument from "./config/swagger";

// Impor Rute
import authRoutes from "./routers/auth.routes";
import eventRoutes from "./routers/events.routes";
import transactionRoutes from "./routers/transaction.routes";
import userRoutes from "./routers/user.routes";
import voucherRoutes from "./routers/voucher.routes";
import reviewRoutes from "./routers/review.routes";
import dashboardRoutes from "./routers/dashboard.routes";
import notificationRoutes from "./routers/notification.routes";
import { errorMiddleware } from "./middleware/error.middleware";

// Impor tugas cron
import "./service/expire-transactions.service";
import "./service/expire-points.service";
import "./service/cancel-pending-confirmations.service";

dotenv.config();

const app = express();

// --- Middleware ---

// Konfigurasi CORS untuk mengizinkan permintaan dari frontend
const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan file statis dari folder 'public'
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// --- Rute API ---
const apiRouter = express.Router();
apiRouter.use("/auth", authRoutes);
apiRouter.use("/events", eventRoutes);
apiRouter.use("/transactions", transactionRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/vouchers", voucherRoutes);
apiRouter.use("/reviews", reviewRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
apiRouter.use("/notifications", notificationRoutes);

app.use("/api/v1", apiRouter);

// --- Dokumentasi API (Swagger) ---
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Penanganan Error ---
app.use(errorMiddleware);

export default app;
