import express, { Application, Request, Response } from "express";
import "./types";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import passport from "./config/passport";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./config/swagger";

import authRoutes from "./routers/auth.routes";
import eventRoutes from "./routers/events.routes";
import transactionRoutes from "./routers/transaction.routes";
import userRoutes from "./routers/user.routes";
import voucherRoutes from "./routers/voucher.routes";
import reviewRoutes from "./routers/review.routes";
import dashboardRoutes from "./routers/dashboard.routes";
import notificationRoutes from "./routers/notification.routes";
import { errorMiddleware } from "./middleware/error.middleware";

dotenv.config();

class App {
  public app: Application;
  private PORT: number;

  constructor() {
    this.app = express();
    this.PORT = Number(process.env.PORT) || 8000;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    const corsOrigin = process.env.CORS_ORIGIN || process.env.FE_URL;
    if (!corsOrigin) {
      throw new Error("CORS_ORIGIN or FE_URL environment variable is required");
    }

    const corsOptions = {
      origin: corsOrigin,
      credentials: true,
      optionsSuccessStatus: 200,
    };
    this.app.use(cors(corsOptions));

    this.app.use(passport.initialize());

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use(
      "/uploads",
      express.static(path.join(__dirname, "../public/uploads"))
    );
  }

  private initializeRoutes(): void {
    const apiRouter = express.Router();

    apiRouter.use("/auth", authRoutes);
    apiRouter.use("/events", eventRoutes);
    apiRouter.use("/transactions", transactionRoutes);
    apiRouter.use("/users", userRoutes);
    apiRouter.use("/vouchers", voucherRoutes);
    apiRouter.use("/reviews", reviewRoutes);
    apiRouter.use("/dashboard", dashboardRoutes);
    apiRouter.use("/notifications", notificationRoutes);

    this.app.use("/api/v1", apiRouter);

    this.app.get("/", (req: Request, res: Response) => {
      res.status(200).send("<h1>EventHUb API</h1>");
    });

    this.app.get("/health", (req: Request, res: Response) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
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

  public start(): void {
    this.app.listen(this.PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${this.PORT}`);
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

export default App;
