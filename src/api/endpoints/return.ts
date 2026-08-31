import apiClient from "../client";

// ===================== TYPES =====================

export interface ReturnUser {
  id: number;
  name: string | null;
  email: string;
  phone?: string;
}

export interface ReturnOrder {
  id: number;
  order_reference: string;
  status: "pending" | "approved" | "rejected" | "received" | "completed";
  return_status: "none" | "pending" | "approved" | "rejected" | "received" | "completed";
  delivered_at?: string;
}

export interface ReturnProduct {
  id: number;
  name: string;
  product_code: string;
  image: string;
}

export interface ReturnItem {
  order_line_id: number;
  product: ReturnProduct;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax: number;
  reason: string;
  image_paths: string[];
  image_urls: string[];
}

export interface RefundDetails {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export type ReturnStatus = "pending" | "approved" | "rejected" | "received" | "completed";

// ===================== RESPONSE TYPES =====================

export interface SingleReturnResponse {
  success: boolean;
  data: {
    id: number;
    order: ReturnOrder;
    user: ReturnUser;
    status: ReturnStatus;
    items: ReturnItem[];
    refund_details: RefundDetails;
    reason: string | null;
    admin_notes: string | null;
    rejection_reason: string | null;
    created_at: string;
    approved_at: string | null;
    received_at: string | null;
    completed_at: string | null;
    can_approve: boolean;
    can_reject: boolean;
    can_mark_received: boolean;
    can_complete: boolean;
  };
}

export interface ReturnListItem {
  id: number;
  order_reference: string;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  status: ReturnStatus;
  items_count: number;
  refund_amount: number;
  reason: string | null;
  created_at: string;
  can_approve: boolean;
  can_reject: boolean;
}

export interface AllReturnsResponse {
  success: boolean;
  data: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    data: ReturnListItem[];
  };
}

export interface ReturnActionResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    status: string;
    admin_notes?: string | null;
    rejection_reason?: string | null;
    approved_at?: string | null;
    received_at?: string | null;
    completed_at?: string | null;
  };
}

// ===================== API SERVICE =====================

export const returnApi = {
  /**
   * GET /admin/returns
   * Get all returns
   */
  getAll: (
    page?: number,
    per_page?: number,
    search?: string,
    status?: ReturnStatus | "all",
    sort_by?: "created_at" | "status" | "refund_amount" | "order_reference",
    sort_order?: "asc" | "desc",
    start_date?: string,
    end_date?: string
  ) =>
    apiClient.get<AllReturnsResponse>("/admin/returns", {
      params: {
        page: page || 1,
        per_page: per_page || 15,
        search: search || undefined,
        status: status === "all" ? undefined : status,
        sort_by: sort_by || "created_at",
        sort_order: sort_order || "desc",
        start_date: start_date || undefined,
        end_date: end_date || undefined,
      },
    }),

  /**
   * GET /admin/returns/:id
   * Get single return details by ID
   */
  getById: (id: number) =>
    apiClient.get<SingleReturnResponse>(`/admin/returns/${id}`),

  /**
   * POST /admin/returns/:id/approve
   * Approve a return request
   */
  approve: (id: number, admin_notes?: string) =>
    apiClient.post<ReturnActionResponse>(
      `/admin/returns/${id}/approve`,
      admin_notes ? { admin_notes } : {}
    ),

  /**
   * POST /admin/returns/:id/reject
   * Reject a return request
   */
  reject: (id: number, rejection_reason: string, admin_notes?: string) =>
    apiClient.post<ReturnActionResponse>(`/admin/returns/${id}/reject`, {
      rejection_reason,
      ...(admin_notes && { admin_notes }),
    }),

  /**
   * POST /admin/returns/:id/received
   * Mark return as received
   */
  markReceived: (id: number, admin_notes?: string) =>
    apiClient.post<ReturnActionResponse>(
      `/admin/returns/${id}/received`,
      admin_notes ? { admin_notes } : {}
    ),

  /**
   * POST /admin/returns/:id/complete
   * Complete the return process
   */
  complete: (id: number, admin_notes?: string) =>
    apiClient.post<ReturnActionResponse>(
      `/admin/returns/${id}/complete`,
      admin_notes ? { admin_notes } : {}
    ),
};

export default returnApi;