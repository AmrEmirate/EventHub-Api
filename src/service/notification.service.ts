import { NotificationRepository } from "../repositories/notification.repository";

class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  public async createNotification(userId: string, message: string) {
    return this.notificationRepository.create({
      userId,
      message,
    });
  }

  public async getNotificationsByUserId(userId: string) {
    return this.notificationRepository.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

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
