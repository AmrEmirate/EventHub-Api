import { TransactionRepository } from "../repositories/transaction.repository";
import { EventRepository } from "../repositories/event.repository";

const transactionRepository = new TransactionRepository();
const eventRepository = new EventRepository();

export const getOrganizerStats = async (
  organizerId: string,
  month: number,
  year: number
) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const totalRevenue = await transactionRepository.aggregateRevenue(
    organizerId,
    startDate,
    endDate
  );

  const totalTicketsSold = await transactionRepository.aggregateTicketsSold(
    organizerId,
    startDate,
    endDate
  );

  const eventCount = await eventRepository.countByOrganizer(organizerId);

  return {
    revenue: totalRevenue._sum.finalPrice || 0,
    ticketsSold: totalTicketsSold._sum.quantity || 0,
    totalEvents: eventCount,
  };
};

export const getOrganizerAnalytics = async (
  organizerId: string,
  month: number,
  year: number
) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const revenuePerDay = await transactionRepository.groupRevenueByDay(
    organizerId,
    startDate,
    endDate
  );

  const formattedRevenue = revenuePerDay.map((item) => ({
    date: item.createdAt.toISOString().split("T")[0],
    total: item._sum.finalPrice || 0,
  }));

  const ticketsPerEvent = await eventRepository.findTopSellingEvents(
    organizerId,
    startDate,
    endDate,
    10
  );

  const formattedTickets = ticketsPerEvent.map((event) => ({
    eventName: event.name,
    sold: event.ticketSold,
  }));

  return {
    revenuePerDay: formattedRevenue,
    ticketsPerEvent: formattedTickets,
  };
};

export const getOrganizerDashboardData = async (
  organizerId: string,
  month: number,
  year: number
) => {
  const stats = await getOrganizerStats(organizerId, month, year);
  const analytics = await getOrganizerAnalytics(organizerId, month, year);

  return {
    stats,
    analytics,
  };
};
