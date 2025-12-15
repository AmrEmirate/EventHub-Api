import { UserRepository } from "../repositories/user.repository";
import { AuthRepository } from "../repositories/auth.repository";
import { hashPassword, comparePassword } from "../utils/password.helper";
import { generateSecureToken } from "../utils/token.helper";
import { generateToken } from "../utils/jwt.helper";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/mailer";
import { addPointsToUser } from "./user.service";
import { createVoucherForNewUser } from "./voucher.service";
import { createNotification } from "./notification.service";
import prisma from "../config/prisma"; // Used for transaction if needed, but we use repositories
import { OAuth2Client } from "google-auth-library";
import { UserRole } from "@prisma/client";

const userRepository = new UserRepository();
const authRepository = new AuthRepository();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

type RegisterInput = {
  email: string;
  name: string;
  password: string;
  role: "CUSTOMER" | "ORGANIZER";
  phone?: string | null;
  referralCode?: string | null;
};

export const login = async (email: string, pass: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new Error("Kredensial tidak valid");
  if (!user.emailVerified)
    throw new Error("Email belum diverifikasi. Silakan cek email Anda.");

  const isPasswordValid = await comparePassword(pass, user.password);
  if (!isPasswordValid) throw new Error("Kredensial tidak valid");

  const token = generateToken({ userId: user.id, role: user.role });

  // Return user data without password
  const { password, ...userToReturn } = user;

  // Add profile if needed? Controller previously fetched profile.
  // Should we fetch profile here?
  // Controller used `include: { profile: true }`.
  // Repository `findByEmail` doesn't include profile currently.
  // We can add `findByEmailWithProfile` to repo or just ignore profile for login if not critical,
  // BUT the controller returned the user object which implied profile might be there.
  // Let's stick to basic user for now or update Repo.
  // Updates later.

  return { token, user: userToReturn };
};

export const registerUser = async (data: RegisterInput) => {
  const { email, name, password, role, phone, referralCode } = data;

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    if (existingUser.emailVerified) throw new Error("Email sudah terdaftar.");
    await userRepository.delete(existingUser.id);
  }

  let referredById: string | null = null;
  if (referralCode && referralCode.trim() !== "") {
    const referrer = await userRepository.findByReferralCode(
      referralCode.trim()
    );

    if (referrer) {
      referredById = referrer.id;
      // [PERBAIKAN] Ubah poin referral menjadi 10.000
      await addPointsToUser(referrer.id, 10000);

      await createNotification(
        referrer.id,
        `Selamat! Seseorang telah menggunakan kode referral Anda. Anda mendapatkan 10,000 poin.`
      );
    }
  }

  const hashedPassword = await hashPassword(password);

  const user = await userRepository.create({
    email,
    name,
    password: hashedPassword,
    role,
    phone,
    referredById: referredById,
  });

  if (referredById) {
    await createVoucherForNewUser(user.id);
  }

  const token = generateSecureToken();
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  await authRepository.createVerificationToken({
    userId: user.id,
    token,
    expires,
  });

  await sendVerificationEmail(user.email, token);
  return { message: "Registrasi berhasil! Cek email Anda untuk verifikasi." };
};

export const verifyEmail = async (token: string) => {
  const existingToken = await authRepository.findVerificationToken(token);
  if (!existingToken)
    throw new Error("Token tidak valid atau tidak ditemukan.");
  if (new Date(existingToken.expires) < new Date())
    throw new Error("Token sudah kedaluwarsa.");

  await userRepository.update(existingToken.userId, {
    emailVerified: new Date(),
  });

  await authRepository.deleteVerificationToken(existingToken.id);
  return { message: "Email berhasil diverifikasi!" };
};

export const forgotPassword = async (email: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.emailVerified) {
    return {
      message:
        "Jika email Anda terdaftar dan terverifikasi, Anda akan menerima link reset password.",
    };
  }

  const token = generateSecureToken();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 jam

  await authRepository.createPasswordResetToken({
    userId: user.id,
    token,
    expires,
  });

  await sendPasswordResetEmail(user.email, token);
  return {
    message:
      "Jika email Anda terdaftar dan terverifikasi, Anda akan menerima link reset password.",
  };
};

export const resetPassword = async (token: string, newPassword: string) => {
  const existingToken = await authRepository.findPasswordResetToken(token);
  if (!existingToken)
    throw new Error("Token tidak valid atau tidak ditemukan.");
  if (new Date(existingToken.expires) < new Date())
    throw new Error("Token sudah kedaluwarsa.");

  const newHashedPassword = await hashPassword(newPassword);

  await userRepository.update(existingToken.userId, {
    password: newHashedPassword,
  });

  await authRepository.deletePasswordResetToken(existingToken.id);
  return { message: "Password berhasil direset. Silakan login." };
};

export const loginWithGoogle = async (idToken: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw new Error("Token Google tidak valid");
  }

  const { email, name, sub: googleId } = payload;

  // Cek user by googleId
  let user = await prisma.user.findFirst({
    where: { googleId },
  });

  if (!user) {
    // Cek by email
    user = await userRepository.findByEmail(email);
    if (user) {
      // Link account
      await userRepository.update(user.id, { googleId });
    } else {
      // Buat user baru (Password random karena login via google)
      const randomPassword = await hashPassword(
        Math.random().toString(36).slice(-8)
      );
      user = await userRepository.create({
        name: name || "User",
        email,
        googleId,
        password: randomPassword,
        role: UserRole.CUSTOMER, // Default role
        emailVerified: new Date(), // Google verified
      });
    }
  }

  const token = generateToken({ userId: user.id, role: user.role });
  const { password: _, ...userToReturn } = user;
  return { token, user: userToReturn };
};
