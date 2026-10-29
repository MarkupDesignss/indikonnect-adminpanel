import apiClient from "../client";

export type SalesReportPeriod = "yearly" | "monthly" | "six_months";

export interface SalesReportParams {
  period: SalesReportPeriod;
  from_date: string;
  to_date: string;
}

export interface SalesReportSummary {
  total_orders: number;
  total_items_sold: number;
  total_revenue: number;
  total_gst_collected: number;
  total_shipping_charge: number;
  total_coupon_discount: number;
  total_commissionable_volume: number;
  average_order_value: number;
}

export interface SalesChartItem {
  label: string;
  orders: number;
  revenue: number;
  gst: number;
  items: number;
}

export interface SalesTopProduct {
  product_id: number;
  name: string;
  product_code: string;
  slug: string;
  image: string;
  total_qty: number;
  total_revenue: number;
}

export interface SalesDeliveryStatus {
  delivery_status: string;
  line_count: number;
  total_qty: number;
  total_amount: number;
}

export interface SalesReturnStatus {
  return_status: string;
  line_count: number;
  total_qty: number;
  total_amount: number;
}

export interface SalesCancellationStatus {
  cancel_state: string;
  line_count: number;
  total_qty: number;
  total_amount: number;
}

export interface SalesTopDistributor {
  user_id: number;
  name: string;
  email: string;
  total_orders: number;
  total_revenue: number;
}

export interface SalesPaymentBreakdown {
  payment_gateway: string;
  count: number;
  amount: number;
}

export interface SalesReportData {
  period: string;
  from_date: string;
  to_date: string;
  summary: SalesReportSummary;
  chart: SalesChartItem[];
  top_products: SalesTopProduct[];
  order_status_breakdown: {
    by_delivery_status: SalesDeliveryStatus[];
    by_return_status: SalesReturnStatus[];
    by_cancellation: SalesCancellationStatus[];
  };
  top_distributors: SalesTopDistributor[];
  payment_breakdown: SalesPaymentBreakdown[];
  return_refund_summary: {
    total_return_requests: number;
    approved_returns: number;
    total_refund_amount: number;
    total_cv_reversed: number;
  };
}

export interface SalesReportResponse {
  status: boolean;
  message: string;
  data: SalesReportData;
}

export const salesReportApi = {

  getSalesReport: (params: SalesReportParams) =>
    apiClient.get<SalesReportResponse>("/reports/sales", {
      params: {
        period: params.period,
        from_date: params.from_date,
        to_date: params.to_date,
      },
    }),
};

export default salesReportApi;