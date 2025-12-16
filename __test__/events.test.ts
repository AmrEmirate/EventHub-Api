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

jest.mock("../src/service/events.service", () => ({
  EventService: jest.fn().mockImplementation(() => ({
    getAllEvents: jest.fn().mockResolvedValue([]),
    getEventById: jest.fn().mockResolvedValue(null),
    getEventBySlug: jest.fn().mockResolvedValue(null),
    createEvent: jest.fn().mockImplementation((data) =>
      Promise.resolve({
        ...data,
        id: "new-event-id-123",
        slug: "test-event-123",
        ticketSold: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ),
    updateEvent: jest.fn().mockResolvedValue({}),
    deleteEvent: jest.fn().mockResolvedValue({}),
    getEventAttendees: jest.fn().mockResolvedValue([]),
    getMyOrganizerEvents: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock("../src/service/cloudinary.service", () => ({
  CloudinaryService: jest.fn().mockImplementation(() => ({
    uploadImage: jest
      .fn()
      .mockResolvedValue({ url: "http://example.com/image.jpg" }),
  })),
  CloudinaryFolder: { EVENTS: "events" },
}));

import eventRoutes from "../src/routers/events.routes";

const app = express();
app.use(express.json());
app.use("/api/v1/events", eventRoutes);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ message: err.message });
});

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
      const res = await request(app).post("/api/v1/events").send({
        name: "Konser Amal Tahunan 2025",
        description:
          "Sebuah konser amal tahunan untuk membantu sesama yang membutuhkan.",
        category: "Musik",
        location: "Jakarta Convention Center",
        startDate: "2025-12-01T19:00:00.000Z",
        endDate: "2025-12-01T23:00:00.000Z",
        price: 250000,
        isFree: false,
        ticketTotal: 1000,
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty("name");
    });
  });
});
