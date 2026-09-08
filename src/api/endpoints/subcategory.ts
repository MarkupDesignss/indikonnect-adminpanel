import apiClient from "../client";

// =====================================================
// CATEGORY
// =====================================================

export interface SubcategoryCategory {
  id: number;
  title: string;
  slug: string;
  description: string;
  image: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// =====================================================
// SUBCATEGORY
// =====================================================

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  image: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  image_url: string;
  category: SubcategoryCategory | null;
}

// =====================================================
// PAGINATION
// =====================================================

export interface PaginationLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export interface SubcategoryPagination {
  current_page: number;
  data: Subcategory[];

  first_page_url: string;
  from: number | null;

  last_page: number;
  last_page_url: string;

  links: PaginationLink[];

  next_page_url: string | null;

  path: string;

  per_page: number;

  prev_page_url: string | null;

  to: number | null;

  total: number;
}

// =====================================================
// GET RESPONSE
// =====================================================

export interface SubcategoryResponse {
  success: boolean;
  data: SubcategoryPagination;
  message: string;
}

// =====================================================
// ADD / UPDATE RESPONSE
// =====================================================

export interface SubcategoryAddUpdateResponse {
  success?: boolean;
  message?: string;
  data?: Subcategory;
}

// =====================================================
// API
// =====================================================

export const subcategoryApi = {
  // GET /api/subcategories
  getAll: () =>
    apiClient.get<SubcategoryResponse>(
      "/subcategories"
    ),

  // POST /api/subcategories
  add: (data: FormData) =>
    apiClient.post<SubcategoryAddUpdateResponse>(
      "/subcategories",
      data,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    ),

  // POST /api/subcategories/:id
  update: (
    id: number,
    data: FormData
  ) =>
    apiClient.post<SubcategoryAddUpdateResponse>(
      `/subcategories/${id}`,
      data,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    ),
};