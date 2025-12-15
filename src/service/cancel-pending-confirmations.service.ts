import { Request, Response } from "express";
import prisma from "../config/prisma";
import { createNotification } from "./notification.service";

export default async function handler(req: Request, res: Response) {
  try {
    // Tentukan tanggal 3 hari yang lalu dari sekarang
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // 1. Cari semua transaksi yang statusnya 'PENDING_CONFIRMATION'
    //    dan terakhir diupdate lebih dari 3 hari yang lalu.
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: "PENDING_CONFIRMATION",
        updatedAt: {
          lt: threeDaysAgo, // lt = less than (lebih awal dari)
        },
      },
      include: {
        // Sertakan nama event untuk notifikasi
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

    // 2. Loop setiap transaksi dan lakukan proses pembatalan
    for (const trx of pendingTransactions) {
      await prisma.$transaction(async (tx) => {
        // a. Kembalikan stok tiket event
        await tx.event.update({
          where: { id: trx.eventId },
          data: { ticketSold: { decrement: trx.quantity } },
        });

        // b. Kembalikan poin pengguna jika digunakan
        if (trx.pointsUsed > 0) {
          await tx.user.update({
            where: { id: trx.userId },
            data: { points: { increment: trx.pointsUsed } },
          });
        }

        // c. Aktifkan kembali voucher jika digunakan
        if (trx.voucherId) {
          await tx.voucher.update({
            where: { id: trx.voucherId },
            data: { isUsed: false },
          });
        }

        // d. Ubah status transaksi menjadi 'CANCELLED'
        await tx.transaction.update({
          where: { id: trx.id },
          data: { status: "CANCELLED" },
        });

        // e. Kirim notifikasi ke pengguna
        await createNotification(
          trx.userId,
          `Transaksi untuk event "${trx.event.name}" dibatalkan otomatis karena belum dikonfirmasi penyelenggara. Poin dan voucher Anda telah dikembalikan.`
        );
      });
      cancelledCount++;
    }

    console.log(
      `Cron job: ${cancelledCount} transaksi yang menunggu konfirmasi telah dibatalkan.`
    );
    res.status(200).json({
      message: `Proses selesai: ${cancelledCount} transaksi berhasil dibatalkan.`,
    });
  } catch (error: any) {
    console.error("Cron job pembatalan otomatis gagal:", error);
    res.status(500).json({ message: "Cron job gagal", error: error.message });
  }
}
