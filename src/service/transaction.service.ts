import prisma from "../config/prisma";

import { Prisma } from "@prisma/client";
import { NotificationService } from "./notification.service";
import { TransactionRepository } from "../repositories/transaction.repository";
import { EventRepository } from "../repositories/event.repository";
import { UserRepository } from "../repositories/user.repository";
import { VoucherRepository } from "../repositories/voucher.repository";

import { TransactionHelper } from "./transaction.helper";
import { TransactionActionHelper } from "./transaction-action.helper";

class TransactionService {
  public transactionRepository: TransactionRepository;
  public eventRepository: EventRepository;
  public userRepository: UserRepository;
  public voucherRepository: VoucherRepository;
  public notificationService: NotificationService;

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
          const { finalPrice: newPrice, usedVoucherId: reqVoucherId } =
            await TransactionHelper.validateAndApplyVoucher(
              this.voucherRepository,
              voucherCode,
              eventId,
              totalPrice,
              tx
            );
          finalPrice = newPrice;
          usedVoucherId = reqVoucherId;
        }

        if (usePoints) {
          const { pointsUsed: pUsed, finalPrice: fPrice } =
            await TransactionHelper.processPoints(
              this.userRepository,
              userId,
              finalPrice,
              tx
            );
          pointsUsed = pUsed;
          finalPrice = fPrice;
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

    if (
      transaction.finalPrice > 0 &&
      transaction.status === "PENDING_PAYMENT"
    ) {
      return await TransactionHelper.initiatePaymentGateway(
        this.transactionRepository,
        transaction
      );
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
    return TransactionActionHelper.approveTransaction(
      this,
      organizerId,
      transactionId
    );
  }

  public async rejectTransaction(organizerId: string, transactionId: string) {
    return TransactionActionHelper.rejectTransaction(
      this,
      organizerId,
      transactionId
    );
  }

  public async cancelTransaction(userId: string, transactionId: string) {
    return TransactionActionHelper.cancelTransaction(
      this,
      userId,
      transactionId
    );
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
