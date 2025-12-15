// Review related types
export interface CreateReviewInput {
  eventId: string;
  rating: number;
  comment?: string;
  imageUrl?: string;
}

export interface ReviewWithUser {
  id: string;
  userId: string;
  eventId: string;
  rating: number;
  comment: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string;
    profile: {
      avatarUrl: string | null;
    } | null;
  };
}
