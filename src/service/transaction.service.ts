import prisma from "../config/prisma";
import { sendTransactionStatusEmail } from "../utils/mailer";
import { Prisma } from "@prisma/client";
import { createNotification } from "./notification.service";
import { TransactionRepository } from "../repositories/transaction.repository";
import { EventRepository } from "../repositories/event.repository";
import { UserRepository } from "../repositories/user.repository";
import { VoucherRepository } from "../repositories/voucher.repository";
import { midtransSnap } from "../config/midtrans";

const transactionRepository = new TransactionRepository();
const eventRepository = new EventRepository();
const userRepository = new UserRepository();
const voucherRepository = new VoucherRepository();

export const createTransaction = async (
  userId: string,
  eventId: string,
  quantity: number,
  voucherCode?: string,
  usePoints?: boolean
) => {
  // 1. Lakukan operasi database atomic
  const transaction = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const event = await eventRepository.findById(eventId, tx);
      if (!event) throw new Error("Event tidak ditemukan");

      const user = await userRepository.findById(userId, tx);
      if (!user) throw new Error("User tidak ditemukan");

      if (event.ticketTotal - event.ticketSold < quantity) {
        throw new Error("Tiket tidak cukup");
      }

      let totalPrice = event.price * quantity;
      let finalPrice = totalPrice;
      let pointsUsed = 0;
      let usedVoucherId: string | undefined = undefined;

      if (voucherCode) {
        const voucher = await voucherRepository.findFirst(
          {
            where: {
              code: voucherCode,
              expiresAt: { gte: new Date() },
              isUsed: false,
            },
          },
          tx
        );

        if (!voucher) {
          throw new Error(
            "Kode tidak valid, sudah digunakan, atau kedaluwarsa."
          );
        }
        if (voucher.eventId && voucher.eventId !== eventId) {
          throw new Error("Voucher ini tidak dapat digunakan untuk event ini.");
        }
        usedVoucherId = voucher.id;
        const discountFromVoucher =
          (totalPrice * voucher.discountPercent) / 100;
        const discountedAmount =
          voucher.maxDiscount && discountFromVoucher > voucher.maxDiscount
            ? voucher.maxDiscount
            : discountFromVoucher;
        finalPrice -= discountedAmount;
      }

      if (usePoints) {
        const pointsAsCurrency = user.points;
        pointsUsed = Math.min(finalPrice, pointsAsCurrency);
        finalPrice -= pointsUsed;
        if (pointsUsed > 0) {
          await userRepository.update(
            userId,
            {
              points: { decrement: pointsUsed },
            },
            tx
          );
        }
      }

      const paymentDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000);

      const newTransaction = await transactionRepository.create(
        {
          userId,
          eventId,
          quantity,
          totalPrice,
          finalPrice,
          pointsUsed,
          paymentDeadline,
          voucherId: usedVoucherId,
          status: event.isFree ? "COMPLETED" : "PENDING_PAYMENT",
        },
        tx
      );

      if (usedVoucherId) {
        await voucherRepository.update(usedVoucherId, { isUsed: true }, tx);
      }

      await eventRepository.update(
        eventId,
        {
          ticketSold: { increment: quantity },
        },
        tx
      );

      if (event.isFree) {
        await createNotification(
          userId,
          `Anda berhasil mendapatkan tiket untuk event gratis "${event.name}"! E-tiket Anda sudah tersedia.`
        );
      }

      return newTransaction;
    }
  );

  // 2. Generate Midtrans Token (di luar transaksi DB) jika tidak gratis
  // Note: transaction.id is accessible because transaction is completed here.
  if (transaction.finalPrice > 0 && transaction.status === "PENDING_PAYMENT") {
    try {
      const parameter = {
        transaction_details: {
          order_id: transaction.id,
          gross_amount: transaction.finalPrice,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          // email: user.email // We don't have user object here unless we return it from transaction or fetch again.
          // Fetching again is safer or return from tx.
          // Let's iterate: return user from tx?
          // Instead of complicating, let's just pass dummy or skip customer details for now as they are optional for Snap (but recommended).
          // We can't easily access user email here without refetching or modifying return type of $transaction block.
        },
      };

      const snapResponse = await midtransSnap.createTransaction(parameter);

      // 3. Update transaksi dengan Snap Token
      await transactionRepository.update(transaction.id, {
        snapToken: snapResponse.token,
        snapRedirectUrl: snapResponse.redirect_url,
      } as any);

      // Return transaction with snap info (we can merge manually since we just updated it)
      // BUT `update` returns the updated transaction, so let's just use that result if we want strictness,
      // or just merge objects.
      return {
        ...transaction,
        snapToken: snapResponse.token,
        snapRedirectUrl: snapResponse.redirect_url,
      };
    } catch (error) {
      console.error("Midtrans Error:", error);
      // Throw error so controller knows payment init failed
      throw new Error("Gagal menginisialisasi pembayaran gateway.");
    }
  }

  return transaction;
};

export const uploadPaymentProof = async (
  userId: string,
  transactionId: string,
  file: Express.Multer.File
) => {
  const transaction = await transactionRepository.findFirst({
    where: { id: transactionId, userId: userId },
  });
  if (!transaction) throw new Error("Transaksi tidak ditemukan.");

  if (transaction.status !== "PENDING_PAYMENT") {
    throw new Error(
      "Hanya bisa mengunggah bukti untuk transaksi yang menunggu pembayaran."
    );
  }
  const fileUrl = `/uploads/${file.filename}`;
  return transactionRepository.update(transactionId, {
    paymentProofUrl: fileUrl,
    status: "PENDING_CONFIRMATION",
  });
};

export const getTransactionsByUserId = async (userId: string) => {
  return transactionRepository.findMany({
    where: { userId: userId },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          slug: true,
          startDate: true,
          endDate: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getTransactionsForOrganizer = async (organizerId: string) => {
  return transactionRepository.findMany({
    where: { event: { organizerId: organizerId } },
    include: {
      event: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const approveTransaction = async (
  organizerId: string,
  transactionId: string
) => {
  const transaction = await transactionRepository.findFirst({
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

  await createNotification(
    txWithRelations.userId,
    `Pembayaran untuk event "${txWithRelations.event.name}" telah dikonfirmasi! E-tiket Anda sekarang tersedia.`
  );

  return transactionRepository.update(transactionId, { status: "COMPLETED" });
};

export const rejectTransaction = async (
  organizerId: string,
  transactionId: string
) => {
  const transaction = await transactionRepository.findFirst({
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

  await createNotification(
    txWithRelations.userId,
    `Pembayaran untuk event "${txWithRelations.event.name}" ditolak. Poin dan voucher Anda telah dikembalikan.`
  );

  return prisma.$transaction(async (tx) => {
    if (txWithRelations.status !== "PENDING_PAYMENT") {
      await eventRepository.update(
        txWithRelations.eventId,
        {
          ticketSold: { decrement: txWithRelations.quantity },
        },
        tx
      );
    }

    if (txWithRelations.pointsUsed > 0) {
      await userRepository.update(
        txWithRelations.userId,
        {
          points: { increment: txWithRelations.pointsUsed },
        },
        tx
      );
    }

    if (txWithRelations.voucherId) {
      await voucherRepository.update(
        txWithRelations.voucherId,
        { isUsed: false },
        tx
      );
    }

    return await transactionRepository.update(
      transactionId,
      { status: "REJECTED" },
      tx
    );
  });
};

export const cancelTransaction = async (
  userId: string,
  transactionId: string
) => {
  const transaction = await transactionRepository.findFirst({
    where: { id: transactionId, userId: userId },
  });
  if (!transaction) throw new Error("Transaksi tidak ditemukan.");
  if (transaction.status !== "PENDING_PAYMENT")
    throw new Error(
      "Hanya transaksi yang menunggu pembayaran yang bisa dibatalkan."
    );

  return prisma.$transaction(async (tx) => {
    if (transaction.status !== "PENDING_PAYMENT") {
      await eventRepository.update(
        transaction.eventId,
        {
          ticketSold: { decrement: transaction.quantity },
        },
        tx
      );
    }

    if (transaction.pointsUsed > 0) {
      await userRepository.update(
        transaction.userId,
        {
          points: { increment: transaction.pointsUsed },
        },
        tx
      );
    }
    if (transaction.voucherId) {
      await voucherRepository.update(
        transaction.voucherId,
        { isUsed: false },
        tx
      );
    }
    return await transactionRepository.update(
      transactionId,
      { status: "CANCELLED" },
      tx
    );
  });
};

export const getTransactionById = async (
  userId: string,
  transactionId: string
) => {
  const transaction = await transactionRepository.findFirst({
    where: {
      id: transactionId,
      OR: [{ userId: userId }, { event: { organizerId: userId } }],
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
      event: {
        select: { name: true, location: true, startDate: true },
      },
    },
  });

  if (!transaction) {
    throw new Error(
      "Transaksi tidak ditemukan atau Anda tidak memiliki akses."
    );
  }

  return transaction;
};
