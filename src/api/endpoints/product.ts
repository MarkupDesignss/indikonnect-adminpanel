import apiClient from '../client';

export interface Product {
  id: number;
  product_code: string;
  name: string;
  slug: string;
  description: string;
  retail_price: number;
  distributor_price: number;
  stock_quantity: number;
  // ... all fields
}

export const productApi = {
  // GET /products?category_ids=...&...
  getProducts: (params: Record<string, any>) =>
    apiClient.get<Product[]>('/products', { params }),

  // GET /products/slug/:slug
  getProductBySlug: (slug: string) =>
    apiClient.get<Product>(`/products/slug/${slug}`),

  // POST /products (form-data)
  createProduct: (data: FormData) =>
    apiClient.post<Product>('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // POST /products/update/:id
  updateProduct: (id: number, data: FormData) =>
    apiClient.post<Product>(`/products/update/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // DELETE /products/:id/images
  deleteImages: (productId: number, imageIds: number[]) =>
    apiClient.delete(`/products/${productId}/images`, { data: { image_ids: imageIds } }),
};