import request from "supertest";
import express, { Request, Response, NextFunction } from "express";

jest.mock("../src/middleware/auth.middleware", () => ({
  authMiddleware: (req: Request, res: Response, next: NextFunction) => {
    req.user = {
      id: "user-test-id",
      role: "CUSTOMER",
    } as any;
    next();
  },
}));

jest.mock("../src/service/notification.service", () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    createNotification: jest.fn().mockResolvedValue({
      id: "notif-1",
      message: "Test notification",
      isRead: false,
    }),
    getNotificationsByUserId: jest.fn().mockResolvedValue([
      {
        id: "notif-1",
        message: "Pembayaran Anda telah dikonfirmasi!",
        isRead: false,
        createdAt: new Date(),
      },
    ]),
    markNotificationsAsRead: jest.fn().mockResolvedValue({ count: 1 }),
  })),
}));

import notificationRoutes from "../src/routers/notification.routes";

const app = express();
app.use(express.json());
app.use("/api/v1/notifications", notificationRoutes);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({ message: err.message });
});

describe("Notification Endpoints", () => {
  describe("GET /api/v1/notifications/me", () => {
    it("Harus berhasil mengambil notifikasi milik user", async () => {
      const res = await request(app).get("/api/v1/notifications/me");

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/v1/notifications/me/mark-as-read", () => {
    it("Harus berhasil menandai notifikasi sebagai dibaca", async () => {
      const res = await request(app).post(
        "/api/v1/notifications/me/mark-as-read"
      );

      expect(res.statusCode).toEqual(200);
    });
  });
});
