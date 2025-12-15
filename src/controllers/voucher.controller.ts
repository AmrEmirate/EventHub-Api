import { Request, Response } from "express";
import {
  getVouchersByUserId,
  createOrganizerVoucher,
} from "../service/voucher.service";
import { z } from "zod";
import { UserRole } from "@prisma/client";

// Skema validasi untuk input dari form
const createVoucherSchema = z.object({
  eventId: z.string().uuid("Event ID tidak valid"),
  code: z
    .string()
    .min(5, "Kode minimal 5 karakter")
    .max(20, "Kode maksimal 20 karakter"),
  discountPercent: z
    .number()
    .int()
    .min(1, "Diskon minimal 1%")
    .max(100, "Diskon maksimal 100%"),
  maxDiscount: z
    .number()
    .positive("Maksimal diskon harus angka positif")
    .optional()
    .nullable(),
  expiresAt: z.coerce.date({ message: "Format tanggal tidak valid" }),
});

// Controller untuk user (tidak berubah)
export const getMyVouchersController = async (req: Request, res: Response) => {
  try {
    const vouchers = await getVouchersByUserId(req.user!.id);
    res.status(200).json(vouchers);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data voucher", error: error.message });
  }
};

// [CONTROLLER BARU] Untuk menangani pembuatan voucher oleh organizer
export const createOrganizerVoucherController = async (
  req: Request,
  res: Response
) => {
  if (req.user?.role !== UserRole.ORGANIZER) {
    return res
      .status(403)
      .json({ message: "Hanya organizer yang bisa membuat voucher." });
  }

  try {
    const validatedData = createVoucherSchema.parse(req.body);
    const organizerId = req.user!.id;

    const newVoucher = await createOrganizerVoucher(organizerId, validatedData);

    res
      .status(201)
      .json({ message: "Voucher berhasil dibuat!", data: newVoucher });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({
          message: "Input tidak valid",
          errors: error.flatten().fieldErrors,
        });
    }
    // Tangani error lain dari service (misal: kode duplikat)
    res.status(400).json({ message: error.message });
  }
};
