import prisma from '../../config/prisma';

export const createReview = async (userId: string, eventId: string, rating: number, comment?: string) => {
  // 1. Cek apakah user pernah membeli tiket event ini dan transaksinya selesai
  const completedTransaction = await prisma.transaction.findFirst({
    where: {
      userId,
      eventId,
      status: 'COMPLETED',
    }
  });

  if (!completedTransaction) {
    throw new Error('Anda hanya bisa mengulas event yang tiketnya sudah Anda beli.');
  }

  // [PERUBAHAN] Pengecekan tanggal selesai event dinonaktifkan sesuai permintaan
  // agar pengguna bisa langsung memberi ulasan setelah membayar.
  /*
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (event && new Date(event.endDate) > new Date()) {
    throw new Error('Anda baru bisa memberikan ulasan setelah event selesai.');
  }
  */

  // 2. Cek apakah user sudah pernah memberikan ulasan untuk event ini
  const existingReview = await prisma.review.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  if (existingReview) {
    throw new Error('Anda sudah pernah memberikan ulasan untuk event ini.');
  }

  // 3. Buat ulasan baru
  return prisma.review.create({
    data: { userId, eventId, rating, comment },
  });
};
