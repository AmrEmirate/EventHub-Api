import { EventRepository } from "../repositories/event.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { Event } from "@prisma/client";

const eventRepository = new EventRepository();
const transactionRepository = new TransactionRepository();

type CreateEventInput = Omit<
  Event,
  "id" | "slug" | "ticketSold" | "createdAt" | "updatedAt"
>;

export const getAllEvents = async (filters: {
  search?: string;
  location?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { search, location, category, startDate, endDate } = filters;

  const whereClause: any = {};
  const andConditions = [];

  if (search) {
    andConditions.push({ name: { contains: search, mode: "insensitive" } });
  }
  if (location) {
    andConditions.push({ location: { equals: location, mode: "insensitive" } });
  }
  if (category) {
    andConditions.push({ category: { equals: category, mode: "insensitive" } });
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

  return eventRepository.findMany({
    where: whereClause,
    orderBy: { startDate: "asc" },
  });
};

export const getEventById = async (id: string) => {
  return eventRepository.findById(id);
};

export const getEventBySlug = async (slug: string) => {
  return eventRepository.findBySlugWithReviews(slug);
};

export const createEvent = async (data: CreateEventInput): Promise<Event> => {
  const slug = data.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
  return eventRepository.create({
    ...data,
    slug,
  });
};

export const updateEvent = async (
  eventId: string,
  userId: string,
  data: Partial<Event>
) => {
  const event = await eventRepository.findFirst({
    where: { id: eventId, organizerId: userId },
  });
  if (!event) {
    throw new Error("Event tidak ditemukan atau Anda tidak punya akses.");
  }
  return eventRepository.update(eventId, data);
};

export const deleteEvent = async (eventId: string, userId: string) => {
  const event = await eventRepository.findFirst({
    where: { id: eventId, organizerId: userId },
  });

  if (!event) {
    throw new Error("Event tidak ditemukan atau Anda tidak punya akses.");
  }

  // Gunakan repository untuk handling delete dependencies
  return eventRepository.deleteWithDependencies(eventId);
};

export const getEventAttendees = async (
  organizerId: string,
  eventId: string
) => {
  const event = await eventRepository.findFirst({
    where: { id: eventId, organizerId },
  });
  if (!event)
    throw new Error("Event tidak ditemukan atau Anda tidak punya akses.");

  const transactions = await transactionRepository.findMany({
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
};

export const getMyOrganizerEvents = async (organizerId: string) => {
  return eventRepository.findMany({
    where: {
      organizerId: organizerId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
