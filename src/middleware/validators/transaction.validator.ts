import { z } from "zod";
import { validate } from "./index";

// Schema untuk create transaction
const createTransactionSchema = z.object({
  eventId: z.string().uuid({ message: "Event ID tidak valid" }),
  quantity: z
    .number()
    .int()
    .positive({ message: "Jumlah tiket harus positif" }),
  voucherCode: z.string().optional(),
  usePoints: z.boolean().optional(),
});

// Export validators
export const validateCreateTransaction = validate(createTransactionSchema);

// Export schemas
export { createTransactionSchema };
