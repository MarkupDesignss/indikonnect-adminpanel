import apiClient from "../client";

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactListResponse {
  success: boolean;
  data: {
    current_page: number;
    data: Contact[];
    first_page_url?: string | null;
    from?: number | null;
    last_page?: number;
    last_page_url?: string | null;
    next_page_url?: string | null;
    path?: string;
    per_page?: number;
    prev_page_url?: string | null;
    to?: number | null;
    total?: number;
  };
}

export interface ContactActionResponse {
  success: boolean;
  message: string;
  data?: Contact | null;
}

export interface BulkDeletePayload {
  ids: number[];
}

// =====================================================
// API
// =====================================================

export const contactApi = {
  /**
   * GET /api/contact
   */
  getAll: () =>
    apiClient.get<ContactListResponse>("/contact"),

  /**
   * POST /api/contacts-mark-read/:id
   */
  markAsRead: (id: number) =>
    apiClient.post<ContactActionResponse>(
      `/contact/mark-read/${id}`
    ),

  /**
   * DELETE /api/contact/:id
   */
  delete: (id: number) =>
    apiClient.delete<ContactActionResponse>(
      `/contact/${id}`
    ),

  /**
   * POST /api/contact/bulk-delete
   */
  bulkDelete: (ids: number[]) =>
    apiClient.post<ContactActionResponse>(
      "/contact/bulk-delete",
      {
        ids,
      }
    ),
};

export default contactApi;