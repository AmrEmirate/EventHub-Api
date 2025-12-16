import { z } from "zod";
import { validate } from "./index";

const createEventSchema = z
  .object({
    name: z.string().min(5, { message: "Nama event minimal 5 karakter" }),
    description: z
      .string()
      .min(20, { message: "Deskripsi minimal 20 karakter" }),
    category: z.string().min(1, { message: "Kategori wajib diisi" }),
    location: z.string().min(1, { message: "Lokasi wajib diisi" }),
    startDate: z.coerce.date({ message: "Format tanggal mulai tidak valid" }),
    endDate: z.coerce.date({ message: "Format tanggal selesai tidak valid" }),
    isFree: z.preprocess(
      (val) => val === "true" || val === true,
      z.boolean().default(false)
    ),
    ticketTotal: z.preprocess(
      (val) => Number(val),
      z.number().int().positive({ message: "Jumlah tiket harus angka positif" })
    ),
    price: z.preprocess((val) => Number(val), z.number().optional()),
  })
  .refine(
    (data) => {
      if (!data.isFree && (data.price === undefined || data.price <= 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Harga wajib diisi dan harus lebih dari 0 untuk event berbayar",
      path: ["price"],
    }
  )
  .transform((data) => {
    if (data.isFree) {
      return { ...data, price: 0 };
    }
    return { ...data, price: data.price! };
  });

const updateEventSchema = z
  .object({
    name: z
      .string()
      .min(5, { message: "Nama event minimal 5 karakter" })
      .optional(),
    description: z
      .string()
      .min(20, { message: "Deskripsi minimal 20 karakter" })
      .optional(),
    category: z.string().min(1, { message: "Kategori wajib diisi" }).optional(),
    location: z.string().min(1, { message: "Lokasi wajib diisi" }).optional(),
    startDate: z.coerce
      .date({ message: "Format tanggal mulai tidak valid" })
      .optional(),
    endDate: z.coerce
      .date({ message: "Format tanggal selesai tidak valid" })
      .optional(),
    isFree: z
      .preprocess((val) => val === "true" || val === true, z.boolean())
      .optional(),
    ticketTotal: z
      .preprocess(
        (val) => Number(val),
        z
          .number()
          .int()
          .positive({ message: "Jumlah tiket harus angka positif" })
      )
      .optional(),
    price: z.preprocess((val) => Number(val), z.number()).optional(),
  })
  .refine(
    (data) => {
      if (
        data.isFree === false &&
        (data.price === undefined || data.price <= 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Harga wajib diisi dan harus lebih dari 0 jika event berbayar",
      path: ["price"],
    }
  )
  .transform((data) => {
    if (data.isFree === true) {
      return { ...data, price: 0 };
    }
    return data;
  });

export const validateCreateEvent = validate(createEventSchema);
export const validateUpdateEvent = validate(updateEventSchema);

export { createEventSchema, updateEventSchema };
