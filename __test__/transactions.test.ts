import request from "supertest";
import express, { Request, Response, NextFunction } from "express";

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

jest.mock("../src/service/transaction.service", () => ({
  TransactionService: jest.fn().mockImplementation(() => ({
    createTransaction: jest
      .fn()
      .mockImplementation((userId, eventId, quantity) => {
        return Promise.resolve({
          id: "new-transaction-id",
          userId: userId,
          eventId: eventId,
          quantity: quantity,
          status: "PENDING_PAYMENT",
          totalPrice: 500000,
          finalPrice: 500000,
        });
      }),
    getTransactionsByUserId: jest.fn().mockResolvedValue([]),
    getTransactionsForOrganizer: jest.fn().mockResolvedValue([]),
    uploadPaymentProof: jest.fn().mockResolvedValue({}),
    approveTransaction: jest.fn().mockResolvedValue({}),
    rejectTransaction: jest.fn().mockResolvedValue({}),
    cancelTransaction: jest.fn().mockResolvedValue({}),
    getTransactionById: jest.fn().mockResolvedValue(null),
  })),
}));

import transactionRoutes from "../src/routers/transaction.routes";

const app = express();
app.use(express.json());
app.use("/api/v1/transactions", transactionRoutes);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({ message: err.message });
});

describe("Transaction Endpoints", () => {
  describe("POST /api/v1/transactions", () => {
    it("Harus berhasil membuat transaksi baru dengan data yang valid", async () => {
      const res = await request(app)
        .post("/api/v1/transactions")
        .send({ eventId: "c1bba4a2-11a9-4a42-993d-6a2c26e13834", quantity: 2 });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("id");
    });

    it("Harus menolak dengan error jika eventId tidak valid (Zod validation)", async () => {
      const res = await request(app)
        .post("/api/v1/transactions")
        .send({ eventId: "invalid-uuid", quantity: 1 });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("message");
    });
  });
});
