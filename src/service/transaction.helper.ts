import { Prisma } from "@prisma/client";
import { EventRepository } from "../repositories/event.repository";
import { UserRepository } from "../repositories/user.repository";
import { VoucherRepository } from "../repositories/voucher.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { midtransSnap } from "../config/midtrans";

export class TransactionHelper {
  static async validateAndApplyVoucher(
    voucherRepository: VoucherRepository,
    voucherCode: string,
    eventId: string,
    totalPrice: number,
    tx: Prisma.TransactionClient
  ): Promise<{ finalPrice: number; usedVoucherId: string }> {
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
      throw new Error("Kode tidak valid, sudah digunakan, atau kedaluwarsa.");
    }
    if (voucher.eventId && voucher.eventId !== eventId) {
      throw new Error("Voucher ini tidak dapat digunakan untuk event ini.");
    }

    const discountFromVoucher = (totalPrice * voucher.discountPercent) / 100;
    const discountedAmount =
      voucher.maxDiscount && discountFromVoucher > voucher.maxDiscount
        ? voucher.maxDiscount
        : discountFromVoucher;

    return {
      finalPrice: totalPrice - discountedAmount,
      usedVoucherId: voucher.id,
    };
  }

  static async restoreAssets(
    eventRepository: EventRepository,
    userRepository: UserRepository,
    voucherRepository: VoucherRepository,
    transaction: any, // using any to match handling of txWithRelations
    tx: Prisma.TransactionClient
  ) {
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
  }

  static async processPoints(
    userRepository: UserRepository,
    userId: string,
    finalPrice: number,
    tx: Prisma.TransactionClient
  ): Promise<{ pointsUsed: number; finalPrice: number }> {
    const user = await userRepository.findById(userId, tx);
    if (!user) throw new Error("User tidak ditemukan");

    const pointsAsCurrency = user.points;
    const pointsUsed = Math.min(finalPrice, pointsAsCurrency);
    const newFinalPrice = finalPrice - pointsUsed;

    if (pointsUsed > 0) {
      await userRepository.update(
        userId,
        {
          points: { decrement: pointsUsed },
        },
        tx
      );
    }
    return { pointsUsed, finalPrice: newFinalPrice };
  }

  static async initiatePaymentGateway(
    transactionRepository: TransactionRepository,
    transaction: any
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
        customer_details: {},
      };

      const snapResponse = await midtransSnap.createTransaction(parameter);

      await transactionRepository.update(transaction.id, {
        snapToken: snapResponse.token,
        snapRedirectUrl: snapResponse.redirect_url,
      } as any);

      return {
        ...transaction,
        snapToken: snapResponse.token,
        snapRedirectUrl: snapResponse.redirect_url,
      };
    } catch (error) {
      throw new Error("Gagal menginisialisasi pembayaran gateway.");
    }
  }
}
