import prisma from "../config/prisma";
import { Prisma, Event } from "@prisma/client";

class EventRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  async findMany(
    args: Prisma.EventFindManyArgs,
    tx?: Prisma.TransactionClient
  ): Promise<Event[]> {
    return this.getClient(tx).event.findMany(args);
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Event | null> {
    return this.getClient(tx).event.findUnique({ where: { id } });
  }

  async findBySlugWithReviews(slug: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).event.findUnique({
      where: { slug },
      include: {
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            imageUrl: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  async findFirst(
    args: Prisma.EventFindFirstArgs,
    tx?: Prisma.TransactionClient
  ): Promise<Event | null> {
    return this.getClient(tx).event.findFirst(args);
  }

  async create(
    data: Prisma.EventCreateInput | Prisma.EventUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Event> {
    return this.getClient(tx).event.create({ data });
  }

  async update(
    id: string,
    data: Prisma.EventUpdateInput | Prisma.EventUncheckedUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Event> {
    return this.getClient(tx).event.update({
      where: { id },
      data,
    });
  }

  async deleteWithDependencies(eventId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.review.deleteMany({ where: { eventId } });
      await tx.voucher.deleteMany({ where: { eventId } });
      await tx.transaction.deleteMany({ where: { eventId } });
      await tx.event.delete({ where: { id: eventId } });
    });
  }

  async countByOrganizer(organizerId: string) {
    return prisma.event.count({
      where: { organizerId },
    });
  }

  async findTopSellingEvents(
    organizerId: string,
    startDate: Date,
    endDate: Date,
    limit: number
  ) {
    return prisma.event.findMany({
      where: {
        organizerId: organizerId,
        transactions: {
          some: {
            status: "COMPLETED",
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      select: {
        name: true,
        ticketSold: true,
      },
      orderBy: {
        ticketSold: "desc",
      },
      take: limit,
    });
  }
}

export { EventRepository };
