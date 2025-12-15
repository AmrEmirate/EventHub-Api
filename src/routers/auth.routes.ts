import { Router, Request, Response } from "express";
import { AuthController } from "../controllers/auth.controller";
import passport from "../config/passport";
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateGoogleLogin,
} from "../middleware/validators/auth.validator";

class AuthRouter {
  public router: Router;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * tags:
     *   name: Auth
     *   description: Endpoint untuk autentikasi, registrasi, dan manajemen akun
     */

    /**
     * @swagger
     * /api/v1/auth/register:
     *   post:
     *     summary: Mendaftarkan pengguna baru
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - name
     *               - password
     *               - role
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               name:
     *                 type: string
     *               password:
     *                 type: string
     *                 format: password
     *               role:
     *                 type: string
     *                 enum: [CUSTOMER, ORGANIZER]
     *     responses:
     *       201:
     *         description: Registrasi berhasil, silakan cek email untuk verifikasi.
     *       400:
     *         description: Input tidak valid atau email sudah terdaftar.
     */
    this.router.post(
      "/register",
      validateRegister,
      this.authController.register.bind(this.authController)
    );

    /**
     * @swagger
     * /api/v1/auth/login:
     *   post:
     *     summary: Login pengguna
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               password:
     *                 type: string
     *                 format: password
     *     responses:
     *       200:
     *         description: Login berhasil, mengembalikan token dan data user.
     *       401:
     *         description: Kredensial tidak valid.
     *       403:
     *         description: Email belum diverifikasi.
     */
    this.router.post(
      "/login",
      validateLogin,
      this.authController.login.bind(this.authController)
    );

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
    this.router.post(
      "/google-login",
      validateGoogleLogin,
      this.authController.googleLogin.bind(this.authController)
    );

    /**
     * @swagger
     * /api/v1/auth/verify-email:
     *   get:
     *     summary: Verifikasi alamat email pengguna
     *     tags: [Auth]
     *     parameters:
     *       - in: query
     *         name: token
     *         required: true
     *         schema:
     *           type: string
     *         description: Token verifikasi yang dikirim ke email
     *     responses:
     *       200:
     *         description: Email berhasil diverifikasi.
     *       400:
     *         description: Token tidak valid, tidak ditemukan, atau sudah kedaluwarsa.
     */
    this.router.get(
      "/verify-email",
      this.authController.verifyEmail.bind(this.authController)
    );

    /**
     * @swagger
     * /api/v1/auth/forgot-password:
     *   post:
     *     summary: Meminta link untuk reset password
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *     responses:
     *       200:
     *         description: Jika email terdaftar, link reset password akan dikirim.
     */
    this.router.post(
      "/forgot-password",
      validateForgotPassword,
      this.authController.forgotPassword.bind(this.authController)
    );

    /**
     * @swagger
     * /api/v1/auth/reset-password:
     *   post:
     *     summary: Mengatur password baru menggunakan token
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - token
     *               - newPassword
     *             properties:
     *               token:
     *                 type: string
     *                 description: Token yang didapat dari email reset password
     *               newPassword:
     *                 type: string
     *                 format: password
     *                 description: Password baru pengguna (minimal 6 karakter)
     *     responses:
     *       200:
     *         description: Password berhasil direset.
     *       400:
     *         description: Input tidak valid, atau token salah/kedaluwarsa.
     */
    this.router.post(
      "/reset-password",
      validateResetPassword,
      this.authController.resetPassword.bind(this.authController)
    );

    /**
     * @swagger
     * /api/v1/auth/google:
     *   get:
     *     summary: Redirect ke Google untuk login
     *     tags: [Auth]
     *     responses:
     *       302:
     *         description: Redirect ke halaman login Google
     */
    this.router.get(
      "/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    /**
     * @swagger
     * /api/v1/auth/google/callback:
     *   get:
     *     summary: Callback dari Google OAuth
     *     tags: [Auth]
     *     responses:
     *       302:
     *         description: Redirect ke frontend dengan token
     */
    this.router.get(
      "/google/callback",
      passport.authenticate("google", {
        session: false,
        failureRedirect: `${
          process.env.FE_URL || "http://localhost:3000"
        }/auth/login?error=google_auth_failed`,
      }),
      (req: Request, res: Response) => {
        const { user, token } = req.user as any;
        // Redirect ke frontend dengan token
        res.redirect(
          `${
            process.env.FE_URL || "http://localhost:3000"
          }/auth/callback?token=${token}`
        );
      }
    );
  }
}

export default new AuthRouter().router;
