import apiClient from "../client";
import type { AxiosProgressEvent } from "axios";

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

/* =========================================================
   PRODUCT IMAGE
========================================================= */

export interface ProductImage {
  id: number;
  image: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean | number;
}

export interface ProductImagePayload {
  image: File;
  sort_order: number;
  is_primary: boolean | number;
}

/* =========================================================
   MOVE PRODUCT IMAGE PAYLOAD
========================================================= */

export interface MoveProductImagePayload {
  image_id_1: number;
  image_id_2: number;
}

/* =========================================================
   PRODUCT VARIANT
========================================================= */

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

/* =========================================================
   PRODUCT
========================================================= */

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

  retail_mrp: string | number;
  retail_price: string | number;

  retail_discount_type: DiscountType;
  retail_discount_value: string | number;
  retail_discount_amount: number;
  retail_discount_percentage: number;

  distributor_mrp: string | number;
  distributor_price: string | number;

  distributor_discount_type: DiscountType;
  distributor_discount_value: string | number;
  distributor_discount_amount: number;
  distributor_discount_percentage: number;

  stock_quantity: number;
  low_stock_threshold: number;

  is_published: boolean;
  is_trending: boolean;
  trending_sort_order: number;

  is_deal_of_the_day: boolean;
  is_active_deal: boolean;

  deal_of_the_day_starts_at: string | null;
  deal_of_the_day_ends_at: string | null;

  stock_status: StockStatus;
  status: ProductStatus;

  is_wishlisted: boolean;

  // Product Images
  images: ProductImage[];

  primary_image: string;
  primary_image_url: string;

  variants?: ProductVariant[];

  reviews_summary: ReviewsSummary;

  commission_value: number;
  waiting_value: number;

  shipping_charge: number;

  created_at: string;
  updated_at: string;
}

/* =========================================================
   SELECT OPTION
========================================================= */

export interface SelectOption {
  id: number;
  name: string;
}

/* =========================================================
   PRODUCT VARIANT PAYLOAD
========================================================= */

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

/* =========================================================
   PRODUCT PAYLOAD
========================================================= */

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

  retail_mrp: number;
  retail_discount_type: DiscountType;
  retail_discount_value: number;

  distributor_mrp: number;
  distributor_discount_type: DiscountType;
  distributor_discount_value: number;

  commission_value: number;
  waiting_value: number;

  shipping_charge: number;

  product_images?: ProductImagePayload[];
  variants?: ProductVariantPayload[];
}

/* =========================================================
   DEAL
========================================================= */

export interface DealPayload {
  starts_at: string;
  ends_at: string;
  sale_type: string;
}

/* =========================================================
   PUBLISH
========================================================= */

export interface PublishProductPayload {
  is_published: 0 | 1;
}

/* =========================================================
   PAGINATION
========================================================= */

export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

/* =========================================================
   PRODUCT FILTERS
========================================================= */

export interface ProductFilters {
  price_range: {
    min: number;
    max: number;
  };
}

/* =========================================================
   API RESPONSE
========================================================= */

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status?: number;
  pagination?: Pagination;
  filters?: ProductFilters;
}

/* =========================================================
   WAREHOUSE TYPES
========================================================= */

export interface Warehouse {
  id: number;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  status?: string;
  is_active?: boolean;
}

export interface WarehouseStockPayload {
  warehouse_id: number;
  product_id: number[];
  variant_id: (number | null)[];
  quantity: number;
}

/* =========================================================
   UPLOAD PROGRESS TYPES
========================================================= */

export interface UploadProgressMeta {
  /** 0 - 100 */
  percent: number;

  /** bytes uploaded so far */
  loaded: number;

  /** total bytes (0 if server doesn't send Content-Length) */
  total: number;

  /** bytes per second */
  bytesPerSecond: number;

  /** milliseconds elapsed since upload started */
  elapsedMs: number;

  /** estimated ms remaining (null if unknown) */
  estimatedRemainingMs: number | null;
}

export type OnUploadProgress = (meta: UploadProgressMeta) => void;

/* =========================================================
   INTERNAL UPLOAD PROGRESS HELPER
========================================================= */

function emitUploadProgress(
  e: AxiosProgressEvent,
  startedAt: number,
  cb?: OnUploadProgress,
) {
  if (!cb) return;

  const loaded = e.loaded ?? 0;
  const total = e.total ?? 0;

  const percent =
    total > 0
      ? Math.min(100, Math.round((loaded / total) * 100))
      : 0;

  const elapsedMs = Date.now() - startedAt;

  const bytesPerSecond =
    elapsedMs > 0
      ? (loaded / elapsedMs) * 1000
      : 0;

  const estimatedRemainingMs =
    bytesPerSecond > 0 && total > 0
      ? ((total - loaded) / bytesPerSecond) * 1000
      : null;

  cb({
    percent,
    loaded,
    total,
    bytesPerSecond,
    elapsedMs,
    estimatedRemainingMs,
  });
}

/* =========================================================
   DELETE PRODUCT IMAGE
========================================================= */

export interface DeleteProductImagesPayload {
  image_ids: number[];
}

/* =========================================================
   PRODUCT API
========================================================= */

export const productApi = {
  // ============================
  // PRODUCT CRUD
  // ============================

  getProducts: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<Product[]>>("/products", {
      params,
    }),

  getProductById: (id: number) =>
    apiClient.get<ApiResponse<Product>>(`/products/${id}`),

  getProductBySlug: (slug: string) =>
    apiClient.get<ApiResponse<Product>>(
      `/products/slug/${slug}`,
    ),

  createProduct: (
    data: FormData,
    onUploadProgress?: OnUploadProgress,
  ) => {
    const startedAt = Date.now();

    return apiClient.post<ApiResponse<Product>>(
      "/products",
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (e) =>
          emitUploadProgress(
            e,
            startedAt,
            onUploadProgress,
          ),
      },
    );
  },

  updateProduct: (
    id: number,
    data: FormData,
    onUploadProgress?: OnUploadProgress,
  ) => {
    const startedAt = Date.now();

    return apiClient.post<ApiResponse<Product>>(
      `/products/update/${id}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (e) =>
          emitUploadProgress(
            e,
            startedAt,
            onUploadProgress,
          ),
      },
    );
  },

  deleteImages: (
    productId: number,
    imageIds: number[],
  ) =>
    apiClient.delete<ApiResponse<null>>(
      `/products/${productId}/images`,
      {
        data: {
          image_ids: imageIds,
        },
      },
    ),

  // ============================
  // MOVE / SWAP PRODUCT IMAGE
  // ============================

  moveProductImage: (
    productId: number,
    data: MoveProductImagePayload,
  ) =>
    apiClient.post<ApiResponse<null>>(
      `/move-product-image/${productId}`,
      data,
    ),

  // ============================
  // PUBLISH / UNPUBLISH
  // ============================

  publishProduct: (
    productId: number,
    data: PublishProductPayload,
  ) =>
    apiClient.post<ApiResponse<Product>>(
      `/publish/${productId}/product`,
      data,
    ),

  // ============================
  // DEAL CRUD
  // ============================

  getDeals: () =>
    apiClient.get<ApiResponse<Product[]>>(
      "/products-deal-of-the-day",
    ),

  getDealById: (id: number) =>
    apiClient.get<ApiResponse<Product>>(
      `/products-deal-of-the-day/${id}`,
    ),

  addDeal: (
    productId: number,
    data: DealPayload,
  ) =>
    apiClient.post<ApiResponse<Product>>(
      `/products-deal-of-the-day/${productId}`,
      data,
    ),

  removeDeal: (productId: number) =>
    apiClient.delete<ApiResponse<null>>(
      `/products-deal-of-the-day/${productId}`,
    ),

  // ============================
  // WAREHOUSE
  // ============================

  getWarehouses: () =>
    apiClient.get<ApiResponse<Warehouse[]>>(
      "/warehouses",
    ),

  assignProductsToWarehouse: (
    data: WarehouseStockPayload,
  ) =>
    apiClient.post<ApiResponse<unknown>>(
      "/warehouse-stocks",
      data,
    ),
};