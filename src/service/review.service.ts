import { ReviewRepository } from "../repositories/review.repository";
import { TransactionRepository } from "../repositories/transaction.repository";

class ReviewService {
  private reviewRepository: ReviewRepository;
  private transactionRepository: TransactionRepository;

  constructor() {
    this.reviewRepository = new ReviewRepository();
    this.transactionRepository = new TransactionRepository();
  }

  public async createReview(
    userId: string,
    eventId: string,
    rating: number,
    comment?: string,
    imageUrl?: string
  ) {
    const completedTransaction = await this.transactionRepository.findFirst({
      where: {
        userId,
        eventId,
        status: "COMPLETED",
      },
    });

    if (!completedTransaction) {
      throw new Error(
        "Anda hanya bisa mengulas event yang tiketnya sudah Anda beli."
      );
    }

    const existingReview = await this.reviewRepository.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existingReview) {
      throw new Error("Anda sudah pernah memberikan ulasan untuk event ini.");
    }

    return this.reviewRepository.create({
      userId,
      eventId,
      rating,
      comment,
      imageUrl,
    });
  }
}

export { ReviewService };
