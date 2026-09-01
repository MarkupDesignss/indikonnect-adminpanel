import apiClient from "../client";

export interface DashboardSummary {
  total_revenue: string;
  total_orders: number;
  total_customers: number;
  total_distributors: number;
  total_products: number;
}

export interface SalesSummary {
  revenue: string | number;
  orders: number;
  start_date: string;
  end_date: string;
}

export interface DailyBreakdown {
  date: string;
  day: string;
  revenue: string | number;
  orders: number;
}

export interface WeeklyBreakdown {
  week_number: number;
  start_date: string;
  end_date: string;
  revenue: string | number;
  orders: number;
}

export interface SalesPeriod {
  summary: SalesSummary;
  daily_breakdown?: DailyBreakdown[];
  weekly_breakdown?: WeeklyBreakdown[];
}

export interface PercentageChange {
  week_over_week: number;
  month_over_month: number;
}

export interface SalesAnalysis {
  this_week: SalesPeriod;
  last_week: SalesPeriod;
  this_month: SalesPeriod;
  percentage_change: PercentageChange;
}

export interface TopCategory {
  id: number;
  name: string;
  slug: string;
  product_count: number;
  max_price: number;
}

export interface PendingKycReview {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  account_type: string;
  title: string | null;
  type_of_entity: string | null;
  bank_name: string | null;
  kyc_status: string;
  submitted_at: string | null;
  created_at: string;
}

export interface StockSummary {
  low_stock_count: number;
  out_of_stock_count: number;
  in_stock_count: number;
  total_products: number;
}

export interface StockStatus {
  summary: StockSummary;
  low_stock_products: unknown[];
  out_of_stock_products: unknown[];
}

export interface TopContact {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface DashboardData extends DashboardSummary {
  sales_analysis: SalesAnalysis;
  top_categories: TopCategory[];
  pending_kyc_reviews: PendingKycReview[];
  stock_status: StockStatus;
  top_contacts: TopContact[];
}

export interface DashboardResponse {
  success: boolean;
  message?: string;
  data: DashboardData;
}

const adminDashboardApi = {

  getDashboard: () =>
    apiClient.get<DashboardResponse>(
      `/admin/dashboard?_t=${Date.now()}`
    ),
};

export default adminDashboardApi;