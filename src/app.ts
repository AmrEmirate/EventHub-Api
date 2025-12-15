import express, { Application, Request, Response, NextFunction } from "express";
import "./types"; // Force load types
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import passport from "./config/passport";
import swaggerUi from "swagger-ui-express";
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
import "./cron/expire-transactions";
import "./cron/expire-points";
import "./cron/cancel-pending-confirmations";

dotenv.config();

class App {
  public app: Application;
  private readonly isDevelopment: boolean;

  constructor() {
    this.app = express();
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Konfigurasi CORS untuk mengizinkan permintaan dari frontend
    const corsOptions = {
      origin:
        process.env.CORS_ORIGIN ||
        process.env.FE_URL ||
        "http://localhost:3000",
      credentials: true,
      optionsSuccessStatus: 200,
    };
    this.app.use(cors(corsOptions));

    // Initialize Passport
    this.app.use(passport.initialize());

    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Sajikan file statis dari folder 'public'
    this.app.use(
      "/uploads",
      express.static(path.join(__dirname, "../public/uploads"))
    );

    // Request logging middleware (only in development)
    if (this.isDevelopment) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
      });
    }
  }

  private initializeRoutes(): void {
    const apiRouter = express.Router();

    // Register all routes
    apiRouter.use("/auth", authRoutes);
    apiRouter.use("/events", eventRoutes);
    apiRouter.use("/transactions", transactionRoutes);
    apiRouter.use("/users", userRoutes);
    apiRouter.use("/vouchers", voucherRoutes);
    apiRouter.use("/reviews", reviewRoutes);
    apiRouter.use("/dashboard", dashboardRoutes);
    apiRouter.use("/notifications", notificationRoutes);

    // Mount API router
    this.app.use("/api/v1", apiRouter);

    // Health check endpoint
    this.app.get("/health", (req: Request, res: Response) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    });
  }

  private initializeSwagger(): void {
    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument)
    );
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware);
  }

  public getApp(): Application {
    return this.app;
  }
}

export default new App().app;
