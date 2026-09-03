import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface CreditNoteItem {
  order_line_id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number | string;
  taxable_value: number | string;
  gst_rate: number | string;
  cgst: number | string;
  sgst: number | string;
  igst: number | string;
  line_total: number | string;
}

export interface CreditNoteOrder {
  id: number;
  order_reference: string;
  user_id: number;
  order_type: string;
  subtotal: string | number;
  total_gst: string | number;
  total_cgst: string | number;
  total_sgst: string | number;
  total_igst: string | number;
  shipping_charge: string | number;
  coin_redeemed: string | number;
  coin_redeemed_amount: string | number;
  total_payable: string | number;
  amount_paid: string | number;
  status: string;
  delivery_status: string;
  return_status: string;
  refund_status: string | null;
  payment_gateway: string | null;
  gateway_transaction_id: string | null;
  coupon_discount: string | number;
  coupon_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditNoteRefund {
  id: number;
  order_id: number;
  return_id: number;
  amount: string | number;
  gateway_reference: string | null;
  status: string;
  completed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditNote {
  id: number;
  credit_note_number: string;
  order_id: number;
  original_invoice_number: string;
  refund_id: number;
  buyer_name: string;
  buyer_email: string;
  buyer_address: string | null;
  buyer_state: string | null;
  buyer_gstin: string | null;
  amount: string | number;
  taxable_value: string | number;
  cgst_amount: string | number;
  sgst_amount: string | number;
  igst_amount: string | number;
  total_gst: string | number;
  items: CreditNoteItem[];
  buyer_type: string;
  reason: string;
  issued_at: string;
  created_at: string;
  updated_at: string;
  order?: CreditNoteOrder | null;
  refund?: CreditNoteRefund | null;
}

export interface CreditNotesPagination {
  current_page: number;
  data: CreditNote[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  next_page_url: string | null;
  prev_page_url: string | null;
  per_page: number;
  to: number | null;
  total: number;
}

export interface CreditNotesResponse {
  success: boolean;
  message?: string;
  data: CreditNotesPagination;
}

// =====================================================
// API
// =====================================================

const creditNotesApi = {
  // GET /api/admin/credit-notes
  getAll: (page?: number) =>
    apiClient.get<CreditNotesResponse>(
      "/admin/credit-notes",
      {
        params: page
          ? {
              page,
            }
          : undefined,
      }
    ),
};

export default creditNotesApi;