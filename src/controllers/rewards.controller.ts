import { Request, Response } from "express";
import { RewardsService } from "../service/rewards.service";

class RewardsController {
  private rewardsService: RewardsService;

  constructor() {
    this.rewardsService = new RewardsService();
  }

  public async getAllPrizes(req: Request, res: Response) {
    try {
      const prizes = await this.rewardsService.getAllPrizes();
      res.status(200).json(prizes);
    } catch (error: any) {
      res.status(500).json({
        message: "Gagal mengambil daftar hadiah",
        error: error.message,
      });
    }
  }

  public async redeemPrize(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { prizeId } = req.params;

      if (!prizeId) {
        return res.status(400).json({ message: "Prize ID diperlukan" });
      }

      const result = await this.rewardsService.redeemPrize(userId, prizeId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}

export { RewardsController };
