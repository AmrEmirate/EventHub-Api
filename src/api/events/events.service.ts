import prisma from '../../config/prisma';
import { Event } from '@prisma/client';

type CreateEventInput = Omit<Event, 'id' | 'slug' | 'ticketSold' | 'createdAt' | 'updatedAt'>;

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
    andConditions.push({ name: { contains: search, mode: 'insensitive' } });
  }
  if (location) {
    andConditions.push({ location: { equals: location, mode: 'insensitive' } });
  }
  if (category) {
    andConditions.push({ category: { equals: category, mode: 'insensitive' } });
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

  return prisma.event.findMany({
    where: whereClause,
    orderBy: { startDate: 'asc' },
  });
};

export const getEventById = async (id: string) => {
  return prisma.event.findUnique({ where: { id } });
};

export const getEventBySlug = async (slug: string) => {
  return prisma.event.findUnique({ 
    where: { slug },
    include: {
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              profile: {
                select: {
                  avatarUrl: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    } 
  });
};

export const createEvent = async (data: CreateEventInput): Promise<Event> => {
  const slug = data.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  return prisma.event.create({
    data: { ...data, slug },
  });
};

export const updateEvent = async (eventId: string, userId: string, data: Partial<Event>) => {
  const event = await prisma.event.findFirst({ where: { id: eventId, organizerId: userId } });
  if (!event) {
    throw new Error('Event tidak ditemukan atau Anda tidak punya akses.');
  }
  return prisma.event.update({
    where: { id: eventId },
    data,
  });
};

export const deleteEvent = async (eventId: string, userId: string) => {
  const event = await prisma.event.findFirst({ where: { id: eventId, organizerId: userId } });
  if (!event) {
    throw new Error('Event tidak ditemukan atau Anda tidak punya akses.');
  }
  return prisma.event.delete({ where: { id: eventId } });
};

export const getEventAttendees = async (organizerId: string, eventId: string) => {
    const event = await prisma.event.findFirst({ where: { id: eventId, organizerId } });
    if (!event) throw new Error("Event tidak ditemukan atau Anda tidak punya akses.");

    const transactions = await prisma.transaction.findMany({
        where: { eventId, status: 'COMPLETED' },
        select: {
            user: {
                select: { name: true, email: true }
            },
            quantity: true,
            createdAt: true
        }
    });
    return transactions;
}

export const getMyOrganizerEvents = async (organizerId: string) => {
  return prisma.event.findMany({
    where: {
      organizerId: organizerId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};
