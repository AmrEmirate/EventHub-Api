import { z } from "zod";
import { validate } from "./index";

const updateProfileSchema = z.object({
  name: z.string().min(3, { message: "Nama minimal 3 karakter" }).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url({ message: "URL avatar tidak valid" }).optional(),
  phone: z
    .string()
    .min(10, { message: "Nomor telepon minimal 10 digit" })
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, {
      message: "Format nomor telepon tidak valid",
    })
    .optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, { message: "Password lama wajib diisi" }),
  newPassword: z
    .string()
    .min(6, { message: "Password baru minimal 6 karakter" }),
});

export const validateUpdateProfile = validate(updateProfileSchema);
export const validateChangePassword = validate(changePasswordSchema);

export { updateProfileSchema, changePasswordSchema };
