export interface RegisterInput {
  email: string;
  name: string;
  password: string;
  role: "CUSTOMER" | "ORGANIZER";
  phone?: string | null;
  referralCode?: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: Date | null;
    points: number;
    referralCode: string | null;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface GoogleLoginInput {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface AuthResponse {
  message: string;
}
