import { Request, Response } from 'express';
import * as notificationService from './notification.service';

export const getMyNotificationsController = async (req: Request, res: Response) => {
  try {
    const notifications = await notificationService.getNotificationsByUserId(req.user!.id);
    res.status(200).json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengambil notifikasi.' });
  }
};

export const markAsReadController = async (req: Request, res: Response) => {
  try {
    await notificationService.markNotificationsAsRead(req.user!.id);
    res.status(200).json({ message: 'Semua notifikasi ditandai telah dibaca.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal menandai notifikasi.' });
  }
};