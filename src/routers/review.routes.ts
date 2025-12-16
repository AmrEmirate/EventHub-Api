import { Router } from "express";
import { ReviewController } from "../controllers/review.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

class ReviewRouter {
  public router: Router;
  private reviewController: ReviewController;

  constructor() {
    this.router = Router();
    this.reviewController = new ReviewController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/",
      authMiddleware,
      upload.single("imageUrl"),
      this.reviewController.createReview.bind(this.reviewController)
    );

    this.router.get(
      "/:eventId",
      this.reviewController.getReviewsByEvent.bind(this.reviewController)
    );
  }
}

export default new ReviewRouter().router;
