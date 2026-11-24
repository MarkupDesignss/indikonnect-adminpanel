import apiClient from "../../client";

/* ================= TYPES ================= */

export interface StatewiseReportItem {
  customer_state: string | null;
  tax_percentage: number | string;
  product_head: string | null;
  total_quantity: number | string;
  taxable_value: number | string;
  shipping_without_gst: number | string;
  cgst: number | string;
  sgst: number | string;
  igst: number | string;
  sum_list_price: number | string;
  sum_shipping_charges: number | string;
}

export interface StatewiseReportGrandTotal {
  total_quantity: number | string;
  taxable_value: number | string;
  shipping_without_gst: number | string;
  cgst: number | string;
  sgst: number | string;
  igst: number | string;
  sum_list_price: number | string;
  sum_shipping_charges: number | string;
}

export interface StatewiseReportMeta {
  from: string | null;
  to: string | null;
  statuses: string[];
  supplier_state: string | null;
  registration_type: "all" | "registered" | "unregistered" | string;
}

export interface StatewiseReportResponse {
  success: boolean;
  message?: string;
  data: StatewiseReportItem[];
  grand_total: StatewiseReportGrandTotal;
  meta: StatewiseReportMeta;
}

export interface StatewiseReportParams {
  from_date?: string;
  to_date?: string;
  registration_type?: "all" | "registered" | "unregistered";
}

/* ================= API ================= */

const statewiseReportApi = {
  getAll: async (
    params: StatewiseReportParams = {},
  ): Promise<StatewiseReportResponse> => {
    const response = await apiClient.get<StatewiseReportResponse>(
      "/statewise-report",
      {
        params: {
          ...(params.from_date
            ? { from_date: params.from_date }
            : {}),
          ...(params.to_date
            ? { to_date: params.to_date }
            : {}),
          ...(params.registration_type
            ? { registration_type: params.registration_type }
            : {}),
        },
      },
    );

    return response.data;
  },
};

export default statewiseReportApi;