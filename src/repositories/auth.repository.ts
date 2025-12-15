import prisma from "../config/prisma";
import { Prisma, VerificationToken, PasswordResetToken } from "@prisma/client";

export class AuthRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  // --- Verification Token ---
  async createVerificationToken(
    data:
      | Prisma.VerificationTokenCreateInput
      | Prisma.VerificationTokenUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<VerificationToken> {
    return this.getClient(tx).verificationToken.create({
      data,
    });
  }

  async findVerificationToken(
    token: string,
    tx?: Prisma.TransactionClient
  ): Promise<VerificationToken | null> {
    return this.getClient(tx).verificationToken.findUnique({
      where: { token },
    });
  }

  async deleteVerificationToken(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<VerificationToken> {
    return this.getClient(tx).verificationToken.delete({
      where: { id },
    });
  }

  // --- Password Reset Token ---
  async createPasswordResetToken(
    data:
      | Prisma.PasswordResetTokenCreateInput
      | Prisma.PasswordResetTokenUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<PasswordResetToken> {
    return this.getClient(tx).passwordResetToken.create({
      data,
    });
  }

  async findPasswordResetToken(
    token: string,
    tx?: Prisma.TransactionClient
  ): Promise<PasswordResetToken | null> {
    return this.getClient(tx).passwordResetToken.findUnique({
      where: { token },
    });
  }

  async deletePasswordResetToken(
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<PasswordResetToken> {
    return this.getClient(tx).passwordResetToken.delete({
      where: { id },
    });
  }
}
