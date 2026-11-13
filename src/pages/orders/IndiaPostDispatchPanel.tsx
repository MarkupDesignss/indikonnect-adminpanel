"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBox,
  FiCheckCircle,
  FiChevronDown,
  FiLoader,
  FiMapPin,
  FiRefreshCw,
  FiTruck,
  FiUser,
} from "react-icons/fi";
import toast from "react-hot-toast";
import indiaPostApi from "../../api/endpoints/indiaPostApi";
import type {
  IndiaPostAdminOrderRow,
  IndiaPostPackageDetails,
  IndiaPostShipment,
  IndiaPostWarehouse,
} from "../../api/endpoints/indiaPostApi";
/**
 *  Mount this inside the admin order page or on a standalone route.
 *  Example route: /indiekonnect-admin/indiapost-dispatch/:orderReference
 *
 *  Auth is handled by apiClient (Bearer token injected automatically).
 *  Never expose x-internal-api-key or India Post credentials in the browser.
 */
export interface IndiaPostDispatchPanelProps {
  /** Existing internal numeric order ID; optional when orderReference is provided. */
  orderId?: number;
  /** Public order reference used for display and resolving the verified internal ID. */
  orderReference?: string;
  /** Optional callback when user clicks back. */
  onBack?: () => void;
}
type Fields = {
  warehouse_id: string;
  weight_grams: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
};
const fieldNames: Record<keyof Fields, string> = {
  warehouse_id: "Warehouse",
  weight_grams: "Packed weight (grams)",
  length_cm: "Length (cm)",
  width_cm: "Width (cm)",
  height_cm: "Height (cm)",
};
const extractErrorMessage = (err: unknown, fallback = "Request failed"): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  const anyErr = err as any;
  return (
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    anyErr?.message ||
    fallback
  );
};
/**
 *  Unwraps ONE envelope layer: { data: X } -> X, or axios { data: { data: X } } -> X
 */
const extractData = <T,>(response: any): T | null => {
  if (response == null) return null;
// Axios envelope: response.data is the JSON body
  const body =
    response && typeof response === "object" && "data" in response && "status" in response
      ? response.data
      : response;
  if (body == null) return null;
  if (typeof body === "object" && "data" in body) return (body as any).data as T;
  return body as T;
};
/**
 *  Recursively extracts the "list" out of a paginated / wrapped payload.
 *  Handles:
 *    - [a, b, c]                               (raw array)
 *    - { data: [a, b, c] }                     (Laravel envelope)
 *    - { data: { data: [a, b, c] } }           (paginated inside data)
 *    - { data: { data: { data: [a, b, c] } } } (double envelope)
 *    - { shipments: [a, b, c] }                (named list)
 *    - axios { data: { success, data: {...} } }
 *  Returns [] if no array is found.
 */
const extractList = <T,>(response: any, namedKey?: string): T[] => {
  if (response == null) return [];
// Axios envelope — drop one layer
  const rawBody =
    response && typeof response === "object" && "data" in response && "status" in response
      ? response.data
      : response;
  const seen = new Set<any>();
  const queue: any[] = [rawBody];
  while (queue.length) {
    const node = queue.shift();
    if (node == null || seen.has(node)) continue;
    if (typeof node !== "object") continue;
    seen.add(node);
// raw array
    if (Array.isArray(node)) return node as T[];
// preferred named list
    if (namedKey && Array.isArray((node as any)[namedKey])) {
      return (node as any)[namedKey] as T[];
    }
// generic "data" -> push next
    if ("data" in (node as any)) queue.push((node as any).data);
// named key fallback
    if (namedKey && namedKey in (node as any)) queue.push((node as any)[namedKey]);
// named "items"/"results"/"records" common for pagination wrappers
    for (const key of ["items", "results", "records"]) {
      if (Array.isArray((node as any)[key])) return (node as any)[key] as T[];
    }
  }
  return [];
};
export default function IndiaPostDispatchPanel({
  orderId: inputOrderId,
  orderReference,
  onBack,
}: IndiaPostDispatchPanelProps) {
  // Resolve a reference to the real orders.id before using existing admin APIs.
  // Never pass an order_reference directly into numeric AWB/booking routes.
  const normalizedReference = (orderReference ?? "").trim();
  const hasNumericOrderId = Number.isSafeInteger(inputOrderId) && Number(inputOrderId) > 0;
  const [resolved, setResolved] = useState<{ reference: string; id: number } | null>(null);
  const [resolvingReference, setResolvingReference] = useState(false);
  const [referenceLookupError, setReferenceLookupError] = useState("");
  const orderId = hasNumericOrderId
    ? Number(inputOrderId)
    : resolved?.reference === normalizedReference
      ? resolved.id
      : 0;
  // Ignore late responses when the panel switches to another order.
  const currentOrderIdRef = useRef(orderId);
  currentOrderIdRef.current = orderId;

  // ----- form state -----
  const [fields, setFields] = useState<Fields>({
    warehouse_id: "",
    weight_grams: "",
    length_cm: "",
    width_cm: "",
    height_cm: "",
  });
  const [stockVerified, setStockVerified] = useState(false);
// ----- result state -----
  const [awb, setAwb] = useState("");
  const [readiness, setReadiness] = useState<Record<string, any> | null>(null);
  const [preview, setPreview] = useState<Record<string, any> | null>(null);
  const [shipments, setShipments] = useState<IndiaPostShipment[]>([]);
  const [booked, setBooked] = useState(false);
  const [bookingAttempted, setBookingAttempted] = useState(false);
  // An actual provider write is permitted only after explicit operator confirmation.
  const [uatBookingAuthorized, setUatBookingAuthorized] = useState(false);
  // Shipment-list emptiness cannot prove no AWB has already been allocated.
  const [noPreviousAwbVerified, setNoPreviousAwbVerified] = useState(false);
// ----- ui state -----
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
// ----- data from API -----
  const [warehouses, setWarehouses] = useState<IndiaPostWarehouse[]>([]);
  const [orderDetails, setOrderDetails] = useState<Record<string, any> | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderDetailsForId, setOrderDetailsForId] = useState<number | null>(null);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [shipmentsReadOk, setShipmentsReadOk] = useState(false);
  const validOrder = Number.isSafeInteger(orderId) && orderId > 0;
  const verifiedOrderReference =
    !normalizedReference ||
    (typeof orderDetails?.order_reference === "string" &&
      orderDetails.order_reference.trim() === normalizedReference);
  const orderIdentityVerified =
    validOrder && orderDetailsForId === orderId && !!orderDetails && verifiedOrderReference;
  const hasLinkedShipmentAwb = shipments.some((s) =>
    /^[A-Z]{2}[0-9]{9}IN$/.test(String(s.barcode_no ?? "").toUpperCase()),
  );
  const knownAllocatedOrder = orderId === 9; // Order 9: ET214330033IN allocated already.

  // Reference-only entry point: GET /admin/all-orders?order_reference=...
  // Resolve and validate the server's result; never guess an ID or use an array index.
  useEffect(() => {
    if (hasNumericOrderId) {
      setResolvingReference(false);
      setReferenceLookupError("");
      return;
    }
    if (!normalizedReference) {
      setReferenceLookupError("An order ID or Order Reference is required.");
      return;
    }
    let active = true;
    setResolvingReference(true);
    setReferenceLookupError("");
    const resolve = async () => {
      try {
        const response = await indiaPostApi.getOrdersByReference(normalizedReference);
        const list = extractList<IndiaPostAdminOrderRow>(response);
        const matching = list.filter((row) =>
          row?.order?.order_reference === normalizedReference &&
          Number.isSafeInteger(Number(row?.order?.id)) && Number(row.order.id) > 0,
        );
        if (matching.length !== 1) {
          throw new Error(matching.length > 1
            ? "Multiple orders have this reference; cannot safely select a shipment."
            : "No order found for this Order Reference.");
        }
        if (active) setResolved({ reference: normalizedReference, id: Number(matching[0].order.id) });
      } catch (err) {
        if (active) {
          setResolved(null);
          setReferenceLookupError(extractErrorMessage(err, "Cannot resolve this order reference."));
        }
      } finally {
        if (active) setResolvingReference(false);
      }
    };
    void resolve();
    return () => { active = false; };
  }, [hasNumericOrderId, normalizedReference]);
  const payload: IndiaPostPackageDetails = useMemo(
    () => ({
      warehouse_id: Number(fields.warehouse_id),
      weight_grams: Number(fields.weight_grams),
      length_cm: Number(fields.length_cm),
      width_cm: Number(fields.width_cm),
      height_cm: Number(fields.height_cm),
      physical_stock_verified: stockVerified,
    }),
    [fields, stockVerified],
  );
// ---------- initial data loads ----------
  const loadOrderDetails = useCallback(async () => {
    if (!validOrder) return;
    setOrderLoading(true);
    setOrderDetailsForId(null);
    try {
      const response = await indiaPostApi.getOrderDetails(orderId);
      if (currentOrderIdRef.current !== orderId) return;
      const data = extractData<Record<string, any>>(response);
      // Validate the actual server response, not just the requested URL.
      if (
        !data ||
        Number(data.id) !== orderId ||
        (normalizedReference && data.order_reference !== normalizedReference)
      ) {
        throw new Error("Order ID and Order Reference could not be verified.");
      }
      setOrderDetails(data);
      setOrderDetailsForId(orderId);
    } catch (err) {
      if (currentOrderIdRef.current !== orderId) return;
      console.error("loadOrderDetails error:", err);
      setOrderDetailsForId(null);
      setOrderDetails(null);
      setError(extractErrorMessage(err, "Failed to load order details"));
    } finally {
      if (currentOrderIdRef.current === orderId) setOrderLoading(false);
    }
  }, [orderId, validOrder, normalizedReference]);
  const loadWarehouses = useCallback(async () => {
    setWarehousesLoading(true);
    try {
      const response = await indiaPostApi.getWarehouses();
// ✅ Handles paginated { data: { data: [...] } }, envelope { data: [...] }, or raw array
      const list = extractList<IndiaPostWarehouse>(response);
// Filter active warehouses (treat undefined as active)
      const active = list.filter((w) => {
        if (w == null) return false;
        const flag = (w as any).is_active;
        if (flag === undefined || flag === null) return true;
        return flag === true || flag === 1 || flag === "1";
      });
// Sort: default first, then by name
      active.sort((a, b) => {
        const aDefault = (a as any).is_default ? 1 : 0;
        const bDefault = (b as any).is_default ? 1 : 0;
        if (aDefault !== bDefault) return bDefault - aDefault;
        return String(a.name || a.title || "").localeCompare(String(b.name || b.title || ""));
      });
      setWarehouses(active);
      if (active.length === 0) {
        setNotice("No active warehouses found. Create one first or activate an existing one.");
      }
    } catch (err) {
      console.error("loadWarehouses error:", err);
      setError(extractErrorMessage(err, "Failed to load warehouses"));
    } finally {
      setWarehousesLoading(false);
    }
  }, []);
  const loadShipments = useCallback(async () => {
    if (!validOrder) return;
    setShipmentsLoading(true);
    try {
      const response = await indiaPostApi.getShipments(orderId);
      if (currentOrderIdRef.current !== orderId) return;
      if (response?.data?.success === false) {
        throw new Error(response.data.message || "Could not verify shipments for this order.");
      }
      const list = extractList<IndiaPostShipment>(response, "shipments");
      // A mislinked shipment must never authorize another AWB allocation.
      if (list.some((s) => s?.order_id != null && Number(s.order_id) !== orderId)) {
        throw new Error("Shipment-to-order mismatch. Manual reconciliation required.");
      }
      setShipmentsReadOk(true);
      setShipments(list);
      const firstAwb = list.find((s) => s?.barcode_no)?.barcode_no ?? null;
      if (firstAwb) setAwb((current) => current || String(firstAwb));
    } catch (err) {
      // Shipment-list errors block new allocation; existing records remain untouched.
      if (currentOrderIdRef.current !== orderId) return;
      console.warn("loadShipments warn:", err);
      setShipmentsReadOk(false);
    } finally {
      if (currentOrderIdRef.current === orderId) setShipmentsLoading(false);
    }
  }, [orderId, validOrder]);
  useEffect(() => {
    // Clear data when changing orders so a previous AWB cannot appear on another order.
    setAwb("");
    setReadiness(null);
    setPreview(null);
    setShipments([]);
    setShipmentsReadOk(false);
    setOrderDetails(null);
    setOrderDetailsForId(null);
    setNoPreviousAwbVerified(false);
    setBooked(false);
    setBookingAttempted(false);
    setUatBookingAuthorized(false);
    setError("");
    setNotice("");
    if (validOrder) {
      void loadOrderDetails();
      void loadWarehouses();
      void loadShipments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);
// ---------- helpers ----------
  const run = async (label: string, action: () => Promise<void>) => {
    setError("");
    setNotice("");
    setBusy(label);
    try {
      await action();
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy("");
    }
  };
  const check = () =>
    run("readiness", async () => {
      if (!orderIdentityVerified) throw new Error("Verify this Order Reference before proceeding.");
      const response = await indiaPostApi.getReadiness(orderId, {
        warehouse_id: payload.warehouse_id,
        weight_grams: payload.weight_grams,
        length_cm: payload.length_cm,
        width_cm: payload.width_cm,
        height_cm: payload.height_cm,
      });
      const data = extractData<Record<string, any>>(response) ?? null;
      setReadiness(data);
      setPreview(null);
      setNotice(
        data?.ready_for_preview
          ? "Ready for AWB allocation/preview."
          : "Resolve listed blockers before booking.",
      );
    });
  const allocate = () =>
    run("allocate", async () => {
      if (!orderIdentityVerified) throw new Error("Order identity is not verified.");
      if (knownAllocatedOrder || hasLinkedShipmentAwb || awb) {
        throw new Error("An AWB is already known for this order. Do not allocate another one.");
      }
      if (!noPreviousAwbVerified || shipmentsLoading || !shipmentsReadOk) {
        throw new Error("Verify that no AWB is already allocated before proceeding.");
      }
      if (!window.confirm(`Allocate a new AWB for ${normalizedReference || `Order #${orderId}`}? Confirm no AWB exists already.`)) return;
      const response = await indiaPostApi.allocateAwb(orderId, payload);
      const data = extractData<Record<string, any>>(response) ?? {};
      const allocated = String(data?.awb ?? data?.barcode_no ?? "").trim().toUpperCase();
      if (!/^[A-Z]{2}[0-9]{9}IN$/.test(allocated)) {
        // Unknown allocation outcome MUST be reconciled, never blindly retried.
        setNoPreviousAwbVerified(false);
        throw new Error("AWB allocation response is unclear. Reconcile before retrying.");
      }
      setAwb(allocated);
      setNoPreviousAwbVerified(false);
      setBooked(false);
      setBookingAttempted(false);
      setPreview(null);
      setNotice("AWB allocated to this order; NOT YET booked with India Post.");
      toast.success("AWB allocated");
    });
  const doPreview = () =>
    run("preview", async () => {
      if (!orderIdentityVerified) throw new Error("Order identity is not verified.");
      const response = await indiaPostApi.bookingPreview(orderId, {
        ...payload,
        barcode_no: awb,
      });
      const data = extractData<Record<string, any>>(response) ?? null;
      setPreview(data);
      setNotice(
        "Preview passed. Check real package, address and courier details before submission.",
      );
    });
  const submit = () => {
    if (
      !orderIdentityVerified ||
      !uatBookingAuthorized ||
      !preview?.ready_for_booking ||
      !awb ||
      bookingAttempted ||
      !!busy
    ) {
      setError("Verify order, UAT authorization, AWB and booking preview before submitting.");
      return;
    }
    if (
      !window.confirm(
        `Submit India Post UAT booking for order ${orderReference || orderId}, AWB ${awb}? This can use a barcode permanently and cannot be blindly retried.`,
      )
    )
      return;
    setBookingAttempted(true);
    void run("booking", async () => {
      const response = await indiaPostApi.submitBooking(orderId, {
        ...payload,
        barcode_no: awb,
        confirm_authorized_uat_booking: true,
      });
      const data = extractData<Record<string, any>>(response) ?? {};
      setBooked(true);
      setNotice(
        `Submitted: ${String(data?.awb ?? awb)}. Physical courier pickup NOT yet confirmed.`,
      );
      toast.success("UAT booking submitted");
    });
  };
  const refresh = () =>
    run("sync", async () => {
      if (!orderIdentityVerified) throw new Error("Verify this Order Reference before syncing.");
      await indiaPostApi.syncTracking(orderId);
      const shipmentsResponse = await indiaPostApi.getShipments(orderId);
      const list = extractList<IndiaPostShipment>(shipmentsResponse, "shipments");
      setShipments(list);
      const firstAwb = list.find((s: any) => s?.barcode_no)?.barcode_no;
      if (firstAwb) setAwb((current) => current || String(firstAwb));
      setNotice("Tracking synced.");
    });
// ---------- guard: no valid order ----------
  if (!validOrder) {
    return (
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-slate-800">
        <p className="font-semibold">
          {resolvingReference ? "Finding order by reference…" : "Order not found"}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {resolvingReference
            ? `Checking ${normalizedReference}`
            : referenceLookupError || "Provide a valid numeric orderId or orderReference."}
        </p>
      </section>
    );
  }
// ---------- derived display ----------
  const addr = orderDetails?.delivery_address || orderDetails?.shipping_address;
  const customer = orderDetails?.user;
  return (
    <section className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2D6FE8]/15 bg-[#F4F8FD] text-[#2D6FE8] transition hover:bg-[#EAF3FF]"
              title="Back"
            >
              <FiArrowLeft size={17} />
            </button>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2D6FE8]">
              India Post Dispatch
            </p>
            <h1 className="text-lg font-bold text-[#111827]">
              {normalizedReference || orderDetails?.order_reference || `Order #${orderId}`}
            </h1>
            <p className="text-xs text-[#6B7280]">
              Warehouse → Readiness → AWB → Preview → UAT Booking → Tracking
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadOrderDetails();
            void loadWarehouses();
            void loadShipments();
          }}
          disabled={orderLoading || warehousesLoading || shipmentsLoading}
          className="flex h-10 items-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-[#F4F8FD] px-3 text-xs font-semibold text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:opacity-50"
        >
          <FiRefreshCw
            size={14}
            className={
              orderLoading || warehousesLoading || shipmentsLoading
                ? "animate-spin"
                : ""
            }
          />
          Refresh
        </button>
      </div>
      {orderDetailsForId === orderId && !verifiedOrderReference && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Order Reference mismatch: API returned {String(orderDetails?.order_reference ?? "missing")}.
          Actions are blocked to prevent changes to the wrong order.
        </p>
      )}

      {/* Order info card */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
              <FiUser size={15} />
            </div>
            <h3 className="text-sm font-bold text-[#111827]">Customer</h3>
          </div>
          {orderLoading ? (
            <p className="text-xs text-[#6B7280]">Loading…</p>
          ) : customer ? (
            <div className="space-y-1.5 text-xs text-[#111827]">
              <p>
                <span className="text-[#6B7280]">Name: </span>
                <span className="font-semibold">{customer.name || "N/A"}</span>
              </p>
              <p>
                <span className="text-[#6B7280]">Phone: </span>
                <span className="font-semibold">{customer.phone || "N/A"}</span>
              </p>
              <p>
                <span className="text-[#6B7280]">Email: </span>
                <span className="font-semibold">{customer.email || "N/A"}</span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#6B7280]">No customer info.</p>
          )}
        </div>
        <div className="rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
              <FiMapPin size={15} />
            </div>
            <h3 className="text-sm font-bold text-[#111827]">Ship to</h3>
          </div>
          {orderLoading ? (
            <p className="text-xs text-[#6B7280]">Loading…</p>
          ) : addr ? (
            <p className="text-xs leading-5 text-[#111827]">
              {addr.full_address ||
                [
                  addr.address_line_1,
                  addr.address_line_2,
                  addr.city,
                  addr.state,
                  addr.postal_code || addr.pincode,
                  addr.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
            </p>
          ) : (
            <p className="text-xs text-[#6B7280]">No address.</p>
          )}
        </div>
      </div>
      {/* Package form */}
      <div className="rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
            <FiBox size={15} />
          </div>
          <h3 className="text-sm font-bold text-[#111827]">Package details</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Warehouse dropdown */}
          <label className="text-xs font-medium text-slate-600">
            Warehouse
            <div className="relative mt-1">
              <select
                value={fields.warehouse_id}
                onChange={(e) => {
                  setFields((v) => ({ ...v, warehouse_id: e.target.value }));
                  setPreview(null);
                  setUatBookingAuthorized(false);
                }}
                disabled={warehousesLoading || !!busy}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white p-2.5 pr-9 text-sm outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50"
              >
                <option value="">
                  {warehousesLoading
                    ? "Loading warehouses…"
                    : warehouses.length === 0
                      ? "No warehouses available"
                      : "Select warehouse"}
                </option>
                {warehouses.map((w) => {
                  const id = (w as any).id;
                  const name = w.name || w.title || `Warehouse #${id}`;
                  const code = (w as any).code;
                  return (
                    <option key={String(id)} value={String(id)}>
                      {code ? `${name} (${code})` : name}
                    </option>
                  );
                })}
              </select>
              <FiChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
            {!warehousesLoading && warehouses.length === 0 && (
              <p className="mt-1 text-[10px] text-red-600">
                No active warehouses returned by the API. Check warehouse setup.
              </p>
            )}
          </label>
          {(["weight_grams", "length_cm", "width_cm", "height_cm"] as const).map(
            (key) => (
              <label key={key} className="text-xs font-medium text-slate-600">
                {fieldNames[key]}
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                  value={fields[key]}
                  type="number"
                  min={key === "weight_grams" ? "1" : "0"}
                  step={key === "weight_grams" ? "1" : "0.1"}
                  onChange={(e) => {
                    setFields((v) => ({ ...v, [key]: e.target.value }));
                    setPreview(null);
                    setUatBookingAuthorized(false);
                  }}
                  disabled={!!busy}
                  placeholder={`Enter ${fieldNames[key].toLowerCase()}`}
                />
              </label>
            ),
          )}
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={stockVerified}
            onChange={(e) => {
            setStockVerified(e.target.checked);
            setPreview(null);
            setUatBookingAuthorized(false);
          }}
            disabled={!!busy}
          />
          <span>
            I have physically checked/reserved this product stock at the selected
            warehouse.
          </span>
        </label>
      </div>
      <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <input
          type="checkbox"
          checked={noPreviousAwbVerified}
          onChange={(e) => setNoPreviousAwbVerified(e.target.checked)}
          disabled={!!busy || !orderIdentityVerified || !shipmentsReadOk || hasLinkedShipmentAwb || !!awb || knownAllocatedOrder}
          className="mt-0.5"
        />
        <span>
          Before allocating: I have independently confirmed that this order has no existing allocated AWB.
          An empty shipment list does not prove an AWB was never allocated.
          {knownAllocatedOrder ? " Order 9 already has AWB ET214330033IN." : ""}
        </span>
      </label>

      <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        <input
          type="checkbox"
          checked={uatBookingAuthorized}
          onChange={(e) => setUatBookingAuthorized(e.target.checked)}
          disabled={!!busy || !orderIdentityVerified || bookingAttempted}
          className="mt-0.5"
        />
        <span>
          For booking submission only: I confirm authorized UAT booking approval has been
          received, the actual sender/recipient and package details are verified,
          and this AWB has been confirmed unused for provider booking.
        </span>
      </label>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!busy || !orderIdentityVerified}
          onClick={check}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
        >
          1. Check Readiness
        </button>
        <button
          type="button"
          disabled={
            !!busy || !orderIdentityVerified || shipmentsLoading || !shipmentsReadOk ||
          !noPreviousAwbVerified || knownAllocatedOrder || hasLinkedShipmentAwb ||
          !readiness?.ready_for_preview || !!awb || !fields.warehouse_id
          }
          onClick={allocate}
          className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          2. Allocate AWB
        </button>
        <button
          type="button"
          disabled={!!busy || !orderIdentityVerified || !awb || bookingAttempted}
          onClick={doPreview}
          className="rounded-lg border border-indigo-400 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-40"
        >
          3. Preview Booking
        </button>
        <button
          type="button"
          disabled={
            !!busy || !orderIdentityVerified || !preview?.ready_for_booking ||
            bookingAttempted || !awb || !uatBookingAuthorized
          }
          onClick={submit}
          className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          4. Submit UAT Booking
        </button>
        <button
          type="button"
          disabled={!!busy || !orderIdentityVerified}
          onClick={refresh}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
        >
          5. Refresh Tracking
        </button>
      </div>
      {/* Status messages */}
      {busy && (
        <p role="status" className="flex items-center gap-2 text-sm text-indigo-700">
          <FiLoader size={14} className="animate-spin" /> Processing {busy}…
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <FiAlertCircle className="mr-1.5 inline" size={14} />
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">{notice}</p>
      )}
      {awb && (
        <p className="text-sm">
          Allocated AWB:{" "}
          <strong className="font-mono">{awb}</strong>
          {booked ? " · submitted" : " · not booked"}
        </p>
      )}
      {/* Readiness */}
      {readiness && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <p className="font-semibold">
            <FiCheckCircle className="mr-1.5 inline" size={14} />
            Readiness: {readiness.ready_for_preview ? "Passed" : "Blocked"}
          </p>
          {Array.isArray(readiness.blockers) && readiness.blockers.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-red-700">
              {readiness.blockers.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
          {Array.isArray(readiness.warnings) && readiness.warnings.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-700">
              {readiness.warnings.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {/* Shipments */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
        <p className="mb-2 flex items-center gap-2 font-semibold">
          <FiTruck size={14} /> Live shipment records
        </p>
        {shipmentsLoading ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : shipments.length ? (
          <div className="space-y-1.5">
            {shipments.map((s: any, idx) => (
              <p key={s.barcode_no || idx} className="text-xs">
                <span className="font-mono">{s.barcode_no || "—"}</span>:{" "}
                <strong>{s.booking_status || s.status || "unknown"}</strong>
                {s.latest_event ? ` · ${s.latest_event}` : ""}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No booked shipment yet.</p>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Booking submission does not prove physical pickup/delivery. India Post
        scans are authoritative. Never retry an unknown booking without
        reconciliation.
      </p>
    </section>
  );
}
