import { z } from "zod";
import { validate } from "./index";

const dashboardQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const validateDashboardQuery = validate(dashboardQuerySchema, "query");

export { dashboardQuerySchema };
