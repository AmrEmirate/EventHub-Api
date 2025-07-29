import prisma from '../../config/prisma';

export const createReview = async (userId: string, eventId: string, rating: number, comment?: string) => {
  // 1. Cek apakah user pernah membeli tiket event ini dan transaksinya selesai
  const completedTransaction = await prisma.transaction.findFirst({
    where: {
      userId,
      eventId,
      status: 'COMPLETED',
    },
    include: {
      event: true, // Sertakan data event untuk memeriksa tanggal
    }
  });

  if (!completedTransaction) {
    throw new Error('Anda hanya bisa mengulas event yang tiketnya sudah Anda beli.');
  }

  // 2. Cek apakah event sudah selesai
  if (new Date(completedTransaction.event.endDate) > new Date()) {
    throw new Error('Anda baru bisa memberikan ulasan setelah event selesai.');
  }

  // 3. Cek apakah user sudah pernah memberikan ulasan untuk event ini
  const existingReview = await prisma.review.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  if (existingReview) {
    throw new Error('Anda sudah pernah memberikan ulasan untuk event ini.');
  }

  // 4. Buat ulasan baru
  return prisma.review.create({
    data: { userId, eventId, rating, comment },
  });
};
