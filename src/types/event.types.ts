export interface CreateEventInput {
  name: string;
  description: string;
  category: string;
  location: string;
  startDate: Date;
  endDate: Date;
  isFree: boolean;
  ticketTotal: number;
  price: number;
  organizerId: string;
  imageUrl?: string | null;
}

export interface UpdateEventInput {
  name?: string;
  description?: string;
  category?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  isFree?: boolean;
  ticketTotal?: number;
  price?: number;
  imageUrl?: string | null;
}

export interface EventFilters {
  search?: string;
  location?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface EventWithReviews {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  location: string;
  startDate: Date;
  endDate: Date;
  isFree: boolean;
  price: number;
  ticketTotal: number;
  ticketSold: number;
  imageUrl: string | null;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    imageUrl: string | null;
    createdAt: Date;
    user: {
      name: string;
      profile: {
        avatarUrl: string | null;
      } | null;
    };
  }>;
}
