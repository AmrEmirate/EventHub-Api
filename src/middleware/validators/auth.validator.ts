import { z } from "zod";
import { validate } from "./index";

// Schema untuk register
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

// Schema untuk login
const loginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(1, { message: "Password wajib diisi" }),
});

// Schema untuk forgot password
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
});

// Schema untuk reset password
const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "Token wajib diisi" }),
  newPassword: z
    .string()
    .min(6, { message: "Password baru minimal 6 karakter" }),
});

// Schema untuk Google login
const googleLoginSchema = z.object({
  token: z.string().min(1, { message: "Token Google wajib diisi" }),
});

// Export validators
export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
export const validateForgotPassword = validate(forgotPasswordSchema);
export const validateResetPassword = validate(resetPasswordSchema);
export const validateGoogleLogin = validate(googleLoginSchema);

// Export schemas jika dibutuhkan di tempat lain
export {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleLoginSchema,
};
