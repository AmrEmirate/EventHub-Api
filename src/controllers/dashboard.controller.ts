import { Request, Response } from "express";
import { DashboardService } from "../service/dashboard.service";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const dashboardQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  public async getOrganizerDashboard(req: Request, res: Response) {
    if (req.user?.role !== UserRole.ORGANIZER) {
      return res
        .status(403)
        .json({ message: "Akses ditolak. Hanya untuk organizer." });
    }

    try {
      const validatedQuery = dashboardQuerySchema.parse(req.query);

      const now = new Date();
      const month = validatedQuery.month || now.getMonth() + 1;
      const year = validatedQuery.year || now.getFullYear();

      const dashboardData =
        await this.dashboardService.getOrganizerDashboardData(
          req.user!.id,
          month,
          year
        );

      res.status(200).json(dashboardData);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Parameter query tidak valid",
          errors: error.flatten().fieldErrors,
        });
      }
      res.status(500).json({
        message: "Gagal mengambil data dashboard",
        error: error.message,
      });
    }
  }
}

export { DashboardController };
