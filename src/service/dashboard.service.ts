import { TransactionRepository } from "../repositories/transaction.repository";
import { EventRepository } from "../repositories/event.repository";

class DashboardService {
  private transactionRepository: TransactionRepository;
  private eventRepository: EventRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.eventRepository = new EventRepository();
  }

  public async getOrganizerStats(
    organizerId: string,
    month: number,
    year: number
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const totalRevenue = await this.transactionRepository.aggregateRevenue(
      organizerId,
      startDate,
      endDate
    );

    const totalTicketsSold =
      await this.transactionRepository.aggregateTicketsSold(
        organizerId,
        startDate,
        endDate
      );

    const eventCount = await this.eventRepository.countByOrganizer(organizerId);

    return {
      revenue: totalRevenue._sum.finalPrice || 0,
      ticketsSold: totalTicketsSold._sum.quantity || 0,
      totalEvents: eventCount,
    };
  }

  public async getOrganizerAnalytics(
    organizerId: string,
    month: number,
    year: number
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const revenuePerDay = await this.transactionRepository.groupRevenueByDay(
      organizerId,
      startDate,
      endDate
    );

    const formattedRevenue = revenuePerDay.map((item) => ({
      date: item.createdAt.toISOString().split("T")[0],
      total: item._sum.finalPrice || 0,
    }));

    const ticketsPerEvent = await this.eventRepository.findTopSellingEvents(
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
  }

  public async getOrganizerDashboardData(
    organizerId: string,
    month: number,
    year: number
  ) {
    const stats = await this.getOrganizerStats(organizerId, month, year);
    const analytics = await this.getOrganizerAnalytics(
      organizerId,
      month,
      year
    );

    return {
      stats,
      analytics,
    };
  }
}

export { DashboardService };
