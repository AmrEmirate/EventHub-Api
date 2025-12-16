export interface CreateVoucherInput {
  eventId: string;
  code: string;
  discountPercent: number;
  maxDiscount?: number | null;
  expiresAt: Date;
}

export interface VoucherWithEvent {
  id: string;
  userId: string | null;
  eventId: string | null;
  code: string;
  discountPercent: number;
  maxDiscount: number | null;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  event: {
    name: string;
  } | null;
}
