import { z } from "zod";
import { validate } from "./index";

const registerSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  name: z.string().min(3, { message: "Nama minimal 3 karakter" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
  role: z.enum(["CUSTOMER", "ORGANIZER"], {
    errorMap: () => ({ message: "Role harus CUSTOMER atau ORGANIZER" }),
  }),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(1, { message: "Password wajib diisi" }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "Token wajib diisi" }),
  newPassword: z
    .string()
    .min(6, { message: "Password baru minimal 6 karakter" }),
});

const googleLoginSchema = z.object({
  token: z.string().min(1, { message: "Token Google wajib diisi" }),
});

export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
export const validateForgotPassword = validate(forgotPasswordSchema);
export const validateResetPassword = validate(resetPasswordSchema);
export const validateGoogleLogin = validate(googleLoginSchema);

export {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleLoginSchema,
};
