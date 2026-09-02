
import apiClient from "../client";

export interface StockUpdatePayload {
  product_id: number;
  operation: "add" | "subtract";
  stock_quantity: number;
}


export interface StockUpdateResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const stockApi = {
  updateStock: (data: StockUpdatePayload) =>
    apiClient.post<StockUpdateResponse>(
      "/stock/update/",
      data
    ),
};

