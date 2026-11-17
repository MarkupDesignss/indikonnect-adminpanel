
import apiClient from "../../client";


export type DeliveryStatus =
  | "Confirmed"
  | "Dispatched"
  | "Shipped"
  | "Delivered";

export interface DeliveryReportItem {
  "Invoice Number": string | null;
  "Order Reference": string;
  "Item Name": string;
  SKU: string;
  QTY: number;
  "Delivery Status": DeliveryStatus | string;
  "Placed At": string | null;
  "Dispatched At": string | null;
  "Shipped At": string | null;
  "Delivered At": string | null;
  "Shipment Number": string | null;
  Carrier: string | null;
  "Recipient Name": string;
  "Recipient Phone": string;
  "Recipient Email": string;
}

export interface DeliveryReportFilters {
  allowed_statuses: string[];
  from_date: string | null;
  to_date: string | null;
}

export interface DeliveryReportPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface DeliveryReportResponse {
  status: boolean;
  message: string;
  filters: DeliveryReportFilters;
  pagination: DeliveryReportPagination;
  data: DeliveryReportItem[];
}

export interface DeliveryReportParams {
  page?: number;
  per_page?: number;
  from_date?: string;
  to_date?: string;
}


const deliveryReportApi = {
  getAll: async (
    params: DeliveryReportParams = {}
  ): Promise<DeliveryReportResponse> => {
    const response = await apiClient.get<DeliveryReportResponse>(
      "/delivery-report",
      {
        params: {
          page: params.page ?? 1,
          per_page: params.per_page ?? 500,
          ...(params.from_date
            ? { from_date: params.from_date }
            : {}),
          ...(params.to_date
            ? { to_date: params.to_date }
            : {}),
        },
      }
    );

    return response.data;
  },
};

export default deliveryReportApi;
