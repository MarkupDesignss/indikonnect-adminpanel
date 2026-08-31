export type ProductStatus =
  | "active"
  | "inactive"
  | "draft";

export interface ProductImage {
  id: number;
  image: string;
  sort_order: number;
  is_primary: number;
}

export interface Product {
  id: number;

  product_code: string;

  name: string;

  slug: string;

  description: string;

  specification: string;

  category_id: number;

  tax_category_id: number;

  brand_id: number;

  retail_price: number;

  distributor_price: number;

  stock_quantity: number;

  low_stock_threshold: number;

  is_published: number;

  product_images: ProductImage[];

  status: ProductStatus;
}

export interface ProductImagePayload {
  file: File;
  sort_order: number;
  is_primary: number;
}

export interface ExistingProductImagePayload {
  id: number;
  sort_order: number;
  is_primary: number;
}

export interface ProductPayload {
  product_code: string;

  name: string;

  slug: string;

  description: string;

  specification: string;

  category_id: number;

  tax_category_id: number;

  brand_id: number;

  retail_price: number;

  distributor_price: number;

  stock_quantity: number;

  low_stock_threshold: number;

  is_published: number;

  product_images: ProductImagePayload[];

  existing_images?: ExistingProductImagePayload[];
}

export interface SelectOption {
  id: number;
  name: string;
}
