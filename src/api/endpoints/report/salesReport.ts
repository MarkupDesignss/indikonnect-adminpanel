
import apiClient from "../../client";


export interface SalesReportItem {
  "Bill Id": string;
  "Order Date": string | null;
  "Customer Name": string;
  "Customer Mobile": string;
  "Gross Total": number;
  "Order Amount": number;
  "Refunded Amount": number;
  "Net Order Amount": number;
  "Order Status": string;
  "Total Items": number;
  "Total Tax": number;
  CGST: number;
  SGST: number;
  IGST: number;
  "Total List Price": number;
  "Discount Amount": number;
  CV: number;
  "User Name": string;
  "Customer GSTIN": string;
  "Shipping Date": string | null;
  "Customer Shipping State": string;
  "Shipping Charge": number;
  "Delivery Status": string;
  "Is Refunded": string;
  "Refund Status": string;
  "Refunded Items": number;
  "Last Refund Date": string | null;
}

export interface SalesReportMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface SalesReportResponse {
  success: boolean;
  data: SalesReportItem[];
  meta: SalesReportMeta;
}

export interface SalesReportParams {
  page?: number;
  per_page?: number;
}

/* ================= API ================= */

const salesReportApi = {
  getAll: async (
    params: SalesReportParams = {}
  ): Promise<SalesReportResponse> => {
    const response = await apiClient.get<SalesReportResponse>(
      "/sales-report",
      {
        params: {
          page: params.page ?? 1,
          per_page: params.per_page ?? 100,
        },
      }
    );

    return response.data;
  },
};

export default salesReportApi;
