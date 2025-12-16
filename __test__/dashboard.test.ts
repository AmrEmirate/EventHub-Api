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

jest.mock("../src/service/dashboard.service", () => ({
  DashboardService: jest.fn().mockImplementation(() => ({
    getOrganizerStats: jest.fn().mockResolvedValue({
      revenue: 5000000,
      ticketsSold: 100,
      totalEvents: 5,
    }),
    getOrganizerAnalytics: jest.fn().mockResolvedValue({
      revenuePerDay: [],
      ticketsPerEvent: [],
    }),
    getOrganizerDashboardData: jest.fn().mockResolvedValue({
      stats: {
        revenue: 5000000,
        ticketsSold: 100,
        totalEvents: 5,
      },
      analytics: {
        revenuePerDay: [{ date: "2025-12-01", total: 1000000 }],
        ticketsPerEvent: [{ eventName: "Konser Rock", sold: 50 }],
      },
    }),
  })),
}));

import dashboardRoutes from "../src/routers/dashboard.routes";

const app = express();
app.use(express.json());
app.use("/api/v1/dashboard", dashboardRoutes);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({ message: err.message });
});

describe("Dashboard Endpoints", () => {
  describe("GET /api/v1/dashboard", () => {
    it("Harus berhasil mengambil data dashboard dengan stats dan analytics", async () => {
      const res = await request(app).get(
        "/api/v1/dashboard?month=12&year=2025"
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("stats");
      expect(res.body).toHaveProperty("analytics");
    });

    it("Harus menggunakan bulan dan tahun saat ini jika query tidak diberikan", async () => {
      const res = await request(app).get("/api/v1/dashboard");

      expect(res.statusCode).toEqual(200);
    });
  });
});
