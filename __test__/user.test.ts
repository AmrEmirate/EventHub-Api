import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import userRoutes from "../src/routers/user.routes";
import { errorMiddleware } from "../src/middleware/error.middleware";
import { UserService } from "../src/service/user.service";

// Mock service layer untuk menghindari panggilan database aktual
jest.mock("../src/service/user.service");
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

const MockedUserService = UserService as jest.MockedClass<typeof UserService>;

const app = express();
app.use(express.json());
app.use("/api/v1/users", userRoutes);
app.use(errorMiddleware);

describe("User Endpoints", () => {
  describe("PUT /api/v1/users/me/change-password", () => {
    it("should successfully change user password", async () => {
      MockedUserService.prototype.changeUserPassword = jest
        .fn()
        .mockResolvedValueOnce({
          message: "Password berhasil diperbarui.",
        });

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
      expect(
        MockedUserService.prototype.changeUserPassword
      ).toHaveBeenCalledWith(
        "user-test-id",
        "oldpassword123",
        "newpassword123"
      );
    });

    it("should return 400 if old password is not valid", async () => {
      MockedUserService.prototype.changeUserPassword = jest
        .fn()
        .mockRejectedValueOnce(new Error("Password lama tidak sesuai."));

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
          newPassword: "123", // Kurang dari 6 karakter
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("message", "Input tidak valid");
      expect(res.body.errors).toHaveProperty("newPassword");
    });
  });
});
