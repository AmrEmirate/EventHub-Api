import prisma from "../config/prisma";
import { Prisma, Review } from "@prisma/client";

class ReviewRepository {
  async create(
    data: Prisma.ReviewCreateInput | Prisma.ReviewUncheckedCreateInput
  ): Promise<Review> {
    return prisma.review.create({ data });
  }

  async findUnique(args: Prisma.ReviewFindUniqueArgs): Promise<Review | null> {
    return prisma.review.findUnique(args);
  }

  async findByEventId(eventId: string) {
    return prisma.review.findMany({
      where: { eventId },
      include: {
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
      orderBy: { createdAt: "desc" },
    });
  }
}

export { ReviewRepository };
