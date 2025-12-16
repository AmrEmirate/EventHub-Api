import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middleware/auth.middleware";

class DashboardRouter {
  public router: Router;
  private dashboardController: DashboardController;

  constructor() {
    this.router = Router();
    this.dashboardController = new DashboardController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      authMiddleware,
      this.dashboardController.getOrganizerDashboard.bind(
        this.dashboardController
      )
    );
  }
}

export default new DashboardRouter().router;
