import prisma from '../../config/prisma';

export const getOrganizerStats = async (organizerId: string, month: number, year: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const totalRevenue = await prisma.transaction.aggregate({
    _sum: { finalPrice: true },
    where: {
      event: { organizerId },
      status: 'COMPLETED',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalTicketsSold = await prisma.transaction.aggregate({
    _sum: { quantity: true },
    where: {
      event: { organizerId },
      status: 'COMPLETED',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const eventCount = await prisma.event.count({
    where: { organizerId },
  });

  return {
    revenue: totalRevenue._sum.finalPrice || 0,
    ticketsSold: totalTicketsSold._sum.quantity || 0,
    totalEvents: eventCount,
  };
};

export const getOrganizerAnalytics = async (organizerId: string, month: number, year: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const revenuePerDay = await prisma.transaction.groupBy({
    by: ['createdAt'],
    where: {
      event: { organizerId },
      status: 'COMPLETED',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      finalPrice: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const formattedRevenue = revenuePerDay.map(item => ({
    date: item.createdAt.toISOString().split('T')[0],
    total: item._sum.finalPrice || 0,
  }));

  const ticketsPerEvent = await prisma.event.findMany({
    where: {
      organizerId: organizerId,
      transactions: {
        some: {
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
    select: {
      name: true,
      ticketSold: true,
    },
    orderBy: {
      ticketSold: 'desc',
    },
    take: 10,
  });
  
  const formattedTickets = ticketsPerEvent.map(event => ({
    eventName: event.name,
    sold: event.ticketSold,
  }));

  return {
    revenuePerDay: formattedRevenue,
    ticketsPerEvent: formattedTickets,
  };
};

export const getOrganizerDashboardData = async (organizerId: string, month: number, year: number) => {
  const stats = await getOrganizerStats(organizerId, month, year);
  const analytics = await getOrganizerAnalytics(organizerId, month, year);

  return {
    stats,
    analytics,
  };
};