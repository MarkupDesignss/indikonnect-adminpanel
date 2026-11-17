
import apiClient from "../../client";

export interface WeeklyValues {
  [week: string]: number;
}

export interface CategorySalesRow {
  category_id: number;
  category: string;
  weekly: WeeklyValues;
  total: number;
}

export interface ProductSalesRow {
  product_id: number;
  product_name: string;
  weekly: WeeklyValues;
  total: number;
}

export interface WeeklyTotals {
  [week: string]: number;
  total: number;
}

export interface CategorySummary {
  rows: CategorySalesRow[];
  weekly_totals: WeeklyTotals;
}

export interface ProductSales {
  rows: ProductSalesRow[];
  weekly_totals: WeeklyTotals;
}

export interface ProductOrderCounts {
  rows: ProductSalesRow[];
  weekly_totals: WeeklyTotals;
}

export interface ProductSalesReportData {
  year: number;
  anchor_week: number;
  weeks: number[];
  category_summary: CategorySummary;
  product_sales: ProductSales;
  order_counts: ProductOrderCounts;
}

export interface ProductSalesReportResponse {
  status: boolean;
  message: string;
  data: ProductSalesReportData;
}

export interface ProductSalesReportParams {
  year?: number;
  week?: number;
}

/* ================= API ================= */

const productSalesReportApi = {
  getAll: async (
    params: ProductSalesReportParams = {}
  ): Promise<ProductSalesReportResponse> => {
    const response =
      await apiClient.get<ProductSalesReportResponse>(
        "/admin/finance/sales-report/products",
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

export default productSalesReportApi;
