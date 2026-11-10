import apiClient from "../client";

/**
 * India Post Admin APIs
 *
 * Endpoints are relative to the apiClient base URL:
 * /api
 *
 * IMPORTANT:
 * - Order 9 already has AWB ET214330033IN allocated. Do not reallocate it.
 * - Do not call allocateAwb automatically on page load.
 * - submitBooking is a real provider write. Call it only after real sender/
 *   recipient data are verified, the AWB is confirmed unused, and UAT booking
 *   approval has been received.
 * - The collection notes that an Admin GET endpoint for reloading allocated
 *   AWB is not implemented yet. Use getShipments to retrieve linked shipments.
 */

export interface IndiaPostPackageDetails {
  warehouse_id: number;
  weight_grams: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  physical_stock_verified: boolean;
}

export interface IndiaPostBookingPreviewPayload
  extends IndiaPostPackageDetails {
  barcode_no: string;
}

export interface IndiaPostBookingSubmitPayload
  extends IndiaPostBookingPreviewPayload {
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
  [key: string]: unknown;
}

export interface IndiaPostWarehouse {
  id: number;
  name?: string;
  title?: string;
  is_active?: boolean | number;
  [key: string]: unknown;
}

export interface IndiaPostShipment {
  [key: string]: unknown;
}

export interface IndiaPostTracking {
  [key: string]: unknown;
}

const buildReadinessQuery = (params: IndiaPostReadinessParams) => {
  const query = new URLSearchParams({
    warehouse_id: String(params.warehouse_id),
    weight_grams: String(params.weight_grams),
    length_cm: String(params.length_cm),
    width_cm: String(params.width_cm),
    height_cm: String(params.height_cm),
  });

  return query.toString();
};

export const indiaPostApi = {
  /**
   * GET /admin/get-order-details/:orderId
   * Admin order header and address details.
   */
  getOrderDetails: (orderId: number | string) =>
    apiClient.get<IndiaPostApiResponse<IndiaPostOrderDetails>>(
      `/admin/get-order-details/${orderId}`,
      {
        headers: { Accept: "application/json" },
      }
    ),

  /**
   * GET /warehouses
   * Fetch warehouses for the warehouse dropdown.
   * Filter is_active in the UI if required.
   */
  getWarehouses: () =>
    apiClient.get<IndiaPostApiResponse<IndiaPostWarehouse[]>>(
      "/warehouses",
      {
        headers: { Accept: "application/json" },
      }
    ),

  /**
   * GET /orders/:orderId/indiapost/readiness
   * Safe readiness check; does not allocate an AWB or submit a booking.
   */
  getReadiness: (
    orderId: number | string,
    params: IndiaPostReadinessParams
  ) =>
    apiClient.get<IndiaPostApiResponse>(
      `/orders/${orderId}/indiapost/readiness?${buildReadinessQuery(params)}`,
      {
        headers: { Accept: "application/json" },
      }
    ),

  /**
   * POST /orders/:orderId/indiapost/allocate-awb
   *
   * Explicit action only. Never call on page load.
   * Do not call for Order 9 because its AWB is already allocated.
   */
  allocateAwb: (
    orderId: number | string,
    payload: IndiaPostPackageDetails
  ) =>
    apiClient.post<IndiaPostApiResponse>(
      `/orders/${orderId}/indiapost/allocate-awb`,
      payload,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    ),

  /**
   * POST /orders/:orderId/indiapost/booking/preview
   * Safe preview; does not submit the booking to the provider.
   */
  bookingPreview: (
    orderId: number | string,
    payload: IndiaPostBookingPreviewPayload
  ) =>
    apiClient.post<IndiaPostApiResponse>(
      `/orders/${orderId}/indiapost/booking/preview`,
      payload,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    ),

  /**
   * POST /orders/:orderId/indiapost/booking/submit
   *
   * REAL PROVIDER WRITE — call only after all required verification and
   * authorized UAT approval. Never invoke automatically.
   */
  submitBooking: (
    orderId: number | string,
    payload: IndiaPostBookingSubmitPayload
  ) =>
    apiClient.post<IndiaPostApiResponse>(
      `/orders/${orderId}/indiapost/booking/submit`,
      payload,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    ),

  /**
   * GET /orders/:orderId/indiapost/shipments
   * Fetch shipments linked to the order.
   */
  getShipments: (orderId: number | string) =>
    apiClient.get<IndiaPostApiResponse<IndiaPostShipment[]>>(
      `/orders/${orderId}/indiapost/shipments`,
      {
        headers: { Accept: "application/json" },
      }
    ),

  /**
   * POST /orders/:orderId/indiapost/sync
   * Manually sync provider tracking for the order.
   */
  syncTracking: (orderId: number | string) =>
    apiClient.post<IndiaPostApiResponse>(
      `/orders/${orderId}/indiapost/sync`,
      undefined,
      {
        headers: { Accept: "application/json" },
      }
    ),

  /**
   * GET /orders/:orderId/indiapost/tracking
   * Customer-authenticated order tracking endpoint.
   */
  getCustomerTracking: (orderId: number | string) =>
    apiClient.get<IndiaPostApiResponse<IndiaPostTracking>>(
      `/orders/${orderId}/indiapost/tracking`,
      {
        headers: { Accept: "application/json" },
      }
    ),
};

export default indiaPostApi;
