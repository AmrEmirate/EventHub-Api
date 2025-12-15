import { User } from "@prisma/client";

// Extended user type without password
export type UserWithoutPassword = Omit<User, "password">;

declare global {
  namespace Express {
    interface Request {
      user?: UserWithoutPassword;
    }
  }
}

export {};
