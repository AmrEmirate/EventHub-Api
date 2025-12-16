import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

class UserRouter {
  public router: Router;
  private userController: UserController;

  constructor() {
    this.router = Router();
    this.userController = new UserController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/me",
      authMiddleware,
      this.userController.getMe.bind(this.userController)
    );

    this.router.put(
      "/me",
      authMiddleware,
      this.userController.updateMe.bind(this.userController)
    );

    this.router.put(
      "/me/change-password",
      authMiddleware,
      this.userController.changePassword.bind(this.userController)
    );

    this.router.put(
      "/me/avatar",
      authMiddleware,
      upload.single("avatar"),
      this.userController.updateMyAvatar.bind(this.userController)
    );
  }
}

export default new UserRouter().router;
