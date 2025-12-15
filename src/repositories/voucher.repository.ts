import prisma from "../config/prisma";
import { Prisma, Voucher } from "@prisma/client";

export class VoucherRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  async findMany(
    args: Prisma.VoucherFindManyArgs,
    tx?: Prisma.TransactionClient
  ): Promise<Voucher[]> {
    return this.getClient(tx).voucher.findMany(args);
  }

  async findFirst(
    args: Prisma.VoucherFindFirstArgs,
    tx?: Prisma.TransactionClient
  ): Promise<Voucher | null> {
    return this.getClient(tx).voucher.findFirst(args);
  }

  async create(
    data: Prisma.VoucherCreateInput | Prisma.VoucherUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Voucher> {
    return this.getClient(tx).voucher.create({ data });
  }

  async update(
    id: string,
    data: Prisma.VoucherUpdateInput | Prisma.VoucherUncheckedUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Voucher> {
    return this.getClient(tx).voucher.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<Voucher> {
    return this.getClient(tx).voucher.delete({
      where: { id },
    });
  }
}
