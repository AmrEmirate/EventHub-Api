import { Request, Response } from "express";
import prisma from "../config/prisma";

export default async function handler(req: Request, res: Response) {
  try {
    // Tentukan tanggal 3 bulan yang lalu dari sekarang
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Cari pengguna yang poinnya lebih dari 0 dan terakhir diupdate sebelum 3 bulan yang lalu
    const result = await prisma.user.updateMany({
      where: {
        // [KONDISI DIUBAH]
        pointsLastUpdatedAt: {
          lt: threeMonthsAgo, // lt = less than (lebih kecil dari)
        },
        points: {
          gt: 0, // gt = greater than (lebih besar dari)
        },
      },
      data: {
        points: 0, // Reset poin menjadi 0
      },
    });

    console.log(
      `Cron job expire-points: ${result.count} pengguna poinnya di-reset.`
    );
    res
      .status(200)
      .json({
        message: `Proses selesai: ${result.count} pengguna poinnya di-reset.`,
      });
  } catch (error: any) {
    console.error("Cron job poin kedaluwarsa gagal:", error);
    res
      .status(500)
      .json({
        message: "Cron job poin kedaluwarsa gagal",
        error: error.message,
      });
  }
}
