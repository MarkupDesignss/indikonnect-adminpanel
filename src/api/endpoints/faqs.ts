import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FAQCreatePayload {
  question: string;
  answer: string;
}

export interface FAQUpdatePayload {
  question: string;
  answer: string;
  is_active: number;
}

export interface FAQAddPayload {
  question: string;
  answer: string;
  is_active?: number;
}

interface FAQResponse {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data: FAQ | null;
}

interface FAQsResponse {
  success: boolean;
  message?: string;
  data: FAQ[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

// =====================================================
// API
// =====================================================

const faqsApi = {
  // ===================================================
  // GET ALL
  // ===================================================

  getAll: () => {
    return apiClient.get<FAQsResponse>("/faqs");
  },

  // ===================================================
  // GET SINGLE
  // ===================================================

  getById: (id: number) => {
    return apiClient.get<FAQResponse>(`/faqs/${id}`);
  },

  // ===================================================
  // CREATE
  // ===================================================

  create: (payload: FAQAddPayload) => {
    return apiClient.post<FAQResponse>("/faqs", {
      question: payload.question,
      answer: payload.answer,
      ...(payload.is_active !== undefined
        ? { is_active: payload.is_active }
        : {}),
    });
  },

  // ===================================================
  // UPDATE
  // ===================================================

  update: (id: number, payload: FAQUpdatePayload) => {
    return apiClient.post<FAQResponse>(`/faqs/${id}`, {
      question: payload.question,
      answer: payload.answer,
      is_active: payload.is_active,
    });
  },

  // ===================================================
  // DELETE
  // ===================================================

  delete: (id: number) => {
    return apiClient.delete<FAQResponse>(`/faqs/${id}`);
  },
};

export default faqsApi;