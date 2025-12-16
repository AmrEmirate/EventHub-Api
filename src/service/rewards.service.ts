import { RewardsRepository } from "../repositories/rewards.repository";

class RewardsService {
  private rewardsRepository: RewardsRepository;

  constructor() {
    this.rewardsRepository = new RewardsRepository();
  }

  public async getAllPrizes() {
    return await this.rewardsRepository.findAllPrizes();
  }

  public async redeemPrize(userId: string, prizeId: string) {
    const prize = await this.rewardsRepository.findPrizeById(prizeId);
    if (!prize || !prize.isActive) {
      throw new Error("Hadiah tidak ditemukan atau tidak aktif.");
    }

    const user = await this.rewardsRepository.getUserById(userId);
    if (!user) {
      throw new Error("User tidak ditemukan.");
    }

    if (user.points < prize.pointsRequired) {
      throw new Error(
        `Poin Anda tidak cukup. Dibutuhkan ${prize.pointsRequired} poin, Anda memiliki ${user.points} poin.`
      );
    }

    await this.rewardsRepository.deductUserPoints(userId, prize.pointsRequired);

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    const voucherCode = `PRIZE-${randomSuffix}`;

    const discountPercent = this.calculateDiscountFromPrize(
      prize.pointsRequired
    );

    const voucher = await this.rewardsRepository.createVoucherForUser(
      userId,
      voucherCode,
      discountPercent,
      threeMonthsFromNow
    );

    return {
      message: `Berhasil menukar ${prize.pointsRequired} poin dengan ${prize.name}!`,
      voucher,
    };
  }

  private calculateDiscountFromPrize(pointsRequired: number): number {
    if (pointsRequired >= 5000) return 50;
    if (pointsRequired >= 2000) return 25;
    if (pointsRequired >= 1000) return 15;
    return 10;
  }
}

export { RewardsService };
