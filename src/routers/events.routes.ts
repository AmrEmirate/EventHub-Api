import { Router } from "express";
import { EventController } from "../controllers/events.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

class EventRouter {
  public router: Router;
  private eventController: EventController;

  constructor() {
    this.router = Router();
    this.eventController = new EventController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Rute Publik
    this.router.get(
      "/",
      this.eventController.getAllEvents.bind(this.eventController)
    );

    // Rute Terproteksi
    this.router.get(
      "/organizer/my-events",
      authMiddleware,
      this.eventController.getMyOrganizerEvents.bind(this.eventController)
    );

    // Rute baru untuk mengambil event berdasarkan ID (untuk halaman edit)
    // Tempatkan sebelum rute slug agar tidak terjadi konflik
    this.router.get(
      "/id/:id",
      authMiddleware,
      this.eventController.getEventById.bind(this.eventController)
    );

    // Rute dinamis untuk slug (untuk halaman detail publik)
    this.router.get(
      "/:slug",
      this.eventController.getEventBySlug.bind(this.eventController)
    );

    this.router.post(
      "/",
      authMiddleware,
      upload.single("imageUrl"),
      this.eventController.createEvent.bind(this.eventController)
    );
    this.router.put(
      "/:id",
      authMiddleware,
      upload.single("imageUrl"),
      this.eventController.updateEvent.bind(this.eventController)
    );
    this.router.delete(
      "/:id",
      authMiddleware,
      this.eventController.deleteEvent.bind(this.eventController)
    );
    this.router.get(
      "/:id/attendees",
      authMiddleware,
      this.eventController.getEventAttendees.bind(this.eventController)
    );
  }
}

export default new EventRouter().router;
