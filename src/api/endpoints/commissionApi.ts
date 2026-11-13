import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface CommissionCalendarWeek {
  year: number;
  week_no: number;
  week_in_month: number;
  start_date: string;
  end_date: string;
  start_at: string;
  end_at: string;
  is_current: boolean;
  is_settled: boolean;
}

export interface CommissionCalendarMonth {
  year: number;
  month_no: number;
  label: string;
  week_count: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  weeks: CommissionCalendarWeek[];
}

export interface CommissionCalendar {
  year: number;
  months: CommissionCalendarMonth[];
}

export interface CommissionCalendarResponse {
  success: boolean;
  message?: string;
  calendar: CommissionCalendar;
}

// =====================================================
// API
// =====================================================

const commissionApi = {
  /**
   * Fetch the Ignite sales / commission calendar.
   *
   * Example:
   * GET /admin/finance/commission-export?week=0&year=2026
   */
  getCalendar: (week = 0, year = new Date().getFullYear()) =>
    apiClient.get<CommissionCalendarResponse>(
      "/admin/finance/commission-export",
      {
        params: {
          week,
          year,
        },
      }
    ),
};

export default commissionApi;
