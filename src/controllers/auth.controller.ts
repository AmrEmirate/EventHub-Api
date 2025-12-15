import { Request, Response } from "express";
import { AuthService } from "../service/auth.service";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  name: z.string().min(3, { message: "Nama minimal 3 karakter" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  role: z.enum(["CUSTOMER", "ORGANIZER"]),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await this.authService.register(validatedData);

      const { password, ...dataToReturn } = validatedData;
      res.status(201).json({ message: result.message, data: dataToReturn });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Input tidak valid",
          errors: error.flatten().fieldErrors,
        });
      }
      if (error.message === "Email sudah terdaftar.") {
        return res.status(409).json({ message: error.message });
      }
      res.status(400).json({ message: error.message });
    }
  }

  public async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.status(200).json({ message: "Login successful", ...result });
    } catch (error: any) {
      if (error.message === "Kredensial tidak valid") {
        return res.status(401).json({ message: error.message });
      }
      if (error.message.includes("Email belum diverifikasi")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({
        message: "Terjadi kesalahan internal pada server.",
        error: error.message,
      });
    }
  }

  public async googleLogin(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const result = await this.authService.loginWithGoogle(token);
      res.status(200).json({ message: "Login successful", ...result });
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  }

  public async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query as { token: string };
      const result = await this.authService.verifyEmail(token);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  public async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const result = await this.authService.forgotPassword(email);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  public async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      const result = await this.authService.resetPassword(token, newPassword);
      res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Input tidak valid",
          errors: error.flatten().fieldErrors,
        });
      }
      res.status(400).json({ message: error.message });
    }
  }
}

export { AuthController };
