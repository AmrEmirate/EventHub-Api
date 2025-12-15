import { Router } from "express";
import { VoucherController } from "../controllers/voucher.controller";
import { authMiddleware } from "../middleware/auth.middleware";

class VoucherRouter {
  public router: Router;
  private voucherController: VoucherController;

  constructor() {
    this.router = Router();
    this.voucherController = new VoucherController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Rute untuk customer mendapatkan vouchernya
    this.router.get(
      "/me",
      authMiddleware,
      this.voucherController.getMyVouchers.bind(this.voucherController)
    );

    // [RUTE BARU] Rute untuk organizer membuat voucher
    this.router.post(
      "/organizer",
      authMiddleware,
      this.voucherController.createOrganizerVoucher.bind(this.voucherController)
    );
  }
}

export default new VoucherRouter().router;
