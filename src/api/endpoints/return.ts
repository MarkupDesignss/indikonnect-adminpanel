// api/endpoints/return.ts
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
  return_status:
    | "none"
    | "pending"
    | "approved"
    | "rejected"
    | "received"
    | "completed";
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

export type ReturnStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "received"
  | "completed";

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
    refunded_at?: string | null;
    updated_at?: string | null;
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
    refund_amount?: number;
    approved_at?: string | null;
    received_at?: string | null;
    completed_at?: string | null;
    refunded_at?: string | null;
  };
}

// ===================== API SERVICE =====================

export const returnApi = {
  /**
   * GET /admin/returns
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
   */
  getById: (id: number) =>
    apiClient.get<SingleReturnResponse>(`/admin/returns/${id}`),

  /**
   * POST /admin/returns/:id/approve
   * Payload:
   * {
   *   refund_amount: number,   // required — manually entered by admin
   *   admin_notes?: string     // optional
   * }
   */
  approve: (
    id: number,
    payload: {
      refund_amount: number;
      admin_notes?: string;
    }
  ) =>
    apiClient.post<ReturnActionResponse>(`/admin/returns/${id}/approve`, {
      refund_amount: payload.refund_amount,
      ...(payload.admin_notes?.trim() && {
        admin_notes: payload.admin_notes.trim(),
      }),
    }),

  /**
   * POST /admin/returns/:id/reject
   * Payload:
   * {
   *   admin_notes?: string   // optional
   * }
   */
  reject: (id: number, rejection_reason?: string) =>
    apiClient.post<ReturnActionResponse>(
      `/admin/returns/${id}/reject`,
      rejection_reason?.trim() ? { rejection_reason: rejection_reason.trim() } : {}
    ),

  /**
   * POST /admin/returns/:id/received
   */
  markReceived: (id: number, admin_notes?: string) =>
    apiClient.post<ReturnActionResponse>(
      `/admin/returns/${id}/received`,
      admin_notes ? { admin_notes } : {}
    ),

  /**
   * POST /admin/returns/:id/complete
   */
  complete: (id: number, admin_notes?: string) =>
    apiClient.post<ReturnActionResponse>(
      `/admin/returns/${id}/complete`,
      admin_notes ? { admin_notes } : {}
    ),
};

export default returnApi;