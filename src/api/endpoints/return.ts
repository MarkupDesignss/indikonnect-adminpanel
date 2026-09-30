// api/endpoints/return.ts
import apiClient from "../client";

// ===================== TYPES =====================

export interface ReturnUser {
  id: number;
  name: string | null;
  email: string;
  phone?: string;
  account_type?: string | null;
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
  method?: string | null;
  amount_with_tax_shipping?: number;
  deducted_shipping_charge?: number;
  refund_gateway_charges?: number;
}

// ===================== REFUND INFO (Completed state) =====================

export interface RefundDeduction {
  label: string;
  amount: number;
}

export interface RefundBreakdown {
  gross_refund: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  deductions: RefundDeduction[];
  net_refund: number;
}

export interface RefundInfo {
  resolution?: "refund" | "replacement";
  amount?: number;
  refund_method?: string | null;
  status?: string;
  notes?: string | null;
  completed_at?: string | null;
  deduction_breakdown?: RefundBreakdown;
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
    resolution?: "refund" | "replacement" | null;
    items: ReturnItem[];
    refund_details: RefundDetails;
    refund_info?: RefundInfo | null;
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
  type?: string;
  order_reference: string;
  user: {
    id: number;
    name: string | null;
    email: string;
    account_type?: string | null;
  };
  status: ReturnStatus;
  resolution?: "refund" | "replacement" | null;
  items_count: number;
  refund_amount: number;
  refund_info?: RefundInfo | null;
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
    received: number;
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
    resolution?: "refund" | "replacement" | null;
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
   *   refund_amount?: number,   // optional
   *   admin_notes?: string      // optional
   * }
   */
  approve: (
    id: number,
    payload: {
      refund_amount?: number;
      admin_notes?: string;
    }
  ) =>
    apiClient.post<ReturnActionResponse>(`/admin/returns/${id}/approve`, {
      ...(payload.refund_amount !== undefined &&
        payload.refund_amount !== null && {
          refund_amount: payload.refund_amount,
        }),
      ...(payload.admin_notes?.trim() && {
        admin_notes: payload.admin_notes.trim(),
      }),
    }),

  /**
   * POST /admin/returns/:id/reject
   * Payload:
   * {
   *   rejection_reason?: string
   * }
   */
  reject: (id: number, rejection_reason?: string) =>
    apiClient.post<ReturnActionResponse>(
      `/admin/returns/${id}/reject`,
      rejection_reason?.trim()
        ? { rejection_reason: rejection_reason.trim() }
        : {}
    ),

  /**
   * POST /admin/returns/:id/received
   * Mark the return as received (no refund happens here).
   * Payload:
   * {
   *   admin_notes?: string   // optional
   * }
   */
  markReceived: (
    id: number,
    payload?: {
      admin_notes?: string;
    }
  ) =>
    apiClient.post<ReturnActionResponse>(
      `/admin/returns/${id}/received`,
      {
        ...(payload?.admin_notes?.trim() && {
          admin_notes: payload.admin_notes.trim(),
        }),
      }
    ),

  /**
   * POST /admin/returns/:id/complete
   * Complete the return with a resolution (refund or replacement).
   * Payload:
   * {
   *   resolution: "refund" | "replacement",
   *   refund_amount?: number,   // required when resolution = "refund"
   *   admin_notes?: string      // optional
   * }
   */
  complete: (
    id: number,
    payload: {
      resolution: "refund" | "replacement";
      refund_amount?: number;
      admin_notes?: string;
    }
  ) =>
    apiClient.post<ReturnActionResponse>(
      `/admin/returns/${id}/complete`,
      {
        resolution: payload.resolution,
        ...(payload.resolution === "refund" &&
          payload.refund_amount !== undefined &&
          payload.refund_amount !== null && {
            refund_amount: payload.refund_amount,
          }),
        ...(payload.admin_notes?.trim() && {
          admin_notes: payload.admin_notes.trim(),
        }),
      }
    ),
};

export default returnApi;