
import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface PaymentRecord {
  order_reference: string;
  gateway_transaction_id: string;
  amount_paid: string;
  status:
    | "pending"
    | "confirmed"
    | "delivered"
    | "returned"
    | "partial_returned"
    | "partial_delivered"
    | string;
  payment_gateway: string;
  created_at: string;
}

export interface PaymentManagementResponse {
  success: boolean;
  message?: string;
  data: PaymentRecord[];
}

export interface PaymentActionResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// =====================================================
// API
// =====================================================

export const paymentManagementApi = {
  /**
   * GET /payment-management
   *
   * Get all payment records
   */
  getAll: () =>
    apiClient.get<PaymentManagementResponse>(
      "/payment-management"
    ),
};

export default paymentManagementApi;

