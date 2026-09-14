import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export type CancellationStatus =
  | "pending"
  | "approved"
  | "rejected";

export type DeliveryStatus =
  | "pending"
  | "confirmed"
  | "cancel_pending"
  | "cancelled"
  | "shipped"
  | "delivered";

export interface CancellationUser {
  id: number;
  distributor_id?: string;
  full_name: string | null;
  email: string;
  phone?: string | null;
  profile_picture?: string | null;
  account_type?: string;
  is_active?: boolean;
}

export interface CancellationOrder {
  id: number;
  order_reference: string;
  user_id: number;
  status?: string;
  delivery_status?: string;
  total_payable?: string;
  amount_paid?: string;
  refund_status?: string | null;
  refunded_at?: string | null;
  payment_gateway?: string;
  gateway_transaction_id?: string;
  created_at?: string;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
}

export interface CancellationProduct {
  id: number;
  name: string;
  product_code: string;
  slug?: string;
  image?: string | null;
  distributor_price?: string;
  retail_price?: string;
  stock_quantity?: number;
  shipping_charge?: string;
}

export interface CancellationItem {
  id: number;
  item_reference_id: string;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  returned_quantity: number;
  shipping_charge: string;
  delivery_status: DeliveryStatus | string;
  cancellation_requested_at: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  unit_price: string;
  gst_rate: string;
  cgst_rate: string;
  sgst_rate: string;
  igst_rate: string;
  gst_amount: string;
  cgst_amount: string;
  sgst_amount: string;
  igst_amount: string;
  line_total: string;
  created_at: string;
  updated_at: string;
}

export interface CancellationRefundDetails {
  subtotal?: number;
  tax?: number;
  shipping?: number;
  total?: number;
}

export interface CancellationListItem {
  id: number;
  item_reference_id: string;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  returned_quantity: number;
  shipping_charge: string;
  delivery_status: DeliveryStatus | string;
  cancellation_requested_at: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  unit_price: string;
  gst_rate: string;
  cgst_rate: string;
  sgst_rate: string;
  igst_rate: string;
  gst_amount: string;
  cgst_amount: string;
  sgst_amount: string;
  igst_amount: string;
  line_total: string;
  created_at: string;
  updated_at: string;

  order: CancellationOrder;
  product: CancellationProduct;
  variant?: any | null;

  // Computed / optional fields
  status?: CancellationStatus;
  user?: CancellationUser;
  refund_amount?: number;
  amount?: number;
  reason?: string | null;
  can_approve?: boolean;
  can_reject?: boolean;
  can_pay?: boolean;
}

export interface SingleCancellationData {
  id?: number;
  item_reference_id?: string;
  order_id?: number;
  product_id?: number;
  variant_id?: number | null;
  quantity?: number;
  returned_quantity?: number;
  shipping_charge?: string;
  delivery_status?: DeliveryStatus | string;
  cancellation_requested_at?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  unit_price?: string;
  gst_rate?: string;
  cgst_rate?: string;
  sgst_rate?: string;
  igst_rate?: string;
  gst_amount?: string;
  cgst_amount?: string;
  sgst_amount?: string;
  igst_amount?: string;
  line_total?: string;
  created_at?: string;
  updated_at?: string;

  order?: CancellationOrder;
  product?: CancellationProduct;
  variant?: any | null;
  user?: CancellationUser;

  status?: CancellationStatus;
  reason?: string | null;
  amount?: number;
  refund_amount?: number;
  refund_details?: CancellationRefundDetails;
  admin_notes?: string | null;
  rejection_reason?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  paid_at?: string | null;
  can_approve?: boolean;
  can_reject?: boolean;
  can_pay?: boolean;
}

export interface SingleCancellationResponse {
  success: boolean;
  message?: string;
  data: SingleCancellationData;
}

export interface AllCancellationResponse {
  success: boolean;
  message?: string;
  data: {
    current_page: number;
    data: CancellationListItem[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: {
      url: string | null;
      label: string;
      page: number | null;
      active: boolean;
    }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;

    pending?: number;
    approved?: number;
    rejected?: number;
  };
}

export interface CancellationActionResponse {
  success: boolean;
  message: string;
  data?: {
    id?: number;
    order_line_id?: number;
    status?: string;
    amount?: number;
    refund_amount?: number;
    admin_notes?: string | null;
    rejection_reason?: string | null;
    approved_at?: string | null;
    rejected_at?: string | null;
    paid_at?: string | null;
  };
}

// =====================================================
// API SERVICE
// =====================================================

export const cancellationApi = {
  /**
   * GET /admin/cancellation-requests
   */
  getAll: (
    page?: number,
    per_page?: number,
    search?: string,
    status?: CancellationStatus | "all",
    sort_by?:
      | "created_at"
      | "status"
      | "refund_amount"
      | "order_reference",
    sort_order?: "asc" | "desc",
    start_date?: string,
    end_date?: string
  ) =>
    apiClient.get<AllCancellationResponse>(
      "/admin/cancellation-requests",
      {
        params: {
          page: page || 1,
          per_page: per_page || 15,
          search: search?.trim() || undefined,
          status: status === "all" ? undefined : status,
          sort_by: sort_by || "created_at",
          sort_order: sort_order || "desc",
          start_date: start_date || undefined,
          end_date: end_date || undefined,
        },
      }
    ),

  /**
   * GET /admin/cancellation-requests/:orderLineId
   */
  getById: (orderLineId: number) =>
    apiClient.get<SingleCancellationResponse>(
      `/admin/cancellation-requests/${orderLineId}`
    ),

  /**
   * POST /admin/cancellation-requests/:orderLineId/approve
   *
   * Payload:
   * {
   *   refund_amount: number,   // required
   *   amount?: number,         // optional (defaults to refund_amount)
   *   user_id?: number,        // optional (customer id)
   *   admin_notes?: string     // optional
   * }
   */
  approve: (
    orderLineId: number,
    payload: {
      refund_amount: number;
      admin_notes?: string;
    }
  ) =>
    apiClient.post<CancellationActionResponse>(
      `/admin/cancellation-requests/${orderLineId}/approve`,
      {
        refund_amount: payload.refund_amount,
        ...(payload.admin_notes?.trim() && {
          admin_notes: payload.admin_notes.trim(),
        }),
      }
    ),

  /**
   * POST /admin/cancellation-requests/:orderLineId/reject
   */
  reject: (
    orderLineId: number,
    rejection_reason: string,
    admin_notes?: string
  ) =>
    apiClient.post<CancellationActionResponse>(
      `/admin/cancellation-requests/${orderLineId}/reject`,
      {
        rejection_reason: rejection_reason.trim(),
        ...(admin_notes?.trim() && {
          admin_notes: admin_notes.trim(),
        }),
      }
    ),

  /**
   * POST /admin/cancellation-requests/:orderLineId/pay
   */
  pay: (orderLineId: number, amount: number) =>
    apiClient.post<CancellationActionResponse>(
      `/admin/cancellation-requests/${orderLineId}/pay`,
      { amount }
    ),
};

export default cancellationApi;