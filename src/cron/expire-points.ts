import { Request, Response } from "express";
import prisma from "../config/prisma";

class ExpirePointsJob {
  public async handle(req: Request, res: Response) {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const result = await prisma.user.updateMany({
        where: {
          pointsLastUpdatedAt: {
            lt: threeMonthsAgo,
          },
          points: {
            gt: 0,
          },
        },
        data: {
          points: 0,
        },
      });

      res.status(200).json({
        message: `Proses selesai: ${result.count} pengguna poinnya di-reset.`,
      });
    } catch (error: any) {
      res.status(500).json({
        message: "Cron job poin kedaluwarsa gagal",
        error: error.message,
      });
    }
  }
}

export default (req: Request, res: Response) =>
  new ExpirePointsJob().handle(req, res);
