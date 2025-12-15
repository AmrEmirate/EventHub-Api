// Dashboard related types
export interface DashboardQueryParams {
  month?: number;
  year?: number;
}

export interface DashboardStats {
  revenue: number;
  ticketsSold: number;
  totalEvents: number;
}

export interface DashboardAnalytics {
  revenuePerDay: Array<{
    date: string;
    total: number;
  }>;
  ticketsPerEvent: Array<{
    eventName: string;
    sold: number;
  }>;
}

export interface DashboardData {
  stats: DashboardStats;
  analytics: DashboardAnalytics;
}
