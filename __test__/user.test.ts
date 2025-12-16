import request from "supertest";
import express, { Request, Response, NextFunction } from "express";

jest.mock("../src/middleware/auth.middleware", () => ({
  authMiddleware: (req: Request, res: Response, next: NextFunction) => {
    req.user = {
      id: "user-test-id",
      role: "CUSTOMER",
      points: 0,
      name: "Test User",
      email: "test@example.com",
      referralCode: "referral123",
      phone: "1234567890",
      emailVerified: new Date(),
    } as any;
    next();
  },
}));

jest.mock("../src/service/user.service", () => ({
  UserService: jest.fn().mockImplementation(() => ({
    getUserProfile: jest.fn().mockResolvedValue({
      id: "user-test-id",
      name: "Test User",
      email: "test@example.com",
    }),
    updateUserProfile: jest.fn().mockResolvedValue({
      id: "user-test-id",
      name: "Updated Name",
    }),
    changeUserPassword: jest
      .fn()
      .mockImplementation((userId, oldPass, newPass) => {
        if (oldPass === "wrongpassword") {
          return Promise.reject(new Error("Password lama tidak sesuai."));
        }
        return Promise.resolve({ message: "Password berhasil diperbarui." });
      }),
    updateUserAvatar: jest.fn().mockResolvedValue({}),
  })),
}));

import userRoutes from "../src/routers/user.routes";

const app = express();
app.use(express.json());
app.use("/api/v1/users", userRoutes);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({ message: err.message });
});

describe("User Endpoints", () => {
  describe("PUT /api/v1/users/me/change-password", () => {
    it("should successfully change user password", async () => {
      const res = await request(app)
        .put("/api/v1/users/me/change-password")
        .send({
          oldPassword: "oldpassword123",
          newPassword: "newpassword123",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty(
        "message",
        "Password berhasil diperbarui."
      );
    });

    it("should return 400 if old password is not valid", async () => {
      const res = await request(app)
        .put("/api/v1/users/me/change-password")
        .send({
          oldPassword: "wrongpassword",
          newPassword: "newpassword123",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("message", "Password lama tidak sesuai.");
    });

    it("should return 400 if new password is too short", async () => {
      const res = await request(app)
        .put("/api/v1/users/me/change-password")
        .send({
          oldPassword: "oldpassword123",
          newPassword: "123",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("message", "Input tidak valid");
    });
  });
});
