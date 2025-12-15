import { Request, Response } from "express";
import { getOrganizerDashboardData } from "../service/dashboard.service";
import { UserRole } from "@prisma/client";
import { z } from "zod";

// Skema untuk memvalidasi query parameters
const dashboardQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const getOrganizerDashboardController = async (
  req: Request,
  res: Response
) => {
  if (req.user?.role !== UserRole.ORGANIZER) {
    return res
      .status(403)
      .json({ message: "Akses ditolak. Hanya untuk organizer." });
  }

  try {
    const validatedQuery = dashboardQuerySchema.parse(req.query);

    // Gunakan tanggal saat ini sebagai default jika tidak ada query
    const now = new Date();
    const month = validatedQuery.month || now.getMonth() + 1;
    const year = validatedQuery.year || now.getFullYear();

    // [PERBAIKAN] Panggil service dengan 3 argumen yang dibutuhkan
    const dashboardData = await getOrganizerDashboardData(
      req.user!.id,
      month,
      year
    );

    res.status(200).json(dashboardData);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({
          message: "Parameter query tidak valid",
          errors: error.flatten().fieldErrors,
        });
    }
    res
      .status(500)
      .json({
        message: "Gagal mengambil data dashboard",
        error: error.message,
      });
  }
};
