import prisma from '../../config/prisma';
import { Event } from '@prisma/client';

type CreateEventInput = Omit<Event, 'id' | 'slug' | 'ticketSold' | 'createdAt' | 'updatedAt'>;

/**
 * Mendapatkan semua event dengan filter & pencarian
 */
export const getAllEvents = async (filters: { search?: string; location?: string; category?: string; }) => {
  const { search, location, category } = filters;
  return prisma.event.findMany({
    where: {
      AND: [
        search ? { name: { contains: search, mode: 'insensitive' } } : {},
        location ? { location: { equals: location, mode: 'insensitive' } } : {},
        category ? { category: { equals: category, mode: 'insensitive' } } : {},
      ],
      startDate: { gte: new Date() },
    },
    orderBy: { startDate: 'asc' },
  });
};

/**
 * Mendapatkan satu event berdasarkan slug-nya
 */
export const getEventBySlug = async (slug: string) => {
  return prisma.event.findUnique({ where: { slug } });
};

/**
 * Membuat event baru
 */
export const createEvent = async (data: CreateEventInput): Promise<Event> => {
  const slug = data.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  return prisma.event.create({
    data: { ...data, slug },
  });
};

/**
 * Memperbarui event
 */
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

/**
 * Menghapus event
 */
export const deleteEvent = async (eventId: string, userId: string) => {
  const event = await prisma.event.findFirst({ where: { id: eventId, organizerId: userId } });
  if (!event) {
    throw new Error('Event tidak ditemukan atau Anda tidak punya akses.');
  }
  return prisma.event.delete({ where: { id: eventId } });
};

/**
 * Mendapatkan daftar peserta untuk sebuah event
 */
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

/**
 * [BARU] Mendapatkan semua event yang dibuat oleh organizer tertentu
 */
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