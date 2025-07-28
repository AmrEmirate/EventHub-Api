import prisma from '../../config/prisma';
import { Prisma } from '@prisma/client';
import { hashPassword, comparePassword } from '../../utils/password.helper';

// --- FUNGSI LAMA (TIDAK BERUBAH) ---
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true,
      email: true,
      name: true,
      role: true,
      points: true,
      referralCode: true,
      phone: true,
      profile: true,
    },
  });
  return user;
};

type UpdateProfileInput = {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  phone?: string;
};

export const updateUserProfile = async (userId: string, data: UpdateProfileInput) => {
  const { name, bio, avatarUrl, phone } = data;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name, 
      phone: phone, 
      profile: { 
        upsert: {
          create: { bio, avatarUrl }, 
          update: { bio, avatarUrl },
        },
      },
    },
    select: { 
      id: true,
      email: true,
      name: true,
      phone: true,
      profile: true,
    },
  });
  return updatedUser;
};

export const changeUserPassword = async (
  userId: string,
  oldPass: string,
  newPass: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User tidak ditemukan.');
  }

  const isOldPasswordValid = await comparePassword(oldPass, user.password);
  if (!isOldPasswordValid) {
    throw new Error('Password lama tidak sesuai.');
  }

  const newHashedPassword = await hashPassword(newPass);

  await prisma.user.update({
    where: { id: userId },
    data: { password: newHashedPassword },
  });

  return { message: 'Password berhasil diperbarui.' };
};

export const addPointsToUser = async (userId: string, pointsToAdd: number) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: pointsToAdd,
        },
        pointsLastUpdatedAt: new Date(), 
      },
    });
    return updatedUser;
  } catch (error) {
    console.error(`Gagal menambahkan ${pointsToAdd} poin untuk user ${userId}:`, error);
    throw new Error('Gagal memperbarui poin pengguna.');
  }
};

// --- [FUNGSI BARU] ---
// Fungsi untuk mengupdate URL avatar pengguna
export const updateUserAvatar = async (userId: string, avatarPath: string) => {
  // Gunakan upsert: jika profil belum ada, buat baru. Jika sudah ada, update.
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      profile: {
        upsert: {
          create: { avatarUrl: avatarPath },
          update: { avatarUrl: avatarPath },
        },
      },
    },
    select: { // Kirim kembali data profil yang terupdate
      id: true,
      email: true,
      name: true,
      phone: true,
      profile: true,
    },
  });
  return updatedUser;
};