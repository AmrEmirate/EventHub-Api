import prisma from "../config/prisma";
import { Prisma, User } from "@prisma/client";

export class UserRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  async findById(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<User | null> {
    return this.getClient(tx).user.findUnique({
      where: { id },
    });
  }

  async findByEmail(
    email: string,
    tx?: Prisma.TransactionClient
  ): Promise<User | null> {
    return this.getClient(tx).user.findUnique({
      where: { email },
    });
  }

  async findByReferralCode(
    code: string,
    tx?: Prisma.TransactionClient
  ): Promise<User | null> {
    return this.getClient(tx).user.findUnique({
      where: { referralCode: code },
    });
  }

  async create(
    data: Prisma.UserCreateInput | Prisma.UserUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<User> {
    return this.getClient(tx).user.create({
      data,
    });
  }

  async update(
    id: string,
    data: Prisma.UserUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<User> {
    return this.getClient(tx).user.update({
      where: { id },
      data,
    });
  }

  // --- Extended Methods for Relations ---
  async findByIdWithProfile(id: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async updateWithProfile(
    id: string,
    data: Prisma.UserUpdateInput,
    tx?: Prisma.TransactionClient
  ) {
    return this.getClient(tx).user.update({
      where: { id },
      data,
      include: { profile: true },
    });
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<User> {
    return this.getClient(tx).user.delete({
      where: { id },
    });
  }
}
