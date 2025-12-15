// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Akses ditolak. Tidak ada token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    // Hapus password dari objek user sebelum melampirkannya
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword; // Lampirkan data user ke request

    next(); // Lanjutkan ke controller berikutnya
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa.' });
  }
};