import request from "supertest";
import express, { Request, Response, NextFunction } from "express";

jest.mock("../src/middleware/auth.middleware", () => ({
  authMiddleware: (req: Request, res: Response, next: NextFunction) => {
    req.user = {
      id: "organizer-test-id",
      role: "ORGANIZER",
    } as any;
    next();
  },
}));

jest.mock("../src/service/voucher.service", () => ({
  VoucherService: jest.fn().mockImplementation(() => ({
    getVouchersByUserId: jest.fn().mockResolvedValue([
      {
        id: "voucher-1",
        code: "WELCOME-ABC123",
        discountPercent: 10,
        expiresAt: new Date("2025-03-16"),
        isUsed: false,
      },
    ]),
    createOrganizerVoucher: jest
      .fn()
      .mockImplementation((organizerId, data) => {
        if (data.code === "EXISTING") {
          return Promise.reject(new Error("Kode voucher ini sudah digunakan."));
        }
        return Promise.resolve({
          id: "new-voucher-id",
          code: data.code,
          discountPercent: data.discountPercent,
          eventId: data.eventId,
          expiresAt: data.expiresAt,
        });
      }),
    createVoucherForNewUser: jest.fn().mockResolvedValue({}),
  })),
}));

import voucherRoutes from "../src/routers/voucher.routes";

const app = express();
app.use(express.json());
app.use("/api/v1/vouchers", voucherRoutes);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({ message: err.message });
});

describe("Voucher Endpoints", () => {
  describe("GET /api/v1/vouchers/me", () => {
    it("Harus berhasil mengambil voucher milik user", async () => {
      const res = await request(app).get("/api/v1/vouchers/me");

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/v1/vouchers/organizer", () => {
    it("Harus berhasil membuat voucher organizer dengan data valid", async () => {
      const res = await request(app).post("/api/v1/vouchers/organizer").send({
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        code: "PROMO50",
        discountPercent: 50,
        maxDiscount: 100000,
        expiresAt: "2025-06-01T00:00:00.000Z",
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("message");
    });

    it("Harus menolak jika data tidak lengkap (Zod validation)", async () => {
      const res = await request(app).post("/api/v1/vouchers/organizer").send({
        code: "INCOMPLETE",
      });

      expect(res.statusCode).toEqual(400);
    });
  });
});
