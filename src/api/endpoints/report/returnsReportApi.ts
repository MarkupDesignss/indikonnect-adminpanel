
import apiClient from "../../client";


export interface ReturnsReportFilters {
  from_date?: string;
  to_date?: string;
  return_status?: string;
  refund_status?: string;
  page?: number;
  per_page?: number;
}

export interface ReturnsReportItem {
  "Refund Bill Id": string | null;
  "Original Bill Id": string | null;
  "Refund Amount": string | number | null;
  Reason: string | null;
  "Refund Date": string | null;
  "Distributor Id": number | string | null;
  "Customer Name": string | null;
  "Contact Number": string | null;
  "Item Name": string | null;
  SKU: string | null;
  QTY: number | string | null;
  Email: string | null;
}

export interface ReturnsReportPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ReturnsReportResponse {
  status: boolean;
  message: string;
  filters: {
    from_date: string | null;
    to_date: string | null;
    return_status: string | null;
    refund_status: string | null;
  };
  pagination: ReturnsReportPagination;
  data: ReturnsReportItem[];
}


const returnsReportApi = {
  getAll: async (
    filters: ReturnsReportFilters = {},
    signal?: AbortSignal
  ): Promise<ReturnsReportResponse> => {
    const response = await apiClient.get<ReturnsReportResponse>(
      "/returns-article-report",
      {
        params: {
          page: filters.page ?? 1,
          per_page: filters.per_page ?? 500,
          ...(filters.from_date
            ? { from_date: filters.from_date }
            : {}),
          ...(filters.to_date
            ? { to_date: filters.to_date }
            : {}),
          ...(filters.return_status
            ? { return_status: filters.return_status }
            : {}),
          ...(filters.refund_status
            ? { refund_status: filters.refund_status }
            : {}),
        },
        signal,
      }
    );

    return response.data;
  },
};

export default returnsReportApi;
