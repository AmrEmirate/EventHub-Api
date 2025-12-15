import { z } from "zod";
import { validate } from "./index";

// Schema untuk create review
const createReviewSchema = z.object({
  eventId: z.string().uuid({ message: "Event ID tidak valid" }),
  rating: z.preprocess(
    (val) => Number(val),
    z
      .number()
      .int()
      .min(1, { message: "Rating minimal 1" })
      .max(5, { message: "Rating maksimal 5" })
  ),
  comment: z.string().optional(),
});

// Export validators
export const validateCreateReview = validate(createReviewSchema);

// Export schemas
export { createReviewSchema };
