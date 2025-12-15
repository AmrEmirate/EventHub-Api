import { Router } from "express";
import { TransactionController } from "../controllers/transaction.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

class TransactionRouter {
  public router: Router;
  private transactionController: TransactionController;

  constructor() {
    this.router = Router();
    this.transactionController = new TransactionController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // --- Rute untuk Pengguna (Customer) ---
    this.router.post(
      "/",
      authMiddleware,
      this.transactionController.createTransaction.bind(
        this.transactionController
      )
    );
    this.router.get(
      "/me",
      authMiddleware,
      this.transactionController.getMyTransactions.bind(
        this.transactionController
      )
    );

    // --- Rute untuk Penyelenggara (Organizer) ---
    // [PERBAIKAN] Pindahkan rute statis ini ke ATAS rute dinamis '/:id'
    this.router.get(
      "/organizer",
      authMiddleware,
      this.transactionController.getOrganizerTransactions.bind(
        this.transactionController
      )
    );
    this.router.post(
      "/organizer/:id/approve",
      authMiddleware,
      this.transactionController.approveTransaction.bind(
        this.transactionController
      )
    );
    this.router.post(
      "/organizer/:id/reject",
      authMiddleware,
      this.transactionController.rejectTransaction.bind(
        this.transactionController
      )
    );

    // [PERBAIKAN] Rute dinamis '/:id' sekarang berada di bawah rute yang lebih spesifik
    this.router.get(
      "/:id",
      authMiddleware,
      this.transactionController.getTransactionById.bind(
        this.transactionController
      )
    );

    this.router.post(
      "/:id/upload",
      authMiddleware,
      upload.single("paymentProof"),
      this.transactionController.uploadPaymentProof.bind(
        this.transactionController
      )
    );
    this.router.post(
      "/:id/cancel",
      authMiddleware,
      this.transactionController.cancelTransaction.bind(
        this.transactionController
      )
    );
  }
}

export default new TransactionRouter().router;
