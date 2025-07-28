import { Request, Response } from 'express';
import * as authService from './auth.service';
import { comparePassword } from '../../utils/password.helper';
import { generateToken } from '../../utils/jwt.helper';
import prisma from '../../config/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  name: z.string().min(3, { message: "Nama minimal 3 karakter" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  role: z.enum(['CUSTOMER', 'ORGANIZER']),
  phone: z.string().optional(),
});

export const registerController = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.registerUser(validatedData);
    // [PERBAIKAN] Kirim status 201 untuk sukses membuat resource baru
    res.status(201).json({ message: result.message, data: validatedData });
  } catch (error: any) {
    // [PERBAIKAN] Tangani error Zod dan error duplikat email
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Input tidak valid", errors: error.flatten().fieldErrors });
    }
    if (error.message === 'Email sudah terdaftar.') {
      return res.status(409).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true, role: true, points: true, referralCode: true, phone: true, emailVerified: true, profile: { select: { bio: true, avatarUrl: true }}}
    });
    
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    if (!user.emailVerified) return res.status(403).json({ message: 'Email belum diverifikasi. Silakan cek email Anda.' });

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Kredensial tidak valid' });

    const token = generateToken({ userId: user.id, role: user.role });
    const { password: _, ...userToReturn } = user;
    res.status(200).json({ message: 'Login successful', token, user: userToReturn });
  } catch (error: any) {
    res.status(500).json({ message: 'Terjadi kesalahan internal pada server.', error: error.message });
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
    newPassword: z.string().min(6, "Password baru minimal 6 karakter")
});
export const resetPasswordController = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = resetPasswordSchema.parse(req.body);
        const result = await authService.resetPassword(token, newPassword);
        res.status(200).json(result);
    } catch (error: any) {
         if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Input tidak valid", errors: error.flatten().fieldErrors });
        }
        res.status(400).json({ message: error.message });
    }
};