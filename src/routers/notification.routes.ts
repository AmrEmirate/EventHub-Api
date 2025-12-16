import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth.middleware";

class NotificationRouter {
  public router: Router;
  private notificationController: NotificationController;

  constructor() {
    this.router = Router();
    this.notificationController = new NotificationController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/me",
      authMiddleware,
      this.notificationController.getMyNotifications.bind(
        this.notificationController
      )
    );

    this.router.post(
      "/me/mark-as-read",
      authMiddleware,
      this.notificationController.markAsRead.bind(this.notificationController)
    );
  }
}

export default new NotificationRouter().router;
