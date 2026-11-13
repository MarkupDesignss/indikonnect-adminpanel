import apiClient from "../client";

/**
 * India Post Admin APIs
 * Endpoints are relative to the apiClient base URL: /api
 *
 * IMPORTANT:
 * - Order 9 already has AWB ET214330033IN allocated. Do not reallocate it.
 * - Do not call allocateAwb automatically on page load.
 * - submitBooking is a real provider write. Use only with verified details and
 *   authorized UAT approval. Unknown results must be reconciled, never retried blindly.
 * - The Admin GET for allocated-but-not-booked AWB was not documented as implemented.
 *   getShipments returns linked shipments, NOT a proof of no prior AWB allocation.
 * - Write endpoints still expect internal numeric order_id. A public order_reference
 *   is resolved to orders.id in the admin UI before any write operation.
 */

export interface IndiaPostPackageDetails {
  warehouse_id: number;
  weight_grams: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  physical_stock_verified: boolean;
}

export interface IndiaPostBookingPreviewPayload extends IndiaPostPackageDetails {
  barcode_no: string;
}

export interface IndiaPostBookingSubmitPayload extends IndiaPostBookingPreviewPayload {
  confirm_authorized_uat_booking: true;
}

export interface IndiaPostApiResponse<T = unknown> {
  success?: boolean;
  status?: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export interface IndiaPostReadinessParams {
  warehouse_id: number;
  weight_grams: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
}

export interface IndiaPostOrderDetails {
  id?: number;
  order_reference?: string;
  [key: string]: unknown;
}

export interface IndiaPostAdminOrderRow {
  order: { id: number; order_reference: string; [key: string]: unknown };
}

export interface IndiaPostWarehouse {
  id: number;
  name?: string;
  title?: string;
  is_active?: boolean | number;
  [key: string]: unknown;
}

export interface IndiaPostShipment {
  barcode_no?: string;
  order_id?: number;
  booking_status?: string;
  latest_event?: string | null;
  latest_event_at?: string | null;
  [key: string]: unknown;
}

export interface IndiaPostTracking {
  order_id?: number;
  order_reference?: string;
  allocated_awb?: string | null;
  allocated_at?: string | null;
  shipments?: Array<{
    barcode: string;
    status: string;
    latest_event: string | null;
    latest_event_at: string | null;
    events: unknown[];
  }>;
  warning?: string | null;
  [key: string]: unknown;
}

const buildReadinessQuery = (params: IndiaPostReadinessParams) =>
  new URLSearchParams({
    warehouse_id: String(params.warehouse_id),
    weight_grams: String(params.weight_grams),
    length_cm: String(params.length_cm),
    width_cm: String(params.width_cm),
    height_cm: String(params.height_cm),
  }).toString();

export const indiaPostApi = {
  /**
   * GET /admin/all-orders?order_reference=...
   * Admin only. Backend must have the exact-match filter deployed.
   * Returns { success, data: [{ order: { id, order_reference, ... } }] }.
   */
  getOrdersByReference: (orderReference: string) =>
    apiClient.get<IndiaPostApiResponse<IndiaPostAdminOrderRow[]>>(
      "/admin/all-orders",
      {
        params: { order_reference: orderReference.trim() },
        headers: { Accept: "application/json" },
      },
    ),

  /** GET /admin/get-order-details/:orderId — requires internal ID. */
  getOrderDetails: (orderId: number | string) =>
    apiClient.get<IndiaPostApiResponse<IndiaPostOrderDetails>>(
      `/admin/get-order-details/${encodeURIComponent(String(orderId))}`,
      { headers: { Accept: "application/json" } },
    ),

  /** GET /warehouses — active ones are filtered by the component. */
  getWarehouses: () =>
    apiClient.get<IndiaPostApiResponse<IndiaPostWarehouse[]>>("/warehouses", {
      headers: { Accept: "application/json" },
    }),

  /** GET /orders/:orderId/indiapost/readiness — no provider write. */
  getReadiness: (orderId: number | string, params: IndiaPostReadinessParams) =>
    apiClient.get<IndiaPostApiResponse>(
      `/orders/${orderId}/indiapost/readiness?${buildReadinessQuery(params)}`,
      { headers: { Accept: "application/json" } },
    ),

  /** POST /orders/:orderId/indiapost/allocate-awb — explicit action only. */
  allocateAwb: (orderId: number | string, payload: IndiaPostPackageDetails) =>
    apiClient.post<IndiaPostApiResponse>(
      `/orders/${orderId}/indiapost/allocate-awb`,
      payload,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    ),

  /** POST /orders/:orderId/indiapost/booking/preview — no provider write. */
  bookingPreview: (
    orderId: number | string,
    payload: IndiaPostBookingPreviewPayload,
  ) =>
    apiClient.post<IndiaPostApiResponse>(
      `/orders/${orderId}/indiapost/booking/preview`,
      payload,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    ),

  /** POST /orders/:orderId/indiapost/booking/submit — REAL PROVIDER WRITE. */
  submitBooking: (
    orderId: number | string,
    payload: IndiaPostBookingSubmitPayload,
  ) =>
    apiClient.post<IndiaPostApiResponse>(
      `/orders/${orderId}/indiapost/booking/submit`,
      payload,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    ),

  /** GET /orders/:orderId/indiapost/shipments — linked shipments only. */
  getShipments: (orderId: number | string) =>
    apiClient.get<IndiaPostApiResponse<IndiaPostShipment[]>>(
      `/orders/${orderId}/indiapost/shipments`,
      { headers: { Accept: "application/json" } },
    ),

  /** POST /orders/:orderId/indiapost/sync — admin-initiated provider refresh. */
  syncTracking: (orderId: number | string) =>
    apiClient.post<IndiaPostApiResponse>(
      `/orders/${orderId}/indiapost/sync`,
      undefined,
      { headers: { Accept: "application/json" } },
    ),

  /** Existing customer route, retained for backward compatibility. */
  getCustomerTracking: (orderId: number | string) =>
    apiClient.get<IndiaPostApiResponse<IndiaPostTracking>>(
      `/orders/${orderId}/indiapost/tracking`,
      { headers: { Accept: "application/json" } },
    ),

  /**
   * NEW customer route: GET /orders/by-reference/:orderReference/indiapost/tracking
   * Requires Laravel showByReference() and customer-authenticated route.
   * Do NOT use from the admin panel with an admin-only token.
   */
  getCustomerTrackingByReference: (orderReference: string) =>
    apiClient.get<IndiaPostApiResponse<IndiaPostTracking>>(
      `/orders/by-reference/${encodeURIComponent(orderReference.trim())}/indiapost/tracking`,
      { headers: { Accept: "application/json" } },
    ),
};

export default indiaPostApi;
