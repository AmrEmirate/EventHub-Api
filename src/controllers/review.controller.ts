import { Request, Response } from "express";
import { ReviewService } from "../service/review.service";
import { z } from "zod";

const createReviewSchema = z.object({
  eventId: z.string().uuid({ message: "Event ID tidak valid" }),
  rating: z.preprocess((val) => Number(val), z.number().int().min(1).max(5)),
  comment: z.string().optional(),
});

class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  public async createReview(req: Request, res: Response) {
    try {
      const validatedData = createReviewSchema.parse(req.body);
      const userId = req.user!.id;

      // Ambil path gambar jika ada file yang diunggah
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

      const review = await this.reviewService.createReview(
        userId,
        validatedData.eventId,
        validatedData.rating,
        validatedData.comment,
        imageUrl // <-- Kirim path gambar ke service
      );

      res.status(201).json({ message: "Ulasan berhasil dibuat", data: review });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Input tidak valid",
          errors: error.flatten().fieldErrors,
        });
      }
      res.status(400).json({ message: error.message });
    }
  }
}

export { ReviewController };
