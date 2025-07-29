import prisma from '../../config/prisma';
import { hashPassword } from '../../utils/password.helper';
import { generateSecureToken } from '../../utils/token.helper';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../utils/mailer';
import { User } from '@prisma/client';

import { addPointsToUser } from '../users/user.service';
import { createVoucherForNewUser } from '../vouchers/voucher.service';
import { createNotification } from '../notifications/notification.service';


type RegisterInput = {
  email: string;
  name: string;
  password: string;
  role: 'CUSTOMER' | 'ORGANIZER';
  phone?: string | null;
  referralCode?: string | null;
};

export const registerUser = async (data: RegisterInput) => {
  const { email, name, password, role, phone, referralCode } = data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (existingUser.emailVerified) throw new Error('Email sudah terdaftar.');
    await prisma.user.delete({ where: { id: existingUser.id }});
  }

  let referredById: string | null = null;
  if (referralCode && referralCode.trim() !== '') {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.trim() },
    });
    
    if (referrer) {
      referredById = referrer.id;
      await addPointsToUser(referrer.id, 10000); // Sesuai permintaan, 10.000 poin

      await createNotification(
          referrer.id,
          `Selamat! Seseorang telah menggunakan kode referral Anda. Anda mendapatkan 10,000 poin.`
      );
    }
  }

  const hashedPassword = await hashPassword(password);
  
  const user = await prisma.user.create({
    data: { 
      email, 
      name, 
      password: hashedPassword, 
      role, 
      phone,
      referredById: referredById,
    },
  });

  // [PERBAIKAN] Pastikan kupon dibuat jika referral berhasil
  if (referredById) {
    await createVoucherForNewUser(user.id); // Teruskan user.id yang baru dibuat
  }

  const token = generateSecureToken();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  await prisma.verificationToken.create({
    data: { userId: user.id, token, expires },
  });

  await sendVerificationEmail(user.email, token);
  return { message: "Registrasi berhasil! Cek email Anda untuk verifikasi." };
};


export const verifyEmail = async (token: string) => {
    const existingToken = await prisma.verificationToken.findUnique({ where: { token } });
    if (!existingToken) throw new Error("Token tidak valid atau tidak ditemukan.");
    if (new Date(existingToken.expires) < new Date()) throw new Error("Token sudah kedaluwarsa.");

    await prisma.user.update({
        where: { id: existingToken.userId },
        data: { emailVerified: new Date() }
    });

    await prisma.verificationToken.delete({ where: { id: existingToken.id } });
    return { message: "Email berhasil diverifikasi!" };
};

export const forgotPassword = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.emailVerified) {
        return { message: "Jika email Anda terdaftar dan terverifikasi, Anda akan menerima link reset password." };
    }

    const token = generateSecureToken();
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 jam

    await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expires }
    });

    await sendPasswordResetEmail(user.email, token);
    return { message: "Jika email Anda terdaftar dan terverifikasi, Anda akan menerima link reset password." };
};

export const resetPassword = async (token: string, newPassword: string) => {
    const existingToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!existingToken) throw new Error("Token tidak valid atau tidak ditemukan.");
    if (new Date(existingToken.expires) < new Date()) throw new Error("Token sudah kedaluwarsa.");

    const newHashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
        where: { id: existingToken.userId },
        data: { password: newHashedPassword }
    });

    await prisma.passwordResetToken.delete({ where: { id: existingToken.id } });
    return { message: "Password berhasil direset. Silakan login." };
};