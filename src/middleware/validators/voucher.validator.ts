import { z } from "zod";
import { validate } from "./index";

const createVoucherSchema = z.object({
  eventId: z.string().uuid({ message: "Event ID tidak valid" }),
  code: z
    .string()
    .min(5, { message: "Kode minimal 5 karakter" })
    .max(20, { message: "Kode maksimal 20 karakter" }),
  discountPercent: z
    .number()
    .int()
    .min(1, { message: "Diskon minimal 1%" })
    .max(100, { message: "Diskon maksimal 100%" }),
  maxDiscount: z
    .number()
    .positive({ message: "Maksimal diskon harus angka positif" })
    .optional()
    .nullable(),
  expiresAt: z.coerce.date({ message: "Format tanggal tidak valid" }),
});

export const validateCreateVoucher = validate(createVoucherSchema);

export { createVoucherSchema };
