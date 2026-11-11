import apiClient from "../client";
import type { AxiosProgressEvent } from "axios";

export type DiscountType = "percentage" | "fixed";
export type ProductStatus = "active" | "inactive" | "draft";
export type StockStatus = "active" | "inactive" | "out_of_stock";
export type ProductType = "single" | "combo";

/* =========================================================
   CATEGORY
========================================================= */

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

export interface MoveProductImagePayload {
  image_id_1: number;
  image_id_2: number;
}

export interface DeleteProductImagesPayload {
  image_ids: number[];
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

/** Body for POST /products/{productId}/set-primary */
export interface SetPrimaryProductImagePayload {
  image_id: number;
}

/* =========================================================
   REVIEWS
========================================================= */

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
  marketed_by?: string | null;
  manufacturer?: string | null;

  /** ✅ NEW: Product type — single or combo */
  product_type: ProductType;

  /** ✅ NEW: Combo product IDs (only relevant when product_type === "combo") */
  combo_product_ids?: number[];

  category_id: number;
  category: Category;

  tax_category_id: number;
  tax_category: TaxCategory;

  // Ignite Product ID
  ignite_product_id?: number | null;

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

  /** Best Seller status */
  is_best_seller?: boolean | number;

  is_deal_of_the_day: boolean;
  is_active_deal: boolean;
  deal_of_the_day_starts_at: string | null;
  deal_of_the_day_ends_at: string | null;

  stock_status: StockStatus;
  status: ProductStatus;
  is_wishlisted: boolean;

  images: ProductImage[];
  primary_image: string;
  primary_image_url: string;

  variants?: ProductVariant[];
  reviews_summary: ReviewsSummary;

  commission_value: number;
  waiting_value: number;
  shipping_charge: number;

  /** ✅ NEW: Service charge (only for Electronics category) */
  service_charge?: number | string | null;

  created_at: string;
  updated_at: string;
}

/* =========================================================
   CATEGORY PRODUCT LIST RESPONSE
   GET /products/category/{categoryId}
========================================================= */

export interface CategoryProductsResponse {
  category_id: number;
  total: number;
  data: Product[];
}

/* =========================================================
   SUBCATEGORY
   GET /subcategories/category/{categoryId}
========================================================= */

export interface SubcategoryCategory {
  id: number;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  image?: string;
  status: boolean | "active" | "inactive";
  created_at: string;
  updated_at: string;
  category?: SubcategoryCategory;
}

export interface SubcategoryListResponse {
  success: boolean;
  data: Subcategory[];
  message?: string;
}

/* =========================================================
   SELECT OPTION
========================================================= */

export interface SelectOption {
  id: number;
  name: string;
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

  /** ✅ NEW: Product type — single or combo */
  product_type: ProductType;

  /** ✅ NEW: Combo product IDs (only relevant when product_type === "combo") */
  combo_product_ids?: number[];

  /** ✅ NEW: Combo product IDs to remove (only relevant on update) */
  remove_combo_product_ids?: number[];

  category_id: number;
  tax_category_id: number;

  // Ignite Product ID
  ignite_product_id?: number | null;

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

  /** ✅ NEW: Service charge (only for Electronics category) */
  service_charge?: number;

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

export interface UpdateDealPayload {
  starts_at?: string;
  ends_at?: string;
  sale_type?: string;
}

/* =========================================================
   PUBLISH
========================================================= */

export interface PublishProductPayload {
  is_published: 0 | 1;
}

/* =========================================================
   BEST SELLER
========================================================= */

export interface BestSellerPayload {
  is_best_seller: 0 | 1;
}

/** Body for POST /api/update-purchase-permission */
export interface UpdatePurchasePermissionPayload {
  product_ids: number[];
  /** 1 = allowed, 0 = not allowed. API field spelling is kept as provided. */
  allowed_purchsed: 0 | 1;
}

/* =========================================================
   PAGINATION / FILTERS / API RESPONSE
========================================================= */

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

/* =========================================================
   WAREHOUSE
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
   UPLOAD PROGRESS
========================================================= */

export interface UploadProgressMeta {
  /** 0 - 100 */
  percent: number;

  /** Bytes uploaded so far */
  loaded: number;

  /** Total bytes (0 if server doesn't send Content-Length) */
  total: number;

  /** Bytes per second */
  bytesPerSecond: number;

  /** Milliseconds elapsed since upload started */
  elapsedMs: number;

  /** Estimated milliseconds remaining (null if unknown) */
  estimatedRemainingMs: number | null;
}

export type OnUploadProgress = (meta: UploadProgressMeta) => void;

function emitUploadProgress(
  event: AxiosProgressEvent,
  startedAt: number,
  callback?: OnUploadProgress,
) {
  if (!callback) return;

  const loaded = event.loaded ?? 0;
  const total = event.total ?? 0;

  const percent =
    total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;

  const elapsedMs = Date.now() - startedAt;

  const bytesPerSecond =
    elapsedMs > 0 ? (loaded / elapsedMs) * 1000 : 0;

  const estimatedRemainingMs =
    bytesPerSecond > 0 && total > 0
      ? ((total - loaded) / bytesPerSecond) * 1000
      : null;

  callback({
    percent,
    loaded,
    total,
    bytesPerSecond,
    elapsedMs,
    estimatedRemainingMs,
  });
}

/* =========================================================
   HELPER: BUILD FORM DATA FOR PRODUCT CREATE / UPDATE
   Handles product_type + combo_product_ids + remove_combo_product_ids
========================================================= */

export function buildProductFormData(
  payload: ProductPayload,
  options?: { isUpdate?: boolean },
): FormData {
  const { isUpdate = false } = options ?? {};
  const fd = new FormData();

  // Basic fields
  fd.append("product_code", payload.product_code);
  fd.append("name", payload.name);
  if (payload.slug) fd.append("slug", payload.slug);
  fd.append("description", payload.description);
  fd.append("specification", payload.specification);

  // ✅ Product type
  fd.append("product_type", payload.product_type);

  // ✅ Combo product IDs (array-style indices)
  if (payload.product_type === "combo" && payload.combo_product_ids) {
    payload.combo_product_ids.forEach((id, index) => {
      fd.append(`combo_product_ids[${index}]`, String(id));
    });
  }

  // ✅ Remove combo product IDs (only on update)
  if (isUpdate && payload.remove_combo_product_ids) {
    payload.remove_combo_product_ids.forEach((id, index) => {
      fd.append(`remove_combo_product_ids[${index}]`, String(id));
    });
  }

  fd.append("category_id", String(payload.category_id));
  fd.append("tax_category_id", String(payload.tax_category_id));

  if (payload.ignite_product_id != null) {
    fd.append("ignite_product_id", String(payload.ignite_product_id));
  }

  fd.append("stock_quantity", String(payload.stock_quantity));
  fd.append("low_stock_threshold", String(payload.low_stock_threshold));

  fd.append("is_published", payload.is_published ? "1" : "0");
  fd.append("is_trending", payload.is_trending ? "1" : "0");
  fd.append("trending_sort_order", String(payload.trending_sort_order));
  if (payload.sale_type) fd.append("sale_type", payload.sale_type);

  fd.append("retail_mrp", String(payload.retail_mrp));
  fd.append("retail_discount_type", payload.retail_discount_type);
  fd.append("retail_discount_value", String(payload.retail_discount_value));

  fd.append("distributor_mrp", String(payload.distributor_mrp));
  fd.append("distributor_discount_type", payload.distributor_discount_type);
  fd.append("distributor_discount_value", String(payload.distributor_discount_value));

  fd.append("commission_value", String(payload.commission_value));
  fd.append("waiting_value", String(payload.waiting_value));
  fd.append("shipping_charge", String(payload.shipping_charge));

  if (payload.service_charge != null) {
    fd.append("service_charge", String(payload.service_charge));
  }

  // Product images
  if (payload.product_images?.length) {
    payload.product_images.forEach((img, index) => {
      fd.append(`product_images[${index}][image]`, img.image);
      fd.append(`product_images[${index}][sort_order]`, String(img.sort_order));
      fd.append(
        `product_images[${index}][is_primary]`,
        String(Number(img.is_primary)),
      );
    });
  }

  // Variants
  if (payload.variants?.length) {
    payload.variants.forEach((variant, vIndex) => {
      fd.append(`variants[${vIndex}][sku]`, variant.sku);

      Object.entries(variant.attributes ?? {}).forEach(([key, val]) => {
        fd.append(`variants[${vIndex}][attributes][${key}]`, val);
      });

      fd.append(`variants[${vIndex}][retail_mrp]`, String(variant.retail_mrp));
      fd.append(
        `variants[${vIndex}][retail_discount_type]`,
        variant.retail_discount_type,
      );
      fd.append(
        `variants[${vIndex}][retail_discount_value]`,
        String(variant.retail_discount_value),
      );

      fd.append(
        `variants[${vIndex}][distributor_mrp]`,
        String(variant.distributor_mrp),
      );
      fd.append(
        `variants[${vIndex}][distributor_discount_type]`,
        variant.distributor_discount_type,
      );
      fd.append(
        `variants[${vIndex}][distributor_discount_value]`,
        String(variant.distributor_discount_value),
      );

      fd.append(
        `variants[${vIndex}][stock_quantity]`,
        String(variant.stock_quantity),
      );
      fd.append(
        `variants[${vIndex}][low_stock_threshold]`,
        String(variant.low_stock_threshold),
      );
      fd.append(`variants[${vIndex}][sort_order]`, String(variant.sort_order));
      fd.append(
        `variants[${vIndex}][is_active]`,
        variant.is_active ? "1" : "0",
      );

      if (variant.images?.length) {
        variant.images.forEach((img, iIndex) => {
          fd.append(
            `variants[${vIndex}][images][${iIndex}][image]`,
            img.image,
          );
          fd.append(
            `variants[${vIndex}][images][${iIndex}][sort_order]`,
            String(img.sort_order),
          );
          fd.append(
            `variants[${vIndex}][images][${iIndex}][is_primary]`,
            String(Number(img.is_primary)),
          );
        });
      }
    });
  }

  return fd;
}

/* =========================================================
   PRODUCT API
========================================================= */

export const productApi = {
  // ============================
  // PRODUCT CRUD
  // ============================

  getProducts: (params?: Record<string, unknown>) =>
    apiClient.get<ApiResponse<Product[]>>("/products", { params }),

  getProductById: (id: number) =>
    apiClient.get<ApiResponse<Product>>(`/products/${id}`),

  getProductBySlug: (slug: string) =>
    apiClient.get<ApiResponse<Product>>(`/products/slug/${slug}`),

  // ============================
  // CREATE PRODUCT
  // POST /products
  // ============================

  createProduct: (
    data: FormData,
    onUploadProgress?: OnUploadProgress,
  ) => {
    const startedAt = Date.now();

    return apiClient.post<ApiResponse<Product>>("/products", data, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event: AxiosProgressEvent) =>
        emitUploadProgress(event, startedAt, onUploadProgress),
    });
  },

  // ============================
  // UPDATE PRODUCT
  // POST /products/update/{id}
  // ============================

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
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event: AxiosProgressEvent) =>
          emitUploadProgress(event, startedAt, onUploadProgress),
      },
    );
  },

  // ============================
  // DELETE PRODUCT IMAGES
  // ============================

  deleteImages: (productId: number, imageIds: number[]) =>
    apiClient.delete<ApiResponse<null>>(
      `/products/${productId}/images`,
      {
        data: { image_ids: imageIds },
      },
    ),

  // ============================
  // PRODUCTS BY CATEGORY
  // GET /products/category/{categoryId}
  // ============================

  getProductsByCategory: (categoryId: number) =>
    apiClient.get<CategoryProductsResponse>(
      `/products/category/${categoryId}`,
    ),

  // ============================
  // SUBCATEGORIES BY CATEGORY
  // GET /subcategories/category/{categoryId}
  // ============================

  getSubcategoriesByCategory: (categoryId: number) =>
    apiClient.get<SubcategoryListResponse>(
      `/subcategories/category/${categoryId}`,
    ),

  // ============================
  // MOVE / SWAP PRODUCT IMAGE
  // POST /move-product-image/{productId}
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
  // SET PRIMARY PRODUCT IMAGE
  // POST /products/{productId}/set-primary
  // ============================

  setPrimaryImage: (productId: number, imageId: number) =>
    apiClient.post<ApiResponse<Product>>(
      `/products/${productId}/set-primary`,
      { image_id: imageId } satisfies SetPrimaryProductImagePayload,
    ),

  // ============================
  // PUBLISH / UNPUBLISH
  // ============================

  publishProduct: (
    productId: number,
    data: PublishProductPayload,
  ) =>
    apiClient.post<ApiResponse<Product>>(
      `/products/publish/${productId}/product`,
      data,
    ),

  // ============================
  // BEST SELLER
  // POST /best-seller/products/{productId}
  // ============================

  setBestSeller: (
    productId: number,
    data: BestSellerPayload,
  ) =>
    apiClient.post<ApiResponse<Product>>(
      `/best-seller/products/${productId}`,
      data,
    ),

  // ============================
  // UPDATE PURCHASE PERMISSION
  // POST /api/update-purchase-permission
  // ============================

  updatePurchasePermission: (data: UpdatePurchasePermissionPayload) =>
    apiClient.post<ApiResponse<unknown>>(
      "/update-purchase-permission",
      data,
    ),

  // ============================
  // DEAL OF THE DAY CRUD
  // ============================

  /** GET /products-deal-of-the-day */
  getDeals: () =>
    apiClient.get<ApiResponse<Product[]>>(
      "/products-deal-of-the-day",
    ),

  /** GET /products-deal-of-the-day/{id} */
  getDealById: (id: number) =>
    apiClient.get<ApiResponse<Product>>(
      `/products-deal-of-the-day/${id}`,
    ),

  /** POST /products-deal-of-the-day/{productId} */
  addDeal: (productId: number, data: DealPayload) =>
    apiClient.post<ApiResponse<Product>>(
      `/products-deal-of-the-day/${productId}`,
      data,
    ),

  /** PUT /products-deal-of-the-day/{productId} */
  updateDeal: (productId: number, data: UpdateDealPayload) =>
    apiClient.put<ApiResponse<Product>>(
      `/products-deal-of-the-day/${productId}`,
      data,
    ),

  /** DELETE /products-deal-of-the-day/{productId} */
  removeDeal: (productId: number) =>
    apiClient.delete<ApiResponse<null>>(
      `/products-deal-of-the-day/${productId}`,
    ),

  // ============================
  // WAREHOUSE
  // ============================

  getWarehouses: () =>
    apiClient.get<ApiResponse<Warehouse[]>>("/warehouses"),

  assignProductsToWarehouse: (data: WarehouseStockPayload) =>
    apiClient.post<ApiResponse<unknown>>(
      "/warehouse-stocks",
      data,
    ),
};