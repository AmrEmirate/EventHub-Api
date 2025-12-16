import { Request, Response } from "express";
import prisma from "../config/prisma";
import { NotificationService } from "../service/notification.service";

class CancelPendingConfirmationsJob {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  public async handle(req: Request, res: Response) {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const pendingTransactions = await prisma.transaction.findMany({
        where: {
          status: "PENDING_CONFIRMATION",
          updatedAt: {
            lt: threeDaysAgo,
          },
        },
        include: {
          event: {
            select: { name: true },
          },
        },
      });

      if (pendingTransactions.length === 0) {
        return res
          .status(200)
          .json({ message: "Tidak ada transaksi yang perlu dibatalkan." });
      }

      let cancelledCount = 0;

      for (const trx of pendingTransactions) {
        await prisma.$transaction(async (tx) => {
          await tx.event.update({
            where: { id: trx.eventId },
            data: { ticketSold: { decrement: trx.quantity } },
          });

          if (trx.pointsUsed > 0) {
            await tx.user.update({
              where: { id: trx.userId },
              data: { points: { increment: trx.pointsUsed } },
            });
          }

          if (trx.voucherId) {
            await tx.voucher.update({
              where: { id: trx.voucherId },
              data: { isUsed: false },
            });
          }

          await tx.transaction.update({
            where: { id: trx.id },
            data: { status: "CANCELLED" },
          });

          await this.notificationService.createNotification(
            trx.userId,
            `Transaksi untuk event "${trx.event.name}" dibatalkan otomatis karena belum dikonfirmasi penyelenggara. Poin dan voucher Anda telah dikembalikan.`
          );
        });
        cancelledCount++;
      }

      res.status(200).json({
        message: `Proses selesai: ${cancelledCount} transaksi berhasil dibatalkan.`,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Cron job gagal", error: error.message });
    }
  }
}

export default (req: Request, res: Response) =>
  new CancelPendingConfirmationsJob().handle(req, res);
