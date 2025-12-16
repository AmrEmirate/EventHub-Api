import prisma from "../config/prisma";
import { Prisma, Transaction } from "@prisma/client";

class TransactionRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  async findMany(
    args: Prisma.TransactionFindManyArgs,
    tx?: Prisma.TransactionClient
  ) {
    return this.getClient(tx).transaction.findMany(args);
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Transaction | null> {
    return this.getClient(tx).transaction.findUnique({ where: { id } });
  }

  async findFirst(
    args: Prisma.TransactionFindFirstArgs,
    tx?: Prisma.TransactionClient
  ): Promise<Transaction | null> {
    return this.getClient(tx).transaction.findFirst(args);
  }

  async create(
    data:
      | Prisma.TransactionCreateInput
      | Prisma.TransactionUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Transaction> {
    return this.getClient(tx).transaction.create({ data });
  }

  async update(
    id: string,
    data:
      | Prisma.TransactionUpdateInput
      | Prisma.TransactionUncheckedUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Transaction> {
    return this.getClient(tx).transaction.update({
      where: { id },
      data,
    });
  }

  async aggregateRevenue(organizerId: string, startDate: Date, endDate: Date) {
    return prisma.transaction.aggregate({
      _sum: { finalPrice: true },
      where: {
        event: { organizerId },
        status: "COMPLETED",
        createdAt: { gte: startDate, lte: endDate },
      },
    });
  }

  async aggregateTicketsSold(
    organizerId: string,
    startDate: Date,
    endDate: Date
  ) {
    return prisma.transaction.aggregate({
      _sum: { quantity: true },
      where: {
        event: { organizerId },
        status: "COMPLETED",
        createdAt: { gte: startDate, lte: endDate },
      },
    });
  }

  async groupRevenueByDay(organizerId: string, startDate: Date, endDate: Date) {
    return prisma.transaction.groupBy({
      by: ["createdAt"],
      where: {
        event: { organizerId },
        status: "COMPLETED",
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { finalPrice: true },
      orderBy: { createdAt: "asc" },
    });
  }
}

export { TransactionRepository };
