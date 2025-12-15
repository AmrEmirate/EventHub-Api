import { ReviewRepository } from "../repositories/review.repository";
import { TransactionRepository } from "../repositories/transaction.repository";

const reviewRepository = new ReviewRepository();
const transactionRepository = new TransactionRepository();

export const createReview = async (
  userId: string,
  eventId: string,
  rating: number,
  comment?: string,
  imageUrl?: string
) => {
  const completedTransaction = await transactionRepository.findFirst({
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

  const existingReview = await reviewRepository.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  if (existingReview) {
    throw new Error("Anda sudah pernah memberikan ulasan untuk event ini.");
  }

  return reviewRepository.create({
    userId,
    eventId,
    rating,
    comment,
    imageUrl, // <-- Simpan path gambar
  });
};
