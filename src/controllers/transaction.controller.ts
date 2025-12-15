import { Request, Response } from "express";
import * as transactionService from "../service/transaction.service";
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

export const createTransactionController = async (
  req: Request,
  res: Response
) => {
  try {
    const validatedData = createTransactionSchema.parse(req.body);
    const { eventId, quantity, voucherCode, usePoints } = validatedData;

    const transaction = await transactionService.createTransaction(
      req.user!.id,
      eventId,
      quantity,
      voucherCode,
      usePoints
    );
    res.status(201).json(transaction);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({
          message: "Input tidak valid",
          errors: error.flatten().fieldErrors,
        });
    }
    res.status(400).json({ message: error.message });
  }
};

export const uploadPaymentProofController = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.file) {
      throw new Error("File bukti pembayaran tidak ditemukan.");
    }
    const transactionId = req.params.id;
    await transactionService.uploadPaymentProof(
      req.user!.id,
      transactionId,
      req.file
    );
    res.status(200).json({ message: "Upload bukti pembayaran berhasil" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getOrganizerTransactionsController = async (
  req: Request,
  res: Response
) => {
  if (req.user?.role !== "ORGANIZER") {
    return res.status(403).json({ message: "Akses ditolak." });
  }
  try {
    const transactions = await transactionService.getTransactionsForOrganizer(
      req.user!.id
    );
    res.status(200).json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const approveTransactionController = async (
  req: Request,
  res: Response
) => {
  if (req.user?.role !== "ORGANIZER") {
    return res.status(403).json({ message: "Akses ditolak." });
  }
  try {
    await transactionService.approveTransaction(req.user!.id, req.params.id);
    res.status(200).json({ message: "Transaksi disetujui." });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const rejectTransactionController = async (
  req: Request,
  res: Response
) => {
  if (req.user?.role !== "ORGANIZER") {
    return res.status(403).json({ message: "Akses ditolak." });
  }
  try {
    await transactionService.rejectTransaction(req.user!.id, req.params.id);
    res.status(200).json({ message: "Transaksi ditolak." });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyTransactionsController = async (
  req: Request,
  res: Response
) => {
  try {
    const transactions = await transactionService.getTransactionsByUserId(
      req.user!.id
    );
    res.status(200).json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelTransactionController = async (
  req: Request,
  res: Response
) => {
  try {
    const transaction = await transactionService.cancelTransaction(
      req.user!.id,
      req.params.id
    );
    res
      .status(200)
      .json({ message: "Transaksi berhasil dibatalkan", data: transaction });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * [CONTROLLER BARU] Untuk mengambil detail satu transaksi.
 */
export const getTransactionByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const transaction = await transactionService.getTransactionById(
      req.user!.id,
      req.params.id
    );
    res.status(200).json(transaction);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};
