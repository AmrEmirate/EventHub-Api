import { NotificationRepository } from "../repositories/notification.repository";

class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  /**
   * Membuat notifikasi baru untuk pengguna.
   */
  public async createNotification(userId: string, message: string) {
    return this.notificationRepository.create({
      userId,
      message,
    });
  }

  /**
   * Mengambil notifikasi untuk pengguna tertentu.
   */
  public async getNotificationsByUserId(userId: string) {
    return this.notificationRepository.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20, // Batasi untuk mengambil 20 notifikasi terbaru
    });
  }

  /**
   * Menandai semua notifikasi pengguna yang belum dibaca menjadi sudah dibaca.
   */
  public async markNotificationsAsRead(userId: string) {
    return this.notificationRepository.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }
}

export { NotificationService };
