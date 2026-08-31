import apiClient from "../client";

export interface Category {
  id: number;
  title: string;
  image: string;
  description: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  products_count: number;
  max_price: string | number;
  max_price_formatted: string;
  max_price_product: {
    id: number;
    name: string;
    product_code: string;
    retail_price: string;
    distributor_price: string;
  } | null;
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  data: Category[];
  most_expensive_price: string;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface CategoryAddUpdateResponse {
  success?: boolean;
  message?: string;
  data?: Category;
}

export interface DeleteCategoryResponse {
  success: boolean;
  message: string;
}

export const categoryApi = {
  // GET /api/categories
  getAll: () =>
    apiClient.get<CategoryResponse>(
      "/categories"
    ),

  // POST /api/categories/add
  add: (data: FormData) =>
    apiClient.post<CategoryAddUpdateResponse>(
      "/categories/add",
      data,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    ),

  // POST /api/categories/update/:id
  update: (
    id: number,
    data: FormData
  ) =>
    apiClient.post<CategoryAddUpdateResponse>(
      `/categories/update/${id}`,
      data,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    ),

  // DELETE /api/categories/delete/:id
  delete: (id: number) =>
    apiClient.delete<DeleteCategoryResponse>(
      `/categories/delete/${id}`
    ),
};