import apiClient from "../client";

export interface TaxCategory {
  id: number;
  name: string;
  rate: number;
  rate_formatted: string;
  created_at: string;
  updated_at: string;
}

export interface TaxCategoryPagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

export interface TaxCategoryResponse {
  data: TaxCategory[];
  pagination: TaxCategoryPagination;
}

export interface TaxCategoryPayload {
  name: string;
  rate: string | number;
}

export interface TaxCategoryAddUpdateResponse {
  success?: boolean;
  message?: string;
  data?: TaxCategory;
}

export const taxApi = {
  // GET /api/tax-categories
  getAll: () =>
    apiClient.get<TaxCategoryResponse>(
      "/tax-categories"
    ),

  // POST /api/tax-categories
  add: (data: TaxCategoryPayload) =>
    apiClient.post<TaxCategoryAddUpdateResponse>(
      "/tax-categories",
      data
    ),

  // POST /api/tax-categories/update/:id
  update: (
    id: number,
    data: TaxCategoryPayload
  ) =>
    apiClient.post<TaxCategoryAddUpdateResponse>(
      `/tax-categories/update/${id}`,
      data
    ),
};