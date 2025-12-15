import { Request, Response } from "express";
import { NotificationService } from "../service/notification.service";

class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  public async getMyNotifications(req: Request, res: Response) {
    try {
      const notifications =
        await this.notificationService.getNotificationsByUserId(req.user!.id);
      res.status(200).json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: "Gagal mengambil notifikasi." });
    }
  }

  public async markAsRead(req: Request, res: Response) {
    try {
      await this.notificationService.markNotificationsAsRead(req.user!.id);
      res
        .status(200)
        .json({ message: "Semua notifikasi ditandai telah dibaca." });
    } catch (error: any) {
      res.status(500).json({ message: "Gagal menandai notifikasi." });
    }
  }
}

export { NotificationController };
