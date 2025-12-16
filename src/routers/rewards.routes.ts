import { Router } from "express";
import { RewardsController } from "../controllers/rewards.controller";
import { authMiddleware } from "../middleware/auth.middleware";

class RewardsRouter {
  public router: Router;
  private rewardsController: RewardsController;

  constructor() {
    this.router = Router();
    this.rewardsController = new RewardsController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/prizes",
      authMiddleware,
      this.rewardsController.getAllPrizes.bind(this.rewardsController)
    );

    this.router.post(
      "/redeem/:prizeId",
      authMiddleware,
      this.rewardsController.redeemPrize.bind(this.rewardsController)
    );
  }
}

export default new RewardsRouter().router;
