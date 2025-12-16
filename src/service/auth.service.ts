import { UserRepository } from "../repositories/user.repository";
import { AuthRepository } from "../repositories/auth.repository";
import { hashPassword, comparePassword } from "../utils/password.helper";
import { generateSecureToken } from "../utils/token.helper";
import { generateToken } from "../utils/jwt.helper";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/mailer";
import { UserService } from "./user.service";
import { VoucherService } from "./voucher.service";
import { NotificationService } from "./notification.service";
import prisma from "../config/prisma";
import { OAuth2Client } from "google-auth-library";
import { UserRole } from "@prisma/client";

type RegisterInput = {
  email: string;
  name: string;
  password: string;
  role: "CUSTOMER" | "ORGANIZER";
  phone?: string | null;
  referralCode?: string | null;
};

class AuthService {
  private userRepository: UserRepository;
  private authRepository: AuthRepository;
  private googleClient: OAuth2Client;
  private userService: UserService;
  private voucherService: VoucherService;
  private notificationService: NotificationService;

  constructor() {
    this.userRepository = new UserRepository();
    this.authRepository = new AuthRepository();
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    this.userService = new UserService();
    this.voucherService = new VoucherService();
    this.notificationService = new NotificationService();
  }

  public async login(email: string, pass: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("Kredensial tidak valid");
    if (!user.emailVerified)
      throw new Error("Email belum diverifikasi. Silakan cek email Anda.");

    const isPasswordValid = await comparePassword(pass, user.password);
    if (!isPasswordValid) throw new Error("Kredensial tidak valid");

    const token = generateToken({ userId: user.id, role: user.role });

    const { password, ...userToReturn } = user;
    return { token, user: userToReturn };
  }

  public async register(data: RegisterInput) {
    const { email, name, password, role, phone, referralCode } = data;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("Email sudah terdaftar");
    }

    let referredById: string | null = null;
    let pointsToAdd = 0;
    if (referralCode && referralCode.trim() !== "") {
      const referrer = await this.userRepository.findByReferralCode(
        referralCode.trim()
      );

      if (referrer) {
        referredById = referrer.id;
        pointsToAdd = 10000;
        await this.userService.addPointsToUser(referrer.id, 10000);

        await this.notificationService.createNotification(
          referrer.id,
          `Selamat! Anda mendapatkan 10.000 poin karena teman Anda mendaftar menggunakan kode referral Anda.`
        );
      }
    }

    const hashedPassword = await hashPassword(password);
    const user = await this.userRepository.create({
      email,
      name,
      password: hashedPassword,
      role,
      phone,
      referralCode: undefined,
      referredById: referredById || undefined,
    });

    await this.voucherService.createVoucherForNewUser(user.id);

    const verificationToken = generateSecureToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.authRepository.createVerificationToken({
      userId: user.id,
      token: verificationToken,
      expires,
    });

    await sendVerificationEmail(email, verificationToken);

    return {
      message: "Registrasi berhasil. Silakan cek email untuk verifikasi.",
      user,
    };
  }
  public async verifyEmail(token: string) {
    const existingToken = await this.authRepository.findVerificationToken(
      token
    );
    if (!existingToken)
      throw new Error("Token tidak valid atau tidak ditemukan.");
    if (new Date(existingToken.expires) < new Date())
      throw new Error("Token sudah kedaluwarsa.");

    await this.userRepository.update(existingToken.userId, {
      emailVerified: new Date(),
    });

    await this.authRepository.deleteVerificationToken(existingToken.id);
    return { message: "Email berhasil diverifikasi!" };
  }

  public async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.emailVerified) {
      return {
        message:
          "Jika email Anda terdaftar dan terverifikasi, Anda akan menerima link reset password.",
      };
    }

    const token = generateSecureToken();
    const expires = new Date(new Date().getTime() + 3600 * 1000);

    await this.authRepository.createPasswordResetToken({
      userId: user.id,
      token,
      expires,
    });

    await sendPasswordResetEmail(user.email, token);
    return {
      message:
        "Jika email Anda terdaftar dan terverifikasi, Anda akan menerima link reset password.",
    };
  }

  public async resetPassword(token: string, newPassword: string) {
    const existingToken = await this.authRepository.findPasswordResetToken(
      token
    );
    if (!existingToken)
      throw new Error("Token tidak valid atau tidak ditemukan.");
    if (new Date(existingToken.expires) < new Date())
      throw new Error("Token sudah kedaluwarsa.");

    const newHashedPassword = await hashPassword(newPassword);

    await this.userRepository.update(existingToken.userId, {
      password: newHashedPassword,
    });

    await this.authRepository.deletePasswordResetToken(existingToken.id);
    return { message: "Password berhasil direset. Silakan login." };
  }

  public async loginWithGoogle(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new Error("Token Google tidak valid");
    }

    const { email, name, sub: googleId } = payload;

    let user = await prisma.user.findFirst({
      where: { googleId },
    });

    if (!user) {
      user = await this.userRepository.findByEmail(email);
      if (user) {
        await this.userRepository.update(user.id, { googleId });
      } else {
        const randomPassword = await hashPassword(
          Math.random().toString(36).slice(-8)
        );
        user = await this.userRepository.create({
          name: name || "User",
          email,
          googleId,
          password: randomPassword,
          role: UserRole.CUSTOMER,
          emailVerified: new Date(),
        });
      }
    }

    const token = generateToken({ userId: user.id, role: user.role });
    const { password: _, ...userToReturn } = user;
    return { token, user: userToReturn };
  }
}

export { AuthService };
