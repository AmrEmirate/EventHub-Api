import { EventRepository } from "../repositories/event.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { Event } from "@prisma/client";

type CreateEventInput = Omit<
  Event,
  "id" | "slug" | "ticketSold" | "createdAt" | "updatedAt"
>;

class EventService {
  private eventRepository: EventRepository;
  private transactionRepository: TransactionRepository;

  constructor() {
    this.eventRepository = new EventRepository();
    this.transactionRepository = new TransactionRepository();
  }

  public async getAllEvents(filters: {
    search?: string;
    location?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { search, location, category, startDate, endDate } = filters;

    const whereClause: any = {};
    const andConditions = [];

    if (search) {
      andConditions.push({ name: { contains: search, mode: "insensitive" } });
    }
    if (location) {
      andConditions.push({
        location: { equals: location, mode: "insensitive" },
      });
    }
    if (category) {
      andConditions.push({
        category: { equals: category, mode: "insensitive" },
      });
    }

    if (startDate && endDate) {
      andConditions.push({
        startDate: { gte: new Date(startDate) },
        endDate: { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) },
      });
    } else if (startDate) {
      andConditions.push({ startDate: { gte: new Date(startDate) } });
    } else {
      andConditions.push({ startDate: { gte: new Date() } });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    return this.eventRepository.findMany({
      where: whereClause,
      orderBy: { startDate: "asc" },
    });
  }

  public async getEventById(id: string) {
    return this.eventRepository.findById(id);
  }

  public async getEventBySlug(slug: string) {
    return this.eventRepository.findBySlugWithReviews(slug);
  }

  public async createEvent(data: CreateEventInput): Promise<Event> {
    const slug =
      data.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    return this.eventRepository.create({
      ...data,
      slug,
    });
  }

  public async updateEvent(
    eventId: string,
    userId: string,
    data: Partial<Event>
  ) {
    const event = await this.eventRepository.findFirst({
      where: { id: eventId, organizerId: userId },
    });
    if (!event) {
      throw new Error("Event tidak ditemukan atau Anda tidak punya akses.");
    }
    return this.eventRepository.update(eventId, data);
  }

  public async deleteEvent(eventId: string, userId: string) {
    const event = await this.eventRepository.findFirst({
      where: { id: eventId, organizerId: userId },
    });

    if (!event) {
      throw new Error("Event tidak ditemukan atau Anda tidak punya akses.");
    }

    // Gunakan repository untuk handling delete dependencies
    return this.eventRepository.deleteWithDependencies(eventId);
  }

  public async getEventAttendees(organizerId: string, eventId: string) {
    const event = await this.eventRepository.findFirst({
      where: { id: eventId, organizerId },
    });
    if (!event)
      throw new Error("Event tidak ditemukan atau Anda tidak punya akses.");

    const transactions = await this.transactionRepository.findMany({
      where: { eventId, status: "COMPLETED" },
      select: {
        user: {
          select: { name: true, email: true },
        },
        quantity: true,
        createdAt: true,
      },
    });
    return transactions;
  }

  public async getMyOrganizerEvents(organizerId: string) {
    return this.eventRepository.findMany({
      where: {
        organizerId: organizerId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export { EventService };
