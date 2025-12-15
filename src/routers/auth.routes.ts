import { Router } from "express";
import {
  registerController,
  loginController,
  verifyEmailController,
  forgotPasswordController,
  resetPasswordController,
  googleLoginController,
} from "../controllers/auth.controller";

const router = Router();

/**
 * @swagger
 * tags:
 * name: Auth
 * description: Endpoint untuk autentikasi, registrasi, dan manajemen akun
 */

/**
 * @swagger
 * /api/v1/auth/register:
 * post:
 * summary: Mendaftarkan pengguna baru
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - name
 * - password
 * - role
 * properties:
 * email:
 * type: string
 * format: email
 * name:
 * type: string
 * password:
 * type: string
 * format: password
 * role:
 * type: string
 * enum: [CUSTOMER, ORGANIZER]
 * responses:
 * 200:
 * description: Registrasi berhasil, silakan cek email untuk verifikasi.
 * 400:
 * description: Input tidak valid atau email sudah terdaftar.
 */
router.post("/register", registerController);

/**
 * @swagger
 * /api/v1/auth/login:
 * post:
 * summary: Login pengguna
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * password:
 * type: string
 * format: password
 * responses:
 * 200:
 * description: Login berhasil, mengembalikan token dan data user.
 * 401:
 * description: Kredensial tidak valid.
 * 403:
 * description: Email belum diverifikasi.
 */
router.post("/login", loginController);

/**
 * @swagger
 * /api/v1/auth/google-login:
 *   post:
 *     summary: Login menggunakan Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: ID Token dari Google
 *     responses:
 *       200:
 *         description: Login berhasil
 *       401:
 *         description: Token tidak valid
 */
router.post("/google-login", googleLoginController);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 * get:
 * summary: Verifikasi alamat email pengguna
 * tags: [Auth]
 * parameters:
 * - in: query
 * name: token
 * required: true
 * schema:
 * type: string
 * description: Token verifikasi yang dikirim ke email
 * responses:
 * 200:
 * description: Email berhasil diverifikasi.
 * 400:
 * description: Token tidak valid, tidak ditemukan, atau sudah kedaluwarsa.
 */
router.get("/verify-email", verifyEmailController);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 * post:
 * summary: Meminta link untuk reset password
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * properties:
 * email:
 * type: string
 * format: email
 * responses:
 * 200:
 * description: Jika email terdaftar, link reset password akan dikirim.
 */
router.post("/forgot-password", forgotPasswordController);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 * post:
 * summary: Mengatur password baru menggunakan token
 * tags: [Auth]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - token
 * - newPassword
 * properties:
 * token:
 * type: string
 * description: Token yang didapat dari email reset password
 * newPassword:
 * type: string
 * format: password
 * description: Password baru pengguna (minimal 6 karakter)
 * responses:
 * 200:
 * description: Password berhasil direset.
 * 400:
 * description: Input tidak valid, atau token salah/kedaluwarsa.
 */
router.post("/reset-password", resetPasswordController);

export default router;
