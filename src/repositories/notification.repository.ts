import prisma from "../config/prisma";
import { Prisma, Notification } from "@prisma/client";

export class NotificationRepository {
  async create(
    data:
      | Prisma.NotificationCreateInput
      | Prisma.NotificationUncheckedCreateInput
  ): Promise<Notification> {
    return prisma.notification.create({ data });
  }

  async findMany(
    args: Prisma.NotificationFindManyArgs
  ): Promise<Notification[]> {
    return prisma.notification.findMany(args);
  }

  async updateMany(args: Prisma.NotificationUpdateManyArgs) {
    return prisma.notification.updateMany(args);
  }
}
