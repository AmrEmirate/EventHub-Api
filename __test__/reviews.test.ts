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

jest.mock("../src/service/review.service", () => ({
  ReviewService: jest.fn().mockImplementation(() => ({
    createReview: jest
      .fn()
      .mockImplementation((userId, eventId, rating, comment) => {
        if (eventId === "00000000-0000-0000-0000-000000000001") {
          return Promise.reject(
            new Error("Anda hanya bisa mengulas event yang pernah Anda hadiri.")
          );
        }
        return Promise.resolve({
          id: "new-review-id",
          userId,
          eventId,
          rating,
          comment,
        });
      }),
  })),
}));

import reviewRoutes from "../src/routers/review.routes";

const app = express();
app.use(express.json());
app.use("/api/v1/reviews", reviewRoutes);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({ message: err.message });
});

describe("Review Endpoints", () => {
  describe("POST /api/v1/reviews", () => {
    const validEventId = "550e8400-e29b-41d4-a716-446655440000";
    const unpurchasedEventId = "00000000-0000-0000-0000-000000000001";

    it("Harus menolak pembuatan ulasan jika data tidak lengkap", async () => {
      const res = await request(app).post("/api/v1/reviews").send({
        eventId: validEventId,
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("Harus menolak ulasan jika pengguna belum pernah membeli tiket event tersebut", async () => {
      const res = await request(app).post("/api/v1/reviews").send({
        eventId: unpurchasedEventId,
        rating: 5,
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("message");
    });

    it("Harus berhasil membuat ulasan baru dengan data yang valid", async () => {
      const res = await request(app).post("/api/v1/reviews").send({
        eventId: validEventId,
        rating: 5,
        comment: "Workshopnya sangat bermanfaat!",
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty("rating", 5);
    });
  });
});
