import { Request, Response } from "express";
import { TransactionService } from "../service/transaction.service";
import { z } from "zod";

const createTransactionSchema = z.object({
  eventId: z.string().uuid({ message: "Event ID tidak valid" }),
  quantity: z
    .number()
    .int()
    .positive({ message: "Jumlah tiket harus positif" }),
  voucherCode: z.string().optional(),
  usePoints: z.boolean().optional(),
});

class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  public async createTransaction(req: Request, res: Response) {
    try {
      const validatedData = createTransactionSchema.parse(req.body);
      const { eventId, quantity, voucherCode, usePoints } = validatedData;

      const transaction = await this.transactionService.createTransaction(
        req.user!.id,
        eventId,
        quantity,
        voucherCode,
        usePoints
      );
      res.status(201).json(transaction);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Input tidak valid",
          errors: error.flatten().fieldErrors,
        });
      }
      res.status(400).json({ message: error.message });
    }
  }

  public async uploadPaymentProof(req: Request, res: Response) {
    try {
      if (!req.file) {
        throw new Error("File bukti pembayaran tidak ditemukan.");
      }
      const transactionId = req.params.id;
      await this.transactionService.uploadPaymentProof(
        req.user!.id,
        transactionId,
        req.file
      );
      res.status(200).json({ message: "Upload bukti pembayaran berhasil" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  public async getOrganizerTransactions(req: Request, res: Response) {
    if (req.user?.role !== "ORGANIZER") {
      return res.status(403).json({ message: "Akses ditolak." });
    }
    try {
      const transactions =
        await this.transactionService.getTransactionsForOrganizer(req.user!.id);
      res.status(200).json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async approveTransaction(req: Request, res: Response) {
    if (req.user?.role !== "ORGANIZER") {
      return res.status(403).json({ message: "Akses ditolak." });
    }
    try {
      await this.transactionService.approveTransaction(
        req.user!.id,
        req.params.id
      );
      res.status(200).json({ message: "Transaksi disetujui." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  public async rejectTransaction(req: Request, res: Response) {
    if (req.user?.role !== "ORGANIZER") {
      return res.status(403).json({ message: "Akses ditolak." });
    }
    try {
      await this.transactionService.rejectTransaction(
        req.user!.id,
        req.params.id
      );
      res.status(200).json({ message: "Transaksi ditolak." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  public async getMyTransactions(req: Request, res: Response) {
    try {
      const transactions =
        await this.transactionService.getTransactionsByUserId(req.user!.id);
      res.status(200).json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  public async cancelTransaction(req: Request, res: Response) {
    try {
      const transaction = await this.transactionService.cancelTransaction(
        req.user!.id,
        req.params.id
      );
      res
        .status(200)
        .json({ message: "Transaksi berhasil dibatalkan", data: transaction });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  public async getTransactionById(req: Request, res: Response) {
    try {
      const transaction = await this.transactionService.getTransactionById(
        req.user!.id,
        req.params.id
      );
      res.status(200).json(transaction);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }
}

export { TransactionController };
