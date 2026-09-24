import apiClient from "../client";

export interface FAQSection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FAQSectionCreatePayload {
  name: string;
  description?: string;
  is_active?: number;
}

export interface FAQSectionUpdatePayload {
  name: string;
  description?: string;
  is_active: number;
}

interface FAQSectionResponse {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data: FAQSection | null;
}

interface FAQSectionsResponse {
  success: boolean;
  message?: string;
  data: FAQSection[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}


const faqSectionsApi = {

  getAll: () => {
    return apiClient.get<FAQSectionsResponse>("/faq-sections");
  },

  getById: (id: number) => {
    return apiClient.get<FAQSectionResponse>(`/faq-sections/${id}`);
  },

  create: (payload: FAQSectionCreatePayload) => {
    return apiClient.post<FAQSectionResponse>("/faq-sections", {
      name: payload.name,
      ...(payload.description !== undefined
        ? { description: payload.description }
        : {}),
      ...(payload.is_active !== undefined
        ? { is_active: payload.is_active }
        : {}),
    });
  },

  update: (id: number, payload: FAQSectionUpdatePayload) => {
    return apiClient.post<FAQSectionResponse>(`/faq-sections/${id}`, {
      name: payload.name,
      ...(payload.description !== undefined
        ? { description: payload.description }
        : {}),
      is_active: payload.is_active,
    });
  },

  delete: (id: number) => {
    return apiClient.delete<FAQSectionResponse>(`/faq-sections/${id}`);
  },
};

export default faqSectionsApi;