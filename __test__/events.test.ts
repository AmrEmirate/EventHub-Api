import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import eventRoutes from "../src/routers/events.routes";
import { errorMiddleware } from "../src/middleware/error.middleware";

// Mock middleware otentikasi
jest.mock("../src/middleware/auth.middleware", () => ({
  authMiddleware: (req: Request, res: Response, next: NextFunction) => {
    req.user = {
      id: "user-test-id",
      role: "ORGANIZER",
    } as any;
    next();
  },
}));

// PERBAIKAN: Mock service layer untuk menghindari panggilan database
jest.mock("../src/service/events.service", () => ({
  createEvent: jest.fn().mockImplementation((eventData) => {
    // Simulasikan respons sukses dari service
    return Promise.resolve({
      ...eventData,
      id: "new-event-id-123", // Berikan ID palsu
      slug: "konser-amal-tahunan-2025-12345",
      ticketSold: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }),
  // Anda bisa mock fungsi lain jika dibutuhkan oleh tes lain
  getAllEvents: jest.fn().mockResolvedValue([]),
}));

const app = express();
app.use(express.json());
app.use("/api/v1/events", eventRoutes);
app.use(errorMiddleware);

describe("Event Endpoints", () => {
  describe("POST /api/v1/events", () => {
    it("Harus menolak pembuatan event jika data tidak lengkap (Zod validation)", async () => {
      const res = await request(app)
        .post("/api/v1/events")
        .send({ name: "Event Kurang Data" });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("Harus berhasil membuat event baru dengan data yang valid", async () => {
      const res = await request(app)
        .post("/api/v1/events")
        .send({
          name: `Konser Amal Tahunan ${new Date().getFullYear()}`,
          description:
            "Sebuah konser amal tahunan untuk membantu sesama yang membutuhkan di sekitar kita.",
          category: "Musik",
          location: "Jakarta Convention Center",
          startDate: "2025-12-01T19:00:00.000Z",
          endDate: "2025-12-01T23:00:00.000Z",
          price: 250000,
          isFree: false,
          ticketTotal: 1000,
        });

      // Sekarang seharusnya berhasil karena service di-mock
      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty("name");
      expect(res.body.data.organizerId).toEqual("user-test-id");
    });
  });
});
