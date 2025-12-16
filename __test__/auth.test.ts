import request from "supertest";
import express, { Request, Response, NextFunction } from "express";

jest.mock("../src/service/auth.service", () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    register: jest.fn().mockImplementation((data) => {
      if (data.email === "existing@example.com") {
        return Promise.reject(new Error("Email sudah terdaftar."));
      }
      return Promise.resolve({
        message: "Registrasi berhasil!",
        user: { ...data, id: "new-user-id" },
      });
    }),
    login: jest.fn().mockImplementation((email, password) => {
      if (password === "password-salah") {
        return Promise.reject(new Error("Kredensial tidak valid"));
      }
      return Promise.resolve({
        token: "mock-jwt-token",
        user: { id: "user-id", email, role: "CUSTOMER" },
      });
    }),
    verifyEmail: jest
      .fn()
      .mockResolvedValue({ message: "Email berhasil diverifikasi!" }),
    forgotPassword: jest
      .fn()
      .mockResolvedValue({ message: "Link reset password dikirim." }),
    resetPassword: jest
      .fn()
      .mockResolvedValue({ message: "Password berhasil direset." }),
    loginWithGoogle: jest
      .fn()
      .mockResolvedValue({ token: "google-token", user: {} }),
  })),
}));

import authRoutes from "../src/routers/auth.routes";

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRoutes);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({ message: err.message });
});

describe("Auth Endpoints", () => {
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
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(userData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty("email");
    });

    it("Harus menolak registrasi dengan email yang sudah ada", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ ...userData, email: "existing@example.com" });

      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty("message", "Email sudah terdaftar.");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("Harus menolak login dengan password yang salah", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password: "password-salah",
      });

      expect(res.statusCode).toEqual(401);
    });

    it("Harus berhasil login dengan kredensial yang benar", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password: "password123",
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("token");
    });
  });
});
