import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import prisma from "./prisma";
import { generateToken } from "../utils/jwt.helper";

// Configure Google OAuth Strategy
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

        // Check if user already exists
        let user = await prisma.user.findFirst({
          where: {
            OR: [{ googleId: googleId }, { email: email }],
          },
          include: { profile: true },
        });

        if (user) {
          // Update googleId if user exists but doesn't have googleId
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
          // Create new user with Google account
          user = await prisma.user.create({
            data: {
              email: email,
              name: name,
              googleId: googleId,
              password: "", // Empty password for social login users
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

        // Generate JWT token
        const token = generateToken({ userId: user.id, role: user.role });

        return done(null, { user, token });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
