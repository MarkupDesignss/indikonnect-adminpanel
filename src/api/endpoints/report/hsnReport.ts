import apiClient from "../../client";

/* ================= TYPES ================= */

export interface HsnReportItem {
  item_name: string;
  hsn: string;
  uqc: string;
  total_quantity: number | string;
  total_value: number | string;
  rate: number | string;
  taxable_value: number | string;
  integrated_tax_amount: number | string;
  central_tax_amount: number | string;
  state_ut_tax_amount: number | string;
  cess_amount: number | string;
}

export interface HsnReportData {
  registered: HsnReportItem[];
  unregistered: HsnReportItem[];
}

export interface HsnReportMeta {
  from: string | null;
  to: string | null;
  statuses: string[];
  supplier_state: string | null;
}

export interface HsnReportResponse {
  success: boolean;
  message?: string;
  data: HsnReportData;
  meta: HsnReportMeta;
}

export interface HsnReportParams {
  from_date?: string;
  to_date?: string;
}

const hsnReportApi = {
  getAll: async (
    params: HsnReportParams = {},
  ): Promise<HsnReportResponse> => {
    const response = await apiClient.get<HsnReportResponse>(
      "/hsn-report",
      {
        params: {
          ...(params.from_date
            ? { from_date: params.from_date }
            : {}),
          ...(params.to_date
            ? { to_date: params.to_date }
            : {}),
        },
      },
    );

    return response.data;
  },
};

export default hsnReportApi;