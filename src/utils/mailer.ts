import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || "587"),
  secure: process.env.MAIL_PORT === "465",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const getFrontendUrl = () => {
  if (!process.env.FE_URL) {
    throw new Error("FE_URL environment variable is required");
  }
  return process.env.FE_URL;
};

export const sendTransactionStatusEmail = async (
  to: string,
  subject: string,
  text: string
) => {
  try {
    await transporter.sendMail({
      from: '"EventHub Platform" <no-reply@eventhub.com>',
      to: to,
      subject: subject,
      html: `<b>${text}</b>`,
    });
  } catch (error) {
    throw new Error("Gagal mengirim email status transaksi");
  }
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${getFrontendUrl()}/auth/verify?token=${token}`;
  try {
    await transporter.sendMail({
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
  } catch (error) {
    throw new Error("Gagal mengirim email verifikasi.");
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${getFrontendUrl()}/auth/reset-password?token=${token}`;
  try {
    await transporter.sendMail({
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
  } catch (error) {
    throw new Error("Gagal mengirim email reset password.");
  }
};
