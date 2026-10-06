import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface WarehouseStockEntry {
  id: number;
  variant_id: number | null;
  quantity: number;
}

export interface WarehouseStock {
  warehouse_id: number;
  total_quantity: number;
  stock_status: "in_stock" | "out_of_stock" | "low_stock";
  entries: WarehouseStockEntry[];
}

export interface Brand {
  id: number;
  title: string;
  slug: string | null;
  logo: string | null;
  banner: string | null;
  status: boolean;
}

export interface Category {
  id: number;
  title: string;
  slug: string;
}

export interface SubCategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
}

export interface TaxCategory {
  id: number;
  name: string;
  rate: string;
}

export interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: number;
  [key: string]: any;
}

export interface WarehouseProduct {
  id: number;
  product_code: string;
  name: string;
  slug: string;
  description: string;
  specification: string;

  brand_id: number;
  brand: Brand;

  category_id: number;
  category: Category;

  subcategory_id: number | null;
  subcategory: SubCategory | null;

  tax_category_id: number;
  tax_category: TaxCategory;

  retail_mrp: string;
  retail_price: string;
  distributor_mrp: string;
  distributor_price: string;
  commission_value: string;

  is_published: boolean;
  is_trending: boolean;
  is_deal_of_the_day: boolean;
  deal_of_the_day_starts_at: string | null;
  deal_of_the_day_ends_at: string | null;

  sale_type: string;

  stock_quantity: number;
  low_stock_threshold: number;

  warehouse_stock: WarehouseStock;

  images: ProductImage[];
  primary_image_url: string;

  variants: ProductVariant[];

  created_at: string;
  updated_at: string;
}

export interface WarehouseStocksPagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface WarehouseStocksMeta {
  warehouse_id: number;
  sort: string | null;
}

export interface WarehouseStocksResponse {
  warehouse: {
    id: number;
    name: string;
  };
  data: WarehouseProduct[];
  pagination: WarehouseStocksPagination;
  meta: WarehouseStocksMeta;
}

// =====================================================
// NEW UPDATE STOCK (single product, add/subtract)
// =====================================================
export type StockOperation = "add" | "subtract";

export interface UpdateStockPayload {
  product_id: number;
  operation: StockOperation;
  quantity: number;
}

export interface UpdateStockResponse {
  success?: boolean;
  message?: string;
  data?: any;
  errors?: Record<string, string[]>;
}

// =====================================================
// API
// =====================================================

const warehouseStocksApi = {
  // GET /warehouse-stocks/{warehouseId}
  getByWarehouse: (
    warehouseId: number,
    params?: {
      page?: number;
      per_page?: number;
      search?: string;
      sort?: string;
    }
  ) => {
    return apiClient.get<WarehouseStocksResponse>(
      `/warehouse-stocks/${warehouseId}`,
      {
        params: {
          page: params?.page ?? 1,
          per_page: params?.per_page ?? 25,
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.sort ? { sort: params.sort } : {}),
        },
      }
    );
  },

  // POST /warehouses/{warehouseId}/update-stock
  // Body: { product_id, operation: "add" | "subtract", quantity }
  updateStock: (
    warehouseId: number,
    payload: UpdateStockPayload
  ) => {
    return apiClient.post<UpdateStockResponse>(
      `/warehouses/${warehouseId}/update-stock`,
      {
        product_id: payload.product_id,
        operation: payload.operation,
        quantity: payload.quantity,
      }
    );
  },
};

export default warehouseStocksApi;