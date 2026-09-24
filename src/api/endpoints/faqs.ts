import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface FAQSectionMini {
  id: number;
  name: string;
  slug: string;
}

export interface FAQ {
  id: number;
  section_id: number;
  question: string;
  answer: string;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  section?: FAQSectionMini;
}

export interface FAQCreatePayload {
  section_id: number;
  question: string;
  answer: string;
  is_active?: number;
}

export interface FAQUpdatePayload {
  section_id: number;
  question: string;
  answer: string;
  is_active: number;
}

export interface FAQAddPayload {
  section_id: number;
  question: string;
  answer: string;
  is_active?: number;
}

// =====================================================
// BULK CREATE TYPES
// =====================================================

export interface FAQBulkItem {
  question: string;
  answer: string;
  order?: number;
  is_active?: boolean;
}

export interface FAQBulkCreatePayload {
  section_id: number;
  is_active?: boolean;
  faqs: FAQBulkItem[];
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

interface FAQBulkCreateResponse {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data: FAQ[];
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
  // CREATE (single)
  // ===================================================
  create: (payload: FAQAddPayload) => {
    return apiClient.post<FAQResponse>("/faqs", {
      section_id: payload.section_id,
      question: payload.question,
      answer: payload.answer,
      ...(payload.is_active !== undefined
        ? { is_active: payload.is_active }
        : {}),
    });
  },

  // ===================================================
  // CREATE (bulk)
  // ===================================================
  createBulk: (payload: FAQBulkCreatePayload) => {
    return apiClient.post<FAQBulkCreateResponse>("/faqs", {
      section_id: payload.section_id,
      is_active: payload.is_active ?? true,
      faqs: payload.faqs.map((item) => ({
        question: item.question,
        answer: item.answer,
        order: item.order,
        is_active: item.is_active ?? true,
      })),
    });
  },

  // ===================================================
  // UPDATE
  // ===================================================
  update: (id: number, payload: FAQUpdatePayload) => {
    return apiClient.post<FAQResponse>(`/faqs/${id}`, {
      section_id: payload.section_id,
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