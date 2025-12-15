import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

// Logger untuk validation
const logValidation = (
  type: "INFO" | "ERROR" | "WARN",
  endpoint: string,
  message: string,
  details?: any
) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${type}] [${timestamp}] [VALIDATION] ${endpoint}: ${message}`;

  if (type === "ERROR") {
    console.error(logMessage, details || "");
  } else if (type === "WARN") {
    console.warn(logMessage, details || "");
  } else {
    console.log(logMessage, details || "");
  }
};

/**
 * Middleware factory untuk validasi request menggunakan Zod schema
 * @param schema - Zod schema untuk validasi
 * @param source - Sumber data yang akan divalidasi ('body' | 'query' | 'params')
 */
const validate = (
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body"
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const endpoint = `${req.method} ${req.originalUrl}`;

    try {
      const dataToValidate = req[source];

      logValidation("INFO", endpoint, `Validating ${source}...`, {
        data: source === "body" ? "[BODY DATA]" : dataToValidate,
      });

      // Parse dan validasi data
      const validatedData = await schema.parseAsync(dataToValidate);

      // Simpan data yang sudah divalidasi kembali ke request
      req[source] = validatedData;

      logValidation("INFO", endpoint, `Validation successful for ${source}`);

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.flatten().fieldErrors;

        logValidation("ERROR", endpoint, "Validation failed", {
          errors: formattedErrors,
        });

        return res.status(400).json({
          message: "Validasi gagal",
          errors: formattedErrors,
        });
      }

      logValidation("ERROR", endpoint, "Unexpected validation error", error);

      return res.status(500).json({
        message: "Terjadi kesalahan saat validasi",
      });
    }
  };
};

export { validate, logValidation };
