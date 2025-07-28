import prisma from '../../config/prisma';

/**
 * Membuat notifikasi baru untuk pengguna.
 */
export const createNotification = async (userId: string, message: string) => {
  return prisma.notification.create({
    data: {
      userId,
      message,
    },
  });
};

/**
 * Mengambil notifikasi untuk pengguna tertentu.
 */
export const getNotificationsByUserId = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20, // Batasi untuk mengambil 20 notifikasi terbaru
  });
};

/**
 * Menandai semua notifikasi pengguna yang belum dibaca menjadi sudah dibaca.
 */
export const markNotificationsAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
};