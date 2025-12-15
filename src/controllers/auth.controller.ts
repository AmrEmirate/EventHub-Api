import { Request, Response } from "express";
import * as authService from "../service/auth.service";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  name: z.string().min(3, { message: "Nama minimal 3 karakter" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  role: z.enum(["CUSTOMER", "ORGANIZER"]),
  phone: z.string().optional(),
  referralCode: z.string().optional(), // <-- [PERBAIKAN] Tambahkan baris ini
});

export const registerController = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    // Sekarang `validatedData` akan berisi `referralCode` jika dikirim dari frontend
    const result = await authService.registerUser(validatedData);

    // Hapus password dari respons untuk keamanan
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
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
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
};

export const googleLoginController = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const result = await authService.loginWithGoogle(token);
    res.status(200).json({ message: "Login successful", ...result });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const verifyEmailController = async (req: Request, res: Response) => {
  try {
    const { token } = req.query as { token: string };
    const result = await authService.verifyEmail(token);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});
export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(token, newPassword);
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
};
