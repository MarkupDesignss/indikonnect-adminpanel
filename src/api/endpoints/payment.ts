
import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface Payout {
  id: number;
  period: string;
  status: "pending" | "released" | string;
  total_gross: string | number;
  total_tds: string | number;
  total_net: string | number;
  released_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  creator?: any;
}

export interface PayoutsResponse {
  success: boolean;
  message?: string;
  data: Payout[];
}

export interface PayoutActionResponse {
  success: boolean;
  message: string;
  data?: any;
}

// =====================================================
// PAYOUT API
// =====================================================

export const payoutApi = {
  /**
   * GET /api/admin/payouts
   * Get all payout cycles
   */
  getAll: () =>
    apiClient.get<PayoutsResponse>(
      "/admin/payouts"
    ),

  /**
   * POST /api/admin/payouts
   * Create payout cycle
   *
   * Payload:
   * {
   *   period: "2026-07"
   * }
   */
  create: (period: string) =>
    apiClient.post<PayoutActionResponse>(
      "/admin/payouts",
      {
        period,
      }
    ),

  /**
   * POST /api/admin/payouts/:id/release
   * Release payout
   */
  release: (id: number) =>
    apiClient.post<PayoutActionResponse>(
      `/admin/payouts/${id}/release`
    ),

  /**
   * POST /api/admin/payouts/entries/:entryId/hold
   * Hold payout entry
   */
  holdEntry: (entryId: number) =>
    apiClient.post<PayoutActionResponse>(
      `/admin/payouts/entries/${entryId}/hold`
    ),

  /**
   * GET /api/admin/payouts/:id/export
   * Export payout
   *
   * responseType blob is required
   */
  export: (id: number) =>
    apiClient.get(
      `/admin/payouts/${id}/export`,
      {
        responseType: "blob",
      }
    ),

  /**
   * POST /api/admin/payouts/:id/notify
   * Send payout notification
   */
  notify: (id: number) =>
    apiClient.post<PayoutActionResponse>(
      `/admin/payouts/${id}/notify`
    ),
};

export default payoutApi;
