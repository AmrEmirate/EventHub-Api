import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class RewardsRepository {
  public async findAllPrizes() {
    return await prisma.pointPrize.findMany({
      where: { isActive: true },
      orderBy: { pointsRequired: "asc" },
    });
  }

  public async findPrizeById(id: string) {
    return await prisma.pointPrize.findUnique({
      where: { id },
    });
  }

  public async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, points: true },
    });
  }

  public async deductUserPoints(userId: string, points: number) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        points: { decrement: points },
      },
    });
  }

  public async createVoucherForUser(
    userId: string,
    code: string,
    discountPercent: number,
    expiresAt: Date
  ) {
    return await prisma.voucher.create({
      data: {
        userId,
        code,
        discountPercent,
        expiresAt,
        isUsed: false,
      },
    });
  }
}

export { RewardsRepository };
