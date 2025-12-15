import prisma from "../config/prisma";
import { sendTransactionStatusEmail } from "../utils/mailer";
import { Prisma } from "@prisma/client";
import { NotificationService } from "./notification.service";
import { TransactionRepository } from "../repositories/transaction.repository";
import { EventRepository } from "../repositories/event.repository";
import { UserRepository } from "../repositories/user.repository";
import { VoucherRepository } from "../repositories/voucher.repository";
import { midtransSnap } from "../config/midtrans";

class TransactionService {
  private transactionRepository: TransactionRepository;
  private eventRepository: EventRepository;
  private userRepository: UserRepository;
  private voucherRepository: VoucherRepository;
  private notificationService: NotificationService;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.eventRepository = new EventRepository();
    this.userRepository = new UserRepository();
    this.voucherRepository = new VoucherRepository();
    this.notificationService = new NotificationService();
  }

  public async createTransaction(
    userId: string,
    eventId: string,
    quantity: number,
    voucherCode?: string,
    usePoints?: boolean
  ) {
    // 1. Lakukan operasi database atomic
    const transaction = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const event = await this.eventRepository.findById(eventId, tx);
        if (!event) throw new Error("Event tidak ditemukan");

        const user = await this.userRepository.findById(userId, tx);
        if (!user) throw new Error("User tidak ditemukan");

        if (event.ticketTotal - event.ticketSold < quantity) {
          throw new Error("Tiket tidak cukup");
        }

        let totalPrice = event.price * quantity;
        let finalPrice = totalPrice;
        let pointsUsed = 0;
        let usedVoucherId: string | undefined = undefined;

        if (voucherCode) {
          const voucher = await this.voucherRepository.findFirst(
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
            throw new Error(
              "Voucher ini tidak dapat digunakan untuk event ini."
            );
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
            await this.userRepository.update(
              userId,
              {
                points: { decrement: pointsUsed },
              },
              tx
            );
          }
        }

        const paymentDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000);

        const newTransaction = await this.transactionRepository.create(
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
          await this.voucherRepository.update(
            usedVoucherId,
            { isUsed: true },
            tx
          );
        }

        await this.eventRepository.update(
          eventId,
          {
            ticketSold: { increment: quantity },
          },
          tx
        );

        if (event.isFree) {
          await this.notificationService.createNotification(
            userId,
            `Anda berhasil mendapatkan tiket untuk event gratis "${event.name}"! E-tiket Anda sudah tersedia.`
          );
        }

        return newTransaction;
      }
    );

    // 2. Generate Midtrans Token (di luar transaksi DB) jika tidak gratis
    if (
      transaction.finalPrice > 0 &&
      transaction.status === "PENDING_PAYMENT"
    ) {
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
            // email: user.email // Cannot easily access user email here without refetching
          },
        };

        const snapResponse = await midtransSnap.createTransaction(parameter);

        // 3. Update transaksi dengan Snap Token
        await this.transactionRepository.update(transaction.id, {
          snapToken: snapResponse.token,
          snapRedirectUrl: snapResponse.redirect_url,
        } as any);

        return {
          ...transaction,
          snapToken: snapResponse.token,
          snapRedirectUrl: snapResponse.redirect_url,
        };
      } catch (error) {
        console.error("Midtrans Error:", error);
        throw new Error("Gagal menginisialisasi pembayaran gateway.");
      }
    }

    return transaction;
  }

  public async uploadPaymentProof(
    userId: string,
    transactionId: string,
    file: Express.Multer.File
  ) {
    const transaction = await this.transactionRepository.findFirst({
      where: { id: transactionId, userId: userId },
    });
    if (!transaction) throw new Error("Transaksi tidak ditemukan.");

    if (transaction.status !== "PENDING_PAYMENT") {
      throw new Error(
        "Hanya bisa mengunggah bukti untuk transaksi yang menunggu pembayaran."
      );
    }
    const fileUrl = `/uploads/${file.filename}`;
    return this.transactionRepository.update(transactionId, {
      paymentProofUrl: fileUrl,
      status: "PENDING_CONFIRMATION",
    });
  }

  public async getTransactionsByUserId(userId: string) {
    return this.transactionRepository.findMany({
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
  }

  public async getTransactionsForOrganizer(organizerId: string) {
    return this.transactionRepository.findMany({
      where: { event: { organizerId: organizerId } },
      include: {
        event: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  public async approveTransaction(organizerId: string, transactionId: string) {
    const transaction = await this.transactionRepository.findFirst({
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

    await this.notificationService.createNotification(
      txWithRelations.userId,
      `Pembayaran untuk event "${txWithRelations.event.name}" telah dikonfirmasi! E-tiket Anda sekarang tersedia.`
    );

    return this.transactionRepository.update(transactionId, {
      status: "COMPLETED",
    });
  }

  public async rejectTransaction(organizerId: string, transactionId: string) {
    const transaction = await this.transactionRepository.findFirst({
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

    await this.notificationService.createNotification(
      txWithRelations.userId,
      `Pembayaran untuk event "${txWithRelations.event.name}" ditolak. Poin dan voucher Anda telah dikembalikan.`
    );

    return prisma.$transaction(async (tx) => {
      if (txWithRelations.status !== "PENDING_PAYMENT") {
        await this.eventRepository.update(
          txWithRelations.eventId,
          {
            ticketSold: { decrement: txWithRelations.quantity },
          },
          tx
        );
      }

      if (txWithRelations.pointsUsed > 0) {
        await this.userRepository.update(
          txWithRelations.userId,
          {
            points: { increment: txWithRelations.pointsUsed },
          },
          tx
        );
      }

      if (txWithRelations.voucherId) {
        await this.voucherRepository.update(
          txWithRelations.voucherId,
          { isUsed: false },
          tx
        );
      }

      return await this.transactionRepository.update(
        transactionId,
        { status: "REJECTED" },
        tx
      );
    });
  }

  public async cancelTransaction(userId: string, transactionId: string) {
    const transaction = await this.transactionRepository.findFirst({
      where: { id: transactionId, userId: userId },
    });
    if (!transaction) throw new Error("Transaksi tidak ditemukan.");
    if (transaction.status !== "PENDING_PAYMENT")
      throw new Error(
        "Hanya transaksi yang menunggu pembayaran yang bisa dibatalkan."
      );

    return prisma.$transaction(async (tx) => {
      if (transaction.status !== "PENDING_PAYMENT") {
        await this.eventRepository.update(
          transaction.eventId,
          {
            ticketSold: { decrement: transaction.quantity },
          },
          tx
        );
      }

      if (transaction.pointsUsed > 0) {
        await this.userRepository.update(
          transaction.userId,
          {
            points: { increment: transaction.pointsUsed },
          },
          tx
        );
      }
      if (transaction.voucherId) {
        await this.voucherRepository.update(
          transaction.voucherId,
          { isUsed: false },
          tx
        );
      }
      return await this.transactionRepository.update(
        transactionId,
        { status: "CANCELLED" },
        tx
      );
    });
  }

  public async getTransactionById(userId: string, transactionId: string) {
    const transaction = await this.transactionRepository.findFirst({
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
  }
}

export { TransactionService };
