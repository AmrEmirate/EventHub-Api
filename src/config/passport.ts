import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import prisma from "./prisma";
import { generateToken } from "../utils/jwt.helper";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.CALLBACK_URL || "/api/v1/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: any, user?: any) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName || "User";
        const avatarUrl = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error("Email tidak tersedia dari Google"), null);
        }

        let user = await prisma.user.findFirst({
          where: {
            OR: [{ googleId: googleId }, { email: email }],
          },
          include: { profile: true },
        });

        if (user) {
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: googleId,
                emailVerified: user.emailVerified || new Date(),
              },
              include: { profile: true },
            });
          }
        } else {
          user = await prisma.user.create({
            data: {
              email: email,
              name: name,
              googleId: googleId,
              password: "",
              role: "CUSTOMER",
              emailVerified: new Date(),
              profile: {
                create: {
                  avatarUrl: avatarUrl || null,
                },
              },
            },
            include: { profile: true },
          });
        }

        const token = generateToken({ userId: user.id, role: user.role });

        return done(null, { user, token });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
