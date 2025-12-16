import { z } from "zod";
import { validate } from "./index";

const createTransactionSchema = z.object({
  eventId: z.string().uuid({ message: "Event ID tidak valid" }),
  quantity: z
    .number()
    .int()
    .positive({ message: "Jumlah tiket harus positif" }),
  voucherCode: z.string().optional(),
  usePoints: z.boolean().optional(),
});

export const validateCreateTransaction = validate(createTransactionSchema);

export { createTransactionSchema };
