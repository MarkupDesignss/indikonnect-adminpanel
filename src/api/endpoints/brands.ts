import apiClient from "../client";

export interface Brand {
  id: number;
  title: string;
  discount_percentage: number;
  logo: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BrandPayload {
  title: string;
  discount_percentage: number;
  logo?: File | null;
}


interface BrandResponse {
  success: boolean;
  message?: string;
  data: Brand;
}

interface BrandsResponse {
  success: boolean;
  message?: string;
  data: Brand[];
}


const brandsApi = {
  getAll: () => {
    return apiClient.get<BrandsResponse>("/brands");
  },

  // GET SINGLE BRAND
  getById: (id: number) => {
    return apiClient.get<BrandResponse>(`/brands/${id}`);
  },

  // CREATE BRAND
  create: (payload: BrandPayload) => {
    const formData = new FormData();

    formData.append("title", payload.title);
    formData.append(
      "discount_percentage",
      String(payload.discount_percentage)
    );

    if (payload.logo) {
      formData.append("logo", payload.logo);
    }

    return apiClient.post<BrandResponse>("/brands", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // UPDATE BRAND
  update: (id: number, payload: BrandPayload) => {
    const formData = new FormData();

    formData.append("title", payload.title);
    formData.append(
      "discount_percentage",
      String(payload.discount_percentage)
    );

    if (payload.logo) {
      formData.append("logo", payload.logo);
    }

    return apiClient.put<BrandResponse>(`/brands/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // DELETE BRAND
  delete: (id: number) => {
    return apiClient.delete<BrandResponse>(`/brands/${id}`);
  },
};

export default brandsApi;