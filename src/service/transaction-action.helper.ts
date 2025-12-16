import prisma from "../config/prisma";
import { ITransactionContext } from "./transaction-context.interface";
import { TransactionHelper } from "./transaction.helper";
import { sendTransactionStatusEmail } from "../utils/mailer";

export class TransactionActionHelper {
  static async approveTransaction(
    ctx: ITransactionContext,
    organizerId: string,
    transactionId: string
  ) {
    const transaction = await ctx.transactionRepository.findFirst({
      where: { id: transactionId, event: { organizerId: organizerId } },
      include: {
        user: { select: { email: true } },
        event: { select: { name: true } },
      },
    });

    if (!transaction)
      throw new Error("Transaksi tidak ditemukan atau Anda tidak punya akses.");

    const txWithRelations = transaction as any;

    if (txWithRelations.status !== "PENDING_CONFIRMATION") {
      throw new Error(
        "Hanya transaksi yang menunggu konfirmasi yang bisa disetujui."
      );
    }

    await sendTransactionStatusEmail(
      txWithRelations.user.email,
      "Pembayaran Dikonfirmasi",
      `Pembayaran Anda untuk event "${txWithRelations.event.name}" telah berhasil dikonfirmasi.`
    );

    await ctx.notificationService.createNotification(
      txWithRelations.userId,
      `Pembayaran untuk event "${txWithRelations.event.name}" telah dikonfirmasi! E-tiket Anda sekarang tersedia.`
    );

    return ctx.transactionRepository.update(transactionId, {
      status: "COMPLETED",
    });
  }

  static async rejectTransaction(
    ctx: ITransactionContext,
    organizerId: string,
    transactionId: string
  ) {
    const transaction = await ctx.transactionRepository.findFirst({
      where: {
        id: transactionId,
        event: { organizerId: organizerId },
      },
      include: {
        user: { select: { email: true } },
        event: { select: { name: true } },
      },
    });

    if (!transaction)
      throw new Error("Transaksi tidak ditemukan atau Anda tidak punya akses.");

    const txWithRelations = transaction as any;

    if (txWithRelations.status !== "PENDING_CONFIRMATION")
      throw new Error(
        "Hanya transaksi yang menunggu konfirmasi yang bisa ditolak."
      );

    await sendTransactionStatusEmail(
      txWithRelations.user.email,
      "Pembayaran Ditolak",
      `Mohon maaf, pembayaran Anda untuk event "${txWithRelations.event.name}" ditolak. Poin atau voucher yang digunakan telah dikembalikan.`
    );

    await ctx.notificationService.createNotification(
      txWithRelations.userId,
      `Pembayaran untuk event "${txWithRelations.event.name}" ditolak. Poin dan voucher Anda telah dikembalikan.`
    );

    return prisma.$transaction(async (tx) => {
      await TransactionHelper.restoreAssets(
        ctx.eventRepository,
        ctx.userRepository,
        ctx.voucherRepository,
        txWithRelations,
        tx
      );

      return await ctx.transactionRepository.update(
        transactionId,
        { status: "REJECTED" },
        tx
      );
    });
  }

  static async cancelTransaction(
    ctx: ITransactionContext,
    userId: string,
    transactionId: string
  ) {
    const transaction = await ctx.transactionRepository.findFirst({
      where: { id: transactionId, userId: userId },
    });
    if (!transaction) throw new Error("Transaksi tidak ditemukan.");
    if (transaction.status !== "PENDING_PAYMENT")
      throw new Error(
        "Hanya transaksi yang menunggu pembayaran yang bisa dibatalkan."
      );

    return prisma.$transaction(async (tx) => {
      await TransactionHelper.restoreAssets(
        ctx.eventRepository,
        ctx.userRepository,
        ctx.voucherRepository,
        transaction,
        tx
      );
      return await ctx.transactionRepository.update(
        transactionId,
        { status: "CANCELLED" },
        tx
      );
    });
  }
}
