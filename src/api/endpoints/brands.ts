import apiClient from "../client";

export interface Brand {
  id: number;
  title: string;
  discount_percentage: number;
  logo: string | null;
  banner: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BrandPayload {
  title: string;
  discount_percentage: number;
  logo?: File | null;
  banner?: File | null;
}

interface BrandResponse {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data: Brand | null;
}

interface BrandsResponse {
  success: boolean;
  message?: string;
  data: Brand[];
}

const buildFormData = (
  payload: BrandPayload
): FormData => {
  const formData = new FormData();

  formData.append("title", payload.title);
  formData.append(
    "discount_percentage",
    String(payload.discount_percentage)
  );

  if (payload.logo instanceof File) {
    formData.append(
      "logo",
      payload.logo,
      payload.logo.name
    );
  }

  if (payload.banner instanceof File) {
    formData.append(
      "banner",
      payload.banner,
      payload.banner.name
    );
  }

  return formData;
};

const brandsApi = {
  // GET ALL
  getAll: () => {
    return apiClient.get<BrandsResponse>("/brands");
  },

  // GET SINGLE
  getById: (id: number) => {
    return apiClient.get<BrandResponse>(
      `/brands/${id}`
    );
  },

  // CREATE
  create: (payload: BrandPayload) => {
    const formData = buildFormData(payload);

    return apiClient.post<BrandResponse>(
      "/brands",
      formData,
      {
        transformRequest: [
          (data, headers) => {
            if (data instanceof FormData) {
              if (headers) {
                delete headers["Content-Type"];
                delete headers["content-type"];
              }

              return data;
            }

            return data;
          },
        ],
      }
    );
  },

  // UPDATE
  update: (
    id: number,
    payload: BrandPayload
  ) => {
    const formData = buildFormData(payload);

    return apiClient.post<BrandResponse>(
      `/brands/${id}`,
      formData,
      {
        transformRequest: [
          (data, headers) => {
            if (data instanceof FormData) {
              if (headers) {
                delete headers["Content-Type"];
                delete headers["content-type"];
              }

              return data;
            }

            return data;
          },
        ],
      }
    );
  },

  // DELETE
  delete: (id: number) => {
    return apiClient.delete<BrandResponse>(
      `/brands/${id}`
    );
  },
};

export default brandsApi;