import nodemailer from "nodemailer";

// Konfigurasi transporter yang mengambil data dari file .env
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.MAIL_PORT || "587"),
  secure: process.env.MAIL_PORT === "465", // true jika port 465, selain itu false
  auth: {
    user: process.env.MAIL_USER, // Ambil dari .env
    pass: process.env.MAIL_PASS, // Ambil dari .env
  },
});

// Base URL frontend dari environment
const getFrontendUrl = () => process.env.FE_URL || "http://localhost:3000";

/**
 * Mengirim email terkait status transaksi.
 */
export const sendTransactionStatusEmail = async (
  to: string,
  subject: string,
  text: string
) => {
  try {
    const info = await transporter.sendMail({
      from: '"EventHub Platform" <no-reply@eventhub.com>',
      to: to,
      subject: subject,
      html: `<b>${text}</b>`,
    });
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Preview URL (Transaction Status): %s",
        nodemailer.getTestMessageUrl(info)
      );
    }
  } catch (error) {
    console.error(`Gagal mengirim email status transaksi ke ${to}:`, error);
  }
};

/**
 * Mengirim email verifikasi akun kepada pengguna baru.
 */
export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${getFrontendUrl()}/auth/verify?token=${token}`;
  try {
    const info = await transporter.sendMail({
      from: '"EventHub Platform" <no-reply@eventhub.com>',
      to: email,
      subject: "Verifikasi Akun EventHub Anda",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verifikasi Akun Anda</h2>
          <p>Terima kasih telah mendaftar di EventHub!</p>
          <p>Klik tombol di bawah untuk memverifikasi email Anda:</p>
          <a href="${verificationLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Verifikasi Email Saya
          </a>
          <p style="color: #666; font-size: 14px;">Link ini akan kedaluwarsa dalam 24 jam.</p>
          <p style="color: #999; font-size: 12px;">Jika Anda tidak mendaftar di EventHub, abaikan email ini.</p>
        </div>
      `,
    });
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Preview URL (Verification): %s",
        nodemailer.getTestMessageUrl(info)
      );
    }
  } catch (error) {
    console.error(`Gagal mengirim email verifikasi ke ${email}:`, error);
    throw new Error("Gagal mengirim email verifikasi.");
  }
};

/**
 * Mengirim email berisi link untuk mereset password.
 */
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${getFrontendUrl()}/auth/reset-password?token=${token}`;
  try {
    const info = await transporter.sendMail({
      from: '"EventHub Platform" <no-reply@eventhub.com>',
      to: email,
      subject: "Reset Password Akun EventHub Anda",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset Password</h2>
          <p>Anda menerima email ini karena ada permintaan untuk mereset password akun Anda.</p>
          <p>Klik tombol di bawah ini untuk melanjutkan:</p>
          <a href="${resetLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">Link ini akan kedaluwarsa dalam 1 jam.</p>
          <p style="color: #999; font-size: 12px;">Jika Anda tidak merasa meminta ini, abaikan saja email ini.</p>
        </div>
      `,
    });
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Preview URL (Password Reset): %s",
        nodemailer.getTestMessageUrl(info)
      );
    }
  } catch (error) {
    console.error(`Gagal mengirim email reset password ke ${email}:`, error);
    throw new Error("Gagal mengirim email reset password.");
  }
};
