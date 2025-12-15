import { NextFunction, Request, Response } from 'express';

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error ke konsol untuk debugging
  console.error(`[ERROR] ${new Date().toISOString()}: ${error.stack}`);

  // Kirim respons error yang konsisten ke client
  res.status(500).json({
    message: 'Terjadi kesalahan internal pada server.',
    error: error.message, // Sertakan pesan error asli untuk debugging
  });
};