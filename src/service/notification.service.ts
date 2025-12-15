import { NotificationRepository } from "../repositories/notification.repository";

const notificationRepository = new NotificationRepository();

/**
 * Membuat notifikasi baru untuk pengguna.
 */
export const createNotification = async (userId: string, message: string) => {
  return notificationRepository.create({
    userId,
    message,
  });
};

/**
 * Mengambil notifikasi untuk pengguna tertentu.
 */
export const getNotificationsByUserId = async (userId: string) => {
  return notificationRepository.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20, // Batasi untuk mengambil 20 notifikasi terbaru
  });
};

/**
 * Menandai semua notifikasi pengguna yang belum dibaca menjadi sudah dibaca.
 */
export const markNotificationsAsRead = async (userId: string) => {
  return notificationRepository.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
};
