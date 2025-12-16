import { User } from "@prisma/client";

export type UserWithoutPassword = Omit<User, "password">;

declare global {
  namespace Express {
    interface Request {
      user?: UserWithoutPassword;
    }
  }
}

export {};
