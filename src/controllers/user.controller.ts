import { Request, Response } from "express";
import {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  updateUserAvatar,
} from "../service/user.service";
import { z } from "zod";

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

export const getMeController = async (req: Request, res: Response) => {
  try {
    const userProfile = await getUserProfile(req.user!.id);
    if (!userProfile) {
      return res.status(404).json({ message: "Profil tidak ditemukan" });
    }
    res.status(200).json(userProfile);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Gagal mengambil profil", error: error.message });
  }
};

export const updateMeController = async (req: Request, res: Response) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const updatedProfile = await updateUserProfile(req.user!.id, validatedData);
    res
      .status(200)
      .json({ message: "Profil berhasil diperbarui", data: updatedProfile });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({
          message: "Input tidak valid",
          errors: error.flatten().fieldErrors,
        });
    }
    res
      .status(500)
      .json({ message: "Gagal memperbarui profil", error: error.message });
  }
};

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, { message: "Password lama wajib diisi" }),
  newPassword: z
    .string()
    .min(6, { message: "Password baru minimal 6 karakter" }),
});

export const changePasswordController = async (req: Request, res: Response) => {
  try {
    const validatedData = changePasswordSchema.parse(req.body);
    const result = await changeUserPassword(
      req.user!.id,
      validatedData.oldPassword,
      validatedData.newPassword
    );
    res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({
          message: "Input tidak valid",
          errors: error.flatten().fieldErrors,
        });
    }
    res.status(400).json({ message: error.message });
  }
};

// --- [CONTROLLER BARU] ---
// Untuk menangani upload avatar
export const updateMyAvatarController = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Tidak ada file yang diunggah." });
    }

    // Buat URL yang bisa diakses publik dari nama file yang di-generate multer
    const avatarUrl = `/uploads/${req.file.filename}`;

    const updatedProfile = await updateUserAvatar(req.user!.id, avatarUrl);

    res
      .status(200)
      .json({
        message: "Foto profil berhasil diperbarui",
        data: updatedProfile,
      });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Gagal memperbarui foto profil", error: error.message });
  }
};
