import apiClient from "../client";

// =====================================================
// COMMISSION CALENDAR TYPES
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

export interface CommissionPeriod {
  type: string;
  label: string;
  start: string;
  end: string;
}

export interface CommissionBreakdownRow extends CommissionPeriod {
  gross_commission: number;
  tds_amount: number;
  net_commission: number;
}

export interface CommissionExportRow {
  ba_id: string;
  distributor_name: string;
  email: string;
  week?: number;
  year?: number;
  period_type?: string;
  breakdown?: CommissionBreakdownRow[];
  gross_commission: number;
  tds_section?: string;
  tds_rate_percent?: number;
  tds_amount: number;
  net_commission: number;
  gst_in?: string;
  pan_verified?: boolean;
  bank_holder_name: string;
  bank_ifsc: string;
  pan_number?: string;
  bank_account_number: string;
}

export interface CommissionCalendarResponse {
  success: boolean;
  message?: string;
  currency?: {
    base: string;
    display: string;
    exchange_rate: number;
  };
  calendar?: CommissionCalendar;
  period_type?: string;
  filters?: {
    week?: number;
    year?: number;
    from_date?: string;
    to_date?: string;
  };
  periods?: CommissionPeriod[];
  week_range?: {
    start: string;
    end: string;
  };
  summary?: {
    total_distributors: number;
    total_eligible: number;
    failed_count: number;
    total_gross?: number;
    total_tds?: number;
    total_net?: number;
  };
  data?: CommissionExportRow[];
  failed?: unknown[];
}

// =====================================================
// API
// =====================================================

const commissionApi = {
  /**
   * Fetch the Ignite sales / commission calendar and export data.
   *
   * Calendar example:
   * GET /admin/finance/commission-export?week=0&year=2026
   *
   * Date-range example:
   * GET /admin/finance/commission-export?week=0&year=2026&from_date=2026-10-01&to_date=2026-10-15
   *
   * When week and date range are both supplied, the API can return
   * the combined period response supported by the backend.
   */
  getCalendar: (
    week = 0,
    year = new Date().getFullYear(),
    fromDate?: string,
    toDate?: string,
  ) =>
    apiClient.get<CommissionCalendarResponse>(
      "/admin/finance/commission-export",
      {
        params: {
          week,
          year,
          ...(fromDate ? { from_date: fromDate } : {}),
          ...(toDate ? { to_date: toDate } : {}),
        },
      },
    ),
};

export default commissionApi;
