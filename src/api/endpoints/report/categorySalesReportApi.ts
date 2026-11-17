
import apiClient from "../../client";

export interface WeeklyValues {
  [week: string]: number | null;
  total: number | null;
}

export interface CategoryReportRow {
  category_id: number;
  category: string;
  weekly: WeeklyValues;
  total: number;
}

export interface WeekRange {
  start_at: string;
  end_at: string;
  settled: boolean;
}

export interface CategorySalesReportData {
  year: number;
  anchor_week: number;
  weeks: number[];
  week_ranges: Record<string, WeekRange>;

  sales_by_category: CategoryReportRow[];
  total_sales: WeeklyValues;

  sales_return_by_category: CategoryReportRow[];
  total_sales_return: WeeklyValues;

  net_sales: WeeklyValues;
  gross_sales_retail: WeeklyValues;
  net_sales_ba_price: WeeklyValues;

  cv: WeeklyValues;
  cv_over_net: WeeklyValues;

  outstanding_by_category: CategoryReportRow[];
  total_outstanding: WeeklyValues;
  os_over_net: WeeklyValues;
}

export interface CategorySalesReportResponse {
  status: boolean;
  message: string;
  data: CategorySalesReportData;
}

export interface CategorySalesReportParams {
  year: number;
  week: number;
}

const categorySalesReportApi = {
  getAll: async (params: CategorySalesReportParams) => {
    const response = await apiClient.get<CategorySalesReportResponse>(
      "/admin/finance/sales-report/category",
      {
        params: {
          year: params.year,
          week: params.week,
        },
      }
    );

    return response.data;
  },
};

export default categorySalesReportApi;
