import prisma from '../../config/prisma';
import { sendTransactionStatusEmail } from '../../utils/mailer';
import { Prisma } from '@prisma/client';
import { createNotification } from '../notifications/notification.service';

export const createTransaction = async (
  userId: string,
  eventId: string,
  quantity: number,
  voucherCode?: string,
  usePoints?: boolean
) => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event tidak ditemukan');

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User tidak ditemukan');

    if (event.ticketTotal - event.ticketSold < quantity) {
      throw new Error('Tiket tidak cukup');
    }

    let totalPrice = event.price * quantity;
    let finalPrice = totalPrice;
    let pointsUsed = 0;
    let usedVoucherId: string | undefined = undefined;

    if (voucherCode) {
      const voucher = await tx.voucher.findFirst({
        where: { 
          code: voucherCode,
          expiresAt: { gte: new Date() },
          isUsed: false
        },
      });
      if (!voucher) {
        throw new Error('Kode tidak valid, sudah digunakan, atau kedaluwarsa.');
      }
      if (voucher.eventId && voucher.eventId !== eventId) {
        throw new Error('Voucher ini tidak dapat digunakan untuk event ini.');
      }
      usedVoucherId = voucher.id;
      const discountFromVoucher = (totalPrice * voucher.discountPercent) / 100;
      const discountedAmount = voucher.maxDiscount && discountFromVoucher > voucher.maxDiscount 
                                ? voucher.maxDiscount 
                                : discountFromVoucher;
      finalPrice -= discountedAmount;
    }

    if (usePoints) {
      const pointsAsCurrency = user.points;
      pointsUsed = Math.min(finalPrice, pointsAsCurrency);
      finalPrice -= pointsUsed;
      if (pointsUsed > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { points: { decrement: pointsUsed } },
        });
      }
    }
    
    const paymentDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const transaction = await tx.transaction.create({
      data: {
        userId,
        eventId,
        quantity,
        totalPrice,
        finalPrice,
        pointsUsed,
        paymentDeadline,
        voucherId: usedVoucherId,
        status: event.isFree ? 'COMPLETED' : 'PENDING_PAYMENT',
      },
    });

    if (usedVoucherId) {
        await tx.voucher.update({
            where: { id: usedVoucherId },
            data: { isUsed: true }
        });
    }

    await tx.event.update({
      where: { id: eventId },
      data: { ticketSold: { increment: quantity } },
    });
    
    if (event.isFree) {
        await createNotification(
            userId,
            `Anda berhasil mendapatkan tiket untuk event gratis "${event.name}"! E-tiket Anda sudah tersedia.`
        );
    }

    return transaction;
  });
};

export const uploadPaymentProof = async (userId: string, transactionId: string, file: Express.Multer.File) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId: userId }
  });
  if (!transaction) throw new Error("Transaksi tidak ditemukan.");

  if (transaction.status !== 'PENDING_PAYMENT') {
    throw new Error("Hanya bisa mengunggah bukti untuk transaksi yang menunggu pembayaran.");
  }
  const fileUrl = `/uploads/${file.filename}`;
  return prisma.transaction.update({
    where: { id: transactionId },
    data: { 
      paymentProofUrl: fileUrl, 
      status: 'PENDING_CONFIRMATION'
    },
  });
};

/**
 * [PERBAIKAN] Tambahkan `endDate` pada data event yang diambil.
 * Ini penting agar frontend tahu kapan event sudah selesai dan bisa diberi ulasan.
 */
export const getTransactionsByUserId = async (userId: string) => {
  return prisma.transaction.findMany({
    where: { userId: userId },
    include: {
      event: { 
        select: { 
          id: true, // Tambahkan id untuk key
          name: true, 
          slug: true, 
          startDate: true, 
          endDate: true // <-- Tambahkan baris ini
        } 
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getTransactionsForOrganizer = async (organizerId: string) => {
  return prisma.transaction.findMany({
    where: { event: { organizerId: organizerId } },
    include: { 
        event: { select: { name: true } }, 
        user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const approveTransaction = async (organizerId: string, transactionId: string) => {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, event: { organizerId: organizerId } },
    include: { 
        user: { select: { email: true } },
        event: { select: { name: true } }
    }
  });
  if (!transaction) throw new Error("Transaksi tidak ditemukan atau Anda tidak punya akses.");

  if (transaction.status !== 'PENDING_CONFIRMATION') {
    throw new Error("Hanya transaksi yang menunggu konfirmasi yang bisa disetujui.");
  }

  await sendTransactionStatusEmail(
    transaction.user.email,
    'Pembayaran Dikonfirmasi',
    `Pembayaran Anda untuk event "${transaction.event.name}" telah berhasil dikonfirmasi.`
  );
  
  await createNotification(
    transaction.userId,
    `Pembayaran untuk event "${transaction.event.name}" telah dikonfirmasi! E-tiket Anda sekarang tersedia.`
  );
  
  return prisma.transaction.update({
    where: { id: transactionId },
    data: { status: 'COMPLETED' },
  });
};

export const rejectTransaction = async (organizerId: string, transactionId: string) => {
  const transaction = await prisma.transaction.findFirst({
    where: { 
      id: transactionId, 
      event: { organizerId: organizerId } 
    },
    include: { 
        user: { select: { email: true } },
        event: { select: { name: true } }
    }
  });

  if (!transaction) throw new Error("Transaksi tidak ditemukan atau Anda tidak punya akses.");
  if (transaction.status !== 'PENDING_CONFIRMATION') throw new Error("Hanya transaksi yang menunggu konfirmasi yang bisa ditolak.");

  await sendTransactionStatusEmail(
    transaction.user.email,
    'Pembayaran Ditolak',
    `Mohon maaf, pembayaran Anda untuk event "${transaction.event.name}" ditolak. Poin atau voucher yang digunakan telah dikembalikan.`
  );

  await createNotification(
    transaction.userId,
    `Pembayaran untuk event "${transaction.event.name}" ditolak. Poin dan voucher Anda telah dikembalikan.`
  );

  const dbOperations: Prisma.PrismaPromise<any>[] = [];
  dbOperations.push(prisma.event.update({ where: { id: transaction.eventId }, data: { ticketSold: { decrement: transaction.quantity } } }));
  dbOperations.push(prisma.transaction.update({ where: { id: transactionId }, data: { status: 'REJECTED' } }));
  if (transaction.pointsUsed > 0) {
    dbOperations.push(prisma.user.update({ where: { id: transaction.userId }, data: { points: { increment: transaction.pointsUsed } } }));
  }
  if (transaction.voucherId) {
    dbOperations.push(prisma.voucher.update({ where: { id: transaction.voucherId }, data: { isUsed: false } }));
  }
  
  return prisma.$transaction(dbOperations);
};

export const cancelTransaction = async (userId: string, transactionId:string) => {
    const transaction = await prisma.transaction.findFirst({
        where: { id: transactionId, userId: userId },
    });
    if (!transaction) throw new Error('Transaksi tidak ditemukan.');
    if (transaction.status !== 'PENDING_PAYMENT') throw new Error('Hanya transaksi yang menunggu pembayaran yang bisa dibatalkan.');
    
    return prisma.$transaction(async (tx) => {
        await tx.event.update({ where: { id: transaction.eventId }, data: { ticketSold: { decrement: transaction.quantity } } });
        if (transaction.pointsUsed > 0) {
            await tx.user.update({ where: { id: transaction.userId }, data: { points: { increment: transaction.pointsUsed } } });
        }
        if (transaction.voucherId) {
            await tx.voucher.update({ where: { id: transaction.voucherId }, data: { isUsed: false } });
        }
        return await tx.transaction.update({ where: { id: transactionId }, data: { status: 'CANCELLED' } });
    });
};

export const getTransactionById = async (userId: string, transactionId: string) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      // Izinkan organizer juga untuk melihat detail transaksi event mereka
      OR: [
        { userId: userId },
        { event: { organizerId: userId } }
      ]
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
    throw new Error('Transaksi tidak ditemukan atau Anda tidak memiliki akses.');
  }

  return transaction;
};
