import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface ReviewImage {
  id: number;
  image_path: string;
}

export interface ProductImage {
  id: number;
  image: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ReviewUser {
  id: number;
  name: string;
  email: string;
}

export interface ReviewProduct {
  id: number;
  name: string;
  product_code: string;
  slug: string;
  product_images: ProductImage[];
}

export interface ProductReview {
  id: number;
  rating: number;
  review_text: string;
  status: string;
  images: ReviewImage[];
  user: ReviewUser;
  product: ReviewProduct;
  created_at: string | null;
}

export interface ProductReviewsResponse {
  success: boolean;
  message?: string;
  data: ProductReview[];
}

export type ReviewAction =
  | "approved"
  | "rejected"
  | "delete";

export interface ReviewActionPayload {
  action: ReviewAction;
}

export interface ReviewActionResponse {
  success: boolean;
  message?: string;
  data?: ProductReview | null;
}

// =====================================================
// API
// =====================================================

const productReviewsApi = {
  // ===================================================
  // GET ALL REVIEWS
  // Cache bust added so latest status always comes
  // ===================================================
  getAll: () =>
    apiClient.get<ProductReviewsResponse>(
      `/admin/product-reviews?_t=${Date.now()}`
    ),

  // ===================================================
  // APPROVE / REJECT / DELETE
  // ===================================================
  action: (
    id: number,
    payload: ReviewActionPayload
  ) =>
    apiClient.post<ReviewActionResponse>(
      `/admin/product-reviews/${id}/action`,
      payload
    ),
};

export default productReviewsApi;