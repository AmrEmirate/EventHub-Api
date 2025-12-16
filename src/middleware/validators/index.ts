import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

const validate = (
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body"
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[source];
      const validatedData = await schema.parseAsync(dataToValidate);
      req[source] = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.flatten().fieldErrors;
        return res.status(400).json({
          message: "Validasi gagal",
          errors: formattedErrors,
        });
      }
      return res.status(500).json({
        message: "Terjadi kesalahan saat validasi",
      });
    }
  };
};

export { validate };
