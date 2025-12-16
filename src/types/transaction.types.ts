import { TransactionStatus } from "@prisma/client";

export interface CreateTransactionInput {
  eventId: string;
  quantity: number;
  voucherCode?: string;
  usePoints?: boolean;
}

export interface TransactionWithDetails {
  id: string;
  userId: string;
  eventId: string;
  quantity: number;
  totalPrice: number;
  finalPrice: number;
  pointsUsed: number;
  status: TransactionStatus;
  paymentProofUrl: string | null;
  paymentDeadline: Date;
  snapToken: string | null;
  snapRedirectUrl: string | null;
  voucherId: string | null;
  createdAt: Date;
  updatedAt: Date;
  event: {
    id: string;
    name: string;
    slug: string;
    startDate: Date;
    endDate: Date;
  };
}

export interface TransactionForOrganizer {
  id: string;
  quantity: number;
  totalPrice: number;
  finalPrice: number;
  status: TransactionStatus;
  createdAt: Date;
  event: {
    name: string;
  };
  user: {
    name: string;
    email: string;
  };
}

export interface UploadPaymentProofInput {
  transactionId: string;
  file: Express.Multer.File;
}
