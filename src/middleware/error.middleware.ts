import { NextFunction, Request, Response } from "express";

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(500).json({
    message: "Terjadi kesalahan internal pada server.",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};
