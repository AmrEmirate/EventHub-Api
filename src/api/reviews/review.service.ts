import prisma from '../../config/prisma';

export const createReview = async (userId: string, eventId: string, rating: number, comment?: string, imageUrl?: string) => {
  const completedTransaction = await prisma.transaction.findFirst({
    where: {
      userId,
      eventId,
      status: 'COMPLETED',
    },
  });

  if (!completedTransaction) {
    throw new Error('Anda hanya bisa mengulas event yang tiketnya sudah Anda beli.');
  }

  const existingReview = await prisma.review.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  if (existingReview) {
    throw new Error('Anda sudah pernah memberikan ulasan untuk event ini.');
  }

  return prisma.review.create({
    data: { 
      userId, 
      eventId, 
      rating, 
      comment,
      imageUrl, // <-- Simpan path gambar
    },
  });
};
