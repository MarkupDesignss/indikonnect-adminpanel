import apiClient from "../client";

export type DiscountType = "percentage" | "fixed";
export type ProductStatus = "active" | "inactive" | "draft";
export type StockStatus = "active" | "inactive" | "out_of_stock";

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

export interface TaxCategory {
  id: number;
  name: string;
  rate: string | number;
  rate_formatted?: string;
}

export interface ProductImage {
  id: number;
  image: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductImagePayload {
  image: File;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id?: number;
  sku: string;
  attributes: Record<string, string>;

  retail_mrp: number | string;
  retail_discount_type: DiscountType;
  retail_discount_value: number | string;

  distributor_mrp: number | string;
  distributor_discount_type: DiscountType;
  distributor_discount_value: number | string;

  stock_quantity: number;
  low_stock_threshold: number;

  sort_order: number;
  is_active: boolean;

  images?: ProductImage[];
}

export interface ReviewsSummary {
  average_rating: number;
  total_reviews: number;
  recent_reviews: any[];
}

export interface Product {
  id: number;

  product_code: string;
  name: string;
  slug: string;

  description: string;
  specification: string;

  category_id: number;
  category: Category;

  tax_category_id: number;
  tax_category: TaxCategory;

  // Retail
  retail_mrp: string | number;
  retail_price: string | number;

  retail_discount_type: DiscountType;
  retail_discount_value: string | number;
  retail_discount_amount: number;
  retail_discount_percentage: number;

  // Distributor
  distributor_mrp: string | number;
  distributor_price: string | number;

  distributor_discount_type: DiscountType;
  distributor_discount_value: string | number;
  distributor_discount_amount: number;
  distributor_discount_percentage: number;

  // Stock
  stock_quantity: number;
  low_stock_threshold: number;

  // Product flags
  is_published: boolean;
  is_trending: boolean;
  trending_sort_order: number;

  // Deal
  is_deal_of_the_day: boolean;
  is_active_deal: boolean;

  deal_of_the_day_starts_at: string | null;
  deal_of_the_day_ends_at: string | null;

  // Status
  stock_status: StockStatus;
  status: ProductStatus;

  // Wishlist
  is_wishlisted: boolean;

  // Images
  images: ProductImage[];
  primary_image: string;
  primary_image_url: string;

  // Variants
  variants?: ProductVariant[];

  // Reviews
  reviews_summary: ReviewsSummary;

  created_at: string;
  updated_at: string;
}

export interface SelectOption {
  id: number;
  name: string;
}

export interface ProductVariantPayload {
  sku: string;
  attributes: Record<string, string>;

  retail_mrp: number;
  retail_discount_type: DiscountType;
  retail_discount_value: number;

  distributor_mrp: number;
  distributor_discount_type: DiscountType;
  distributor_discount_value: number;

  stock_quantity: number;
  low_stock_threshold: number;

  sort_order: number;
  is_active: boolean;

  images?: ProductImagePayload[];
}

// ============================
// PRODUCT PAYLOAD
// ============================

export interface ProductPayload {
  product_code: string;
  name: string;

  slug?: string;

  description: string;
  specification: string;

  category_id: number;
  tax_category_id: number;

  stock_quantity: number;
  low_stock_threshold: number;

  is_published: boolean;
  is_trending: boolean;
  trending_sort_order: number;

  sale_type?: string;

  // Retail
  retail_mrp: number;
  retail_discount_type: DiscountType;
  retail_discount_value: number;

  // Distributor
  distributor_mrp: number;
  distributor_discount_type: DiscountType;
  distributor_discount_value: number;

  product_images?: ProductImagePayload[];
  variants?: ProductVariantPayload[];
}

export interface DealPayload {
  starts_at: string;
  ends_at: string;
  sale_type: string;
}

export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

export interface ProductFilters {
  price_range: {
    min: number;
    max: number;
  };
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status?: number;
  pagination?: Pagination;
  filters?: ProductFilters;
}


export const productApi = {
  
  getProducts: (
    params?: Record<string, unknown>
  ) =>
    apiClient.get<ApiResponse<Product[]>>(
      "/products",
      { params }
    ),

  getProductById: (id: number) =>
    apiClient.get<ApiResponse<Product>>(
      `/products/${id}`
    ),

  getProductBySlug: (slug: string) =>
    apiClient.get<ApiResponse<Product>>(
      `/products/slug/${slug}`
    ),

  createProduct: (data: FormData) =>
    apiClient.post<ApiResponse<Product>>(
      "/products",
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ),

  updateProduct: (
    id: number,
    data: FormData
  ) =>
    apiClient.post<ApiResponse<Product>>(
      `/products/update/${id}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ),

  deleteImages: (
    productId: number,
    imageIds: number[]
  ) =>
    apiClient.delete<ApiResponse<null>>(
      `/products/${productId}/images`,
      {
        data: {
          image_ids: imageIds,
        },
      }
    ),

  // ============================
  // deal CRUD
  // ============================


  getDeals: () =>
    apiClient.get<ApiResponse<Product[]>>(
      "/products-deal-of-the-day"
    ),

  getDealById: (id: number) =>
    apiClient.get<ApiResponse<Product>>(
      `/products-deal-of-the-day/${id}`
    ),

  addDeal: (
    productId: number,
    data: DealPayload
  ) =>
    apiClient.post<ApiResponse<Product>>(
      `/products-deal-of-the-day/${productId}`,
      data
    ),

  removeDeal: (productId: number) =>
    apiClient.delete<ApiResponse<null>>(
      `/products-deal-of-the-day/${productId}`
    ),
};