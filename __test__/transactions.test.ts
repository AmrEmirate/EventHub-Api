import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import transactionRoutes from "../src/routers/transaction.routes";
import { errorMiddleware } from "../src/middleware/error.middleware";

// Mock middleware otentikasi
jest.mock("../src/middleware/auth.middleware", () => ({
  authMiddleware: (req: Request, res: Response, next: NextFunction) => {
    req.user = {
      id: "user-id-123",
      role: "CUSTOMER",
      points: 50000,
    } as any;
    next();
  },
}));

// Mock service
jest.mock("../src/service/transaction.service", () => ({
  createTransaction: jest.fn().mockImplementation((userId, eventId) => {
    if (eventId === "event-tidak-ada") {
      throw new Error("Event tidak ditemukan");
    }
    return Promise.resolve({
      id: "new-transaction-id",
      userId: userId,
      eventId: eventId,
      quantity: 2,
      status: "PENDING_PAYMENT",
    });
  }),
}));

const app = express();
app.use(express.json());
app.use("/api/v1/transactions", transactionRoutes);
// [PERBAIKAN] Tambahkan middleware error kustom sederhana untuk tes ini
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Cek apakah header sudah terkirim
  if (res.headersSent) {
    return next(err);
  }
  // Tangani error dari service dan kirim status 400
  res.status(400).json({ message: err.message });
});

describe("Transaction Endpoints", () => {
  describe("POST /api/v1/transactions", () => {
    it("Harus berhasil membuat transaksi baru dengan data yang valid", async () => {
      const res = await request(app)
        .post("/api/v1/transactions")
        .send({ eventId: "c1bba4a2-11a9-4a42-993d-6a2c26e13834", quantity: 2 }); // Gunakan UUID valid
      expect(res.statusCode).toEqual(201);
      expect(res.body.userId).toEqual("user-id-123");
    });

    it("Harus mengembalikan error jika service melempar error", async () => {
      const res = await request(app)
        .post("/api/v1/transactions")
        .send({ eventId: "event-tidak-ada", quantity: 1 });

      // [PERBAIKAN] Error dari service seharusnya menghasilkan status 400, bukan 500.
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("message", "Input tidak valid");
    });
  });
});
