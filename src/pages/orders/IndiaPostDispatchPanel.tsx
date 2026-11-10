"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBox,
  FiCheckCircle,
  FiChevronDown,
  FiLoader,
  FiMapPin,
  FiPackage,
  FiRefreshCw,
  FiSend,
  FiTruck,
  FiUser,
} from "react-icons/fi";
import toast from "react-hot-toast";

import indiaPostApi, {
  IndiaPostPackageDetails,
  IndiaPostShipment,
  IndiaPostWarehouse,
} from "../../api/endpoints/indiaPostApi";

/**
 * Mount this inside the admin order page or on a standalone route.
 * Example route: /indiekonnect-admin/indiapost-dispatch/:orderReference
 *
 * Auth is handled by apiClient (Bearer token injected automatically).
 * Never expose x-internal-api-key or India Post credentials in the browser.
 */

export interface IndiaPostDispatchPanelProps {
  /** Numeric order id (not order_reference) — used for API calls */
  orderId: number;
  /** Optional order_reference for display (e.g. "ORD-20251109-1") */
  orderReference?: string;
  /** Optional callback when user clicks back */
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
 * Unwraps ONE envelope layer: { data: X } -> X, or axios { data: { data: X } } -> X
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
 * Recursively extracts the "list" out of a paginated / wrapped payload.
 * Handles:
 *   - [a, b, c]                               (raw array)
 *   - { data: [a, b, c] }                     (Laravel envelope)
 *   - { data: { data: [a, b, c] } }           (paginated inside data)
 *   - { data: { data: { data: [a, b, c] } } } (double envelope)
 *   - { shipments: [a, b, c] }                (named list)
 *   - axios { data: { success, data: {...} } }
 * Returns [] if no array is found.
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
  orderId,
  orderReference,
  onBack,
}: IndiaPostDispatchPanelProps) {
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

  // ----- ui state -----
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // ----- data from API -----
  const [warehouses, setWarehouses] = useState<IndiaPostWarehouse[]>([]);
  const [orderDetails, setOrderDetails] = useState<Record<string, any> | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);

  const validOrder = Number.isSafeInteger(orderId) && orderId > 0;

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
    try {
      const response = await indiaPostApi.getOrderDetails(orderId);
      const data = extractData<Record<string, any>>(response);
      setOrderDetails(data ?? null);
    } catch (err) {
      console.error("loadOrderDetails error:", err);
      setError(extractErrorMessage(err, "Failed to load order details"));
    } finally {
      setOrderLoading(false);
    }
  }, [orderId, validOrder]);

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
      const list = extractList<IndiaPostShipment>(response, "shipments");
      setShipments(list);

      const firstAwb = list.find((s: any) => s?.barcode_no)?.barcode_no ?? null;
      if (firstAwb && !awb) setAwb(String(firstAwb));
    } catch (err) {
      // Non-fatal: shipments may be empty for a fresh order
      console.warn("loadShipments warn:", err);
    } finally {
      setShipmentsLoading(false);
    }
  }, [orderId, validOrder, awb]);

  useEffect(() => {
    void loadOrderDetails();
    void loadWarehouses();
    void loadShipments();
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
      const response = await indiaPostApi.allocateAwb(orderId, payload);
      const data = extractData<Record<string, any>>(response) ?? {};
      setAwb(String(data?.awb ?? ""));
      setBooked(false);
      setBookingAttempted(false);
      setPreview(null);
      setNotice("AWB allocated to this order; NOT YET booked with India Post.");
      toast.success("AWB allocated");
    });

  const doPreview = () =>
    run("preview", async () => {
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
      await indiaPostApi.syncTracking(orderId);
      const shipmentsResponse = await indiaPostApi.getShipments(orderId);
      const list = extractList<IndiaPostShipment>(shipmentsResponse, "shipments");
      setShipments(list);
      const firstAwb = list.find((s: any) => s?.barcode_no)?.barcode_no;
      if (firstAwb && !awb) setAwb(String(firstAwb));
      setNotice("Tracking synced.");
    });

  // ---------- guard: no valid order ----------
  if (!validOrder) {
    return (
      <section className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-semibold">Invalid order reference.</p>
        <p className="mt-1 text-sm">
          Pass a numeric orderId to &lt;IndiaPostDispatchPanel /&gt;.
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
              {orderReference || `Order #${orderId}`}
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
            onChange={(e) => setStockVerified(e.target.checked)}
            disabled={!!busy}
          />
          <span>
            I have physically checked/reserved this product stock at the selected
            warehouse.
          </span>
        </label>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={check}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
        >
          1. Check Readiness
        </button>
        <button
          type="button"
          disabled={
            !!busy || !readiness?.ready_for_preview || !!awb || !fields.warehouse_id
          }
          onClick={allocate}
          className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          2. Allocate AWB
        </button>
        <button
          type="button"
          disabled={!!busy || !awb || bookingAttempted}
          onClick={doPreview}
          className="rounded-lg border border-indigo-400 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-40"
        >
          3. Preview Booking
        </button>
        <button
          type="button"
          disabled={
            !!busy || !preview?.ready_for_booking || bookingAttempted || !awb
          }
          onClick={submit}
          className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          4. Submit UAT Booking
        </button>
        <button
          type="button"
          disabled={!!busy}
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