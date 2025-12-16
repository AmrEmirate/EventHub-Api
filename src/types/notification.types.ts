export interface CreateNotificationInput {
  userId: string;
  message: string;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
