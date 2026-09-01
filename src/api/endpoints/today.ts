import apiClient from "../client";

export interface TrendingProductPayload {
  is_trending: number;
}

export interface TrendingProductResponse {
  success: boolean;
  message?: string;
  data?: any;
}


export const trendingProductsApi = {
 
  updateTrendingStatus: (
    productId: number,
    payload: TrendingProductPayload
  ) =>
    apiClient.post<TrendingProductResponse>(
      `/trending-products/${productId}`,
      payload
    ),
};

export default trendingProductsApi;