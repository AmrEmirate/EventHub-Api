import { Request, Response } from "express";
import prisma from "../config/prisma";

class ExpireTransactionsJob {
  public async handle(req: Request, res: Response) {
    try {
      // Cari transaksi yang pending dan sudah melewati batas bayar
      const expiredTransactions = await prisma.transaction.findMany({
        where: {
          status: "PENDING_PAYMENT",
          paymentDeadline: { lt: new Date() },
        },
      });

      for (const trx of expiredTransactions) {
        // Kembalikan stok tiket dan update status transaksi
        await prisma.$transaction([
          prisma.event.update({
            where: { id: trx.eventId },
            data: { ticketSold: { decrement: trx.quantity } },
          }),
          prisma.transaction.update({
            where: { id: trx.id },
            data: { status: "EXPIRED" },
          }),
        ]);
      }
      res.status(200).json({
        message: `Proses selesai: ${expiredTransactions.length} transaksi kedaluwarsa.`,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Cron job gagal", error: error.message });
    }
  }
}

export default (req: Request, res: Response) =>
  new ExpireTransactionsJob().handle(req, res);
