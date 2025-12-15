import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import authRoutes from "../src/routers/auth.routes";
import { errorMiddleware } from "../src/middleware/error.middleware";
import * as authService from "../src/service/auth.service";
import * as passwordHelper from "../src/utils/password.helper";
import * as jwtHelper from "../src/utils/jwt.helper";
import prisma from "../src/config/prisma";

// Mock semua dependensi eksternal dari controller
jest.mock("../src/service/auth.service");
jest.mock("../src/utils/password.helper");
jest.mock("../src/utils/jwt.helper");

const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedPasswordHelper = passwordHelper as jest.Mocked<
  typeof passwordHelper
>;
const mockedJwtHelper = jwtHelper as jest.Mocked<typeof jwtHelper>;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRoutes);

describe("Auth Endpoints", () => {
  beforeEach(() => {
    // Membersihkan semua mock sebelum setiap tes dijalankan
    jest.clearAllMocks();
  });

  const testEmail = `testuser_${Date.now()}@example.com`;
  const userData = {
    email: testEmail,
    name: "Test User",
    password: "password123",
    role: "CUSTOMER" as "CUSTOMER" | "ORGANIZER",
  };

  describe("POST /api/v1/auth/register", () => {
    it("Harus menolak registrasi dengan data tidak valid (error Zod)", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "bukan-email",
        name: "ab",
        password: "123",
        role: "CUSTOMER",
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("Harus berhasil mendaftarkan pengguna baru dengan data yang valid", async () => {
      mockedAuthService.registerUser.mockResolvedValue({
        message: "Registrasi berhasil!",
      });

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(userData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty("email", testEmail);
    });

    it("Harus menolak registrasi dengan email yang sudah ada", async () => {
      mockedAuthService.registerUser.mockRejectedValue(
        new Error("Email sudah terdaftar.")
      );

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(userData);

      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty("message", "Email sudah terdaftar.");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("Harus menolak login dengan password yang salah", async () => {
      mockedAuthService.login.mockRejectedValue(
        new Error("Kredensial tidak valid")
      );

      const res = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password: "password-salah",
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("message", "Kredensial tidak valid");
    });

    it("Harus berhasil login dengan kredensial yang benar dan mengembalikan token", async () => {
      mockedAuthService.login.mockResolvedValue({
        token: "mock-jwt-token-yang-valid",
        user: {
          ...userData,
          id: "user-id-123",
          emailVerified: new Date(),
        } as any,
      });

      const res = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password: "password123",
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("token");
    });
  });
});
