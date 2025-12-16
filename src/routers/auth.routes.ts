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
    this.router.post(
      "/register",
      validateRegister,
      this.authController.register.bind(this.authController)
    );

    this.router.post(
      "/login",
      validateLogin,
      this.authController.login.bind(this.authController)
    );

    this.router.post(
      "/google-login",
      validateGoogleLogin,
      this.authController.googleLogin.bind(this.authController)
    );

    this.router.get(
      "/verify-email",
      this.authController.verifyEmail.bind(this.authController)
    );

    this.router.post(
      "/forgot-password",
      validateForgotPassword,
      this.authController.forgotPassword.bind(this.authController)
    );

    this.router.post(
      "/reset-password",
      validateResetPassword,
      this.authController.resetPassword.bind(this.authController)
    );

    this.router.get(
      "/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    this.router.get(
      "/google/callback",
      passport.authenticate("google", {
        session: false,
        failureRedirect: `${process.env.FE_URL}/auth/login?error=google_auth_failed`,
      }),
      (req: Request, res: Response) => {
        const { token } = req.user as any;
        res.redirect(`${process.env.FE_URL}/auth/callback?token=${token}`);
      }
    );
  }
}

export default new AuthRouter().router;
