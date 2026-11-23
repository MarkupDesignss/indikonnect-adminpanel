import apiClient from "../../client";

/* ================= TYPES ================= */

export interface FinanceReportProduct {
  name: string;
  slug: string;
  hsn_code: string | null;
  product_code: string | null;
  quantity: number;
  unit_price_without_gst: number;
  line_total_without_gst: number;
  tax_rate: number;
  gst_amount: number;
  shipping_charge_without_gst: number;
  shipping_gst: number;
}

export interface FinanceReportTaxBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
}

export interface FinanceReportCourier {
  courier_company: string | null;
  courier_tracking_number: string | null;
}

export interface FinanceReportItem {
  invoice_number: string | null;
  invoice_date: string | null;
  customer_name: string | null;
  account_type: string | null;
  customer_mobile: string | null;
  customer_email: string | null;
  customer_gstin: string | null;
  billing_state: string | null;
  delivery_state: string | null;
  product_names: string | null;
  products: FinanceReportProduct[];
  product_subtotal: number;
  shipping_charge_without_gst: number;
  subtotal: number;
  product_gst: number;
  shipping_gst: number;
  total_gst: number;
  tax_breakdown: FinanceReportTaxBreakdown;
  order_amount: number;
  discount_amount: number;
  net_order_amount: number;
  order_status: string | null;
  delivery_status: string | null;
  total_items: number;
  cv: number;
  user_name: string | null;
  order_date: string | null;
  confirmed_at: string | null;
  dispatched_at: string | null;
  shipping_date: string | null;
  delivered_at: string | null;
  refunded_at: string | null;
  last_refund_date: string | null;
  payment_gateway: string | null;
  gateway_transaction_id: string | null;
  courier_company: string | null;
  courier_tracking_number: string | null;
  courier_delivery_date: string | null;
  line_couriers: FinanceReportCourier[];
  is_refunded: string | boolean | null;
  refund_status: string | null;
  refunded_items: number;
}

export interface FinanceReportMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface FinanceReportResponse {
  success: boolean;
  message?: string;
  data: FinanceReportItem[];
  meta: FinanceReportMeta;
}

export interface FinanceReportParams {
  page?: number;
  per_page?: number;
  from_date?: string;
  to_date?: string;
}

const financeReportApi = {
  getAll: async (
    params: FinanceReportParams = {}
  ): Promise<FinanceReportResponse> => {
    const response = await apiClient.get<FinanceReportResponse>(
      "/finance-report",
      {
        params: {
          page: params.page ?? 1,
          per_page: params.per_page ?? 100,
          ...(params.from_date ? { from_date: params.from_date } : {}),
          ...(params.to_date ? { to_date: params.to_date } : {}),
        },
      }
    );

    return response.data;
  },
};

export default financeReportApi;
