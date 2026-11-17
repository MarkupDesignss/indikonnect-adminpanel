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
  IndiaPostLineScope,
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
  /** Optional preselection uses the actual order line ID only. */
  orderLineId?: number;
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
const extractErrorMessage = (
  err: unknown,
  fallback = "Request failed",
): string => {
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
    response &&
    typeof response === "object" &&
    "data" in response &&
    "status" in response
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
    if (namedKey && namedKey in (node as any))
      queue.push((node as any)[namedKey]);
    // named "items"/"results"/"records" common for pagination wrappers
    for (const key of ["items", "results", "records"]) {
      if (Array.isArray((node as any)[key])) return (node as any)[key] as T[];
    }
  }
  return [];
};
interface OrderLine {
  line_id: number;
  product_name?: string;
  product_code?: string;
  quantity: number;
  delivery_status?: string;
  primary_image?: string | null;
}
const isId = (value: unknown) =>
  /^(?:[1-9]\d*)$/.test(String(value)) && Number.isSafeInteger(Number(value));
const isAwb = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Z]{2}[0-9]{9}IN$/.test(value);
const verifiedData = (response: any): Record<string, any> => {
  const body = typeof response?.status === "number" ? response.data : response;
  if (
    body?.success !== true ||
    !body.data ||
    typeof body.data !== "object" ||
    Array.isArray(body.data)
  ) {
    throw new Error(body?.message || "API response could not be verified.");
  }
  return body.data;
};
function assertLine(response: any, orderId: number, scope: IndiaPostLineScope) {
  const data = verifiedData(response);
  if (
    String(data.order_id) !== String(orderId) ||
    data.order_reference !== scope.orderReference ||
    String(data.order_line_id) !== String(scope.orderLineId)
  ) {
    throw new Error("Order line identity mismatch. Actions blocked.");
  }
  return data;
}
export default function IndiaPostDispatchPanel(
  props: IndiaPostDispatchPanelProps,
) {
  // Remount the order state on navigation, including reference-only entry points.
  return (
    <OrderDispatch
      key={`${props.orderReference ?? ""}:${props.orderId ?? ""}:${props.orderLineId ?? ""}`}
      {...props}
    />
  );
}
function OrderDispatch({
  orderId: inputOrderId,
  orderReference,
  orderLineId,
  onBack,
}: IndiaPostDispatchPanelProps) {
  const normalizedReference = (orderReference ?? "").trim();
  const [orderDetails, setOrderDetails] = useState<Record<string, any> | null>(
    null,
  );
  const [orderLoading, setOrderLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(
    isId(orderLineId) ? String(orderLineId) : "",
  );
  const [busy, setBusy] = useState(false);
  // Preserve ambiguous-attempt guards even when switching product lines.
  const attempted = useRef(new Set<string>());
  const loadOrderDetails = useCallback(async () => {
    setOrderLoading(true);
    setError("");
    try {
      let id = isId(inputOrderId) ? Number(inputOrderId) : 0;
      if (!id) {
        if (!normalizedReference)
          throw new Error("An order ID or reference is required.");
        const list = extractList<IndiaPostAdminOrderRow>(
          await indiaPostApi.getOrdersByReference(normalizedReference),
        );
        const matches = list.filter(
          (row) =>
            row?.order?.order_reference === normalizedReference &&
            isId(row.order.id),
        );
        if (matches.length !== 1)
          throw new Error("Order reference could not be uniquely verified.");
        id = Number(matches[0].order.id);
      }
      const data = verifiedData(await indiaPostApi.getOrderDetails(id));
      if (
        String(data.id) !== String(id) ||
        typeof data.order_reference !== "string" ||
        !data.order_reference.trim() ||
        (normalizedReference && data.order_reference !== normalizedReference)
      ) {
        throw new Error("Order ID and reference could not be verified.");
      }
      // The backend exposes items[].line_id, never use product_id or an array index.
      if (
        !Array.isArray(data.items) ||
        data.items.some((item: any) => !item || !isId(item.line_id)) ||
        new Set(data.items.map((item: any) => String(item.line_id))).size !==
          data.items.length
      ) {
        throw new Error(
          "Order API did not return unique, verified item line IDs.",
        );
      }
      setOrderDetails(data);
    } catch (e) {
      setOrderDetails(null);
      setError(extractErrorMessage(e));
    } finally {
      setOrderLoading(false);
    }
  }, [inputOrderId, normalizedReference]);
  useEffect(() => {
    void loadOrderDetails();
  }, [loadOrderDetails]);
  const orderId = Number(orderDetails?.id ?? 0);
  const orderIdentityVerified =
    !!orderDetails &&
    isId(orderId) &&
    (!normalizedReference ||
      orderDetails.order_reference === normalizedReference);
  const items: OrderLine[] = orderIdentityVerified ? orderDetails!.items : [];
  const selected = items.find((item) => String(item.line_id) === selectedId);
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
              {normalizedReference ||
                orderDetails?.order_reference ||
                `Order #${orderId}`}
            </h1>
            <p className="text-xs text-[#6B7280]">
              Select product → Warehouse → Readiness → AWB → Preview → UAT
              Booking → Tracking
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadOrderDetails();
          }}
          disabled={orderLoading || busy}
          className="flex h-10 items-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-[#F4F8FD] px-3 text-xs font-semibold text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:opacity-50"
        >
          <FiRefreshCw
            size={14}
            className={orderLoading || busy ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>
      {orderDetails && !orderIdentityVerified && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          Order Reference mismatch: API returned{" "}
          {String(orderDetails?.order_reference ?? "missing")}. Actions are
          blocked to prevent changes to the wrong order.
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
                  addr.postcode || addr.postal_code || addr.pincode,
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
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#111827]">
          Select product to dispatch
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Each order line has its own AWB and shipment records. All units on the
          selected line form one parcel.
        </p>
        <select
          aria-label="Order line"
          value={selectedId}
          disabled={busy || orderLoading || !orderIdentityVerified}
          onChange={(e) => setSelectedId(e.target.value)}
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
        >
          <option value="">Select an order item</option>
          {items.map((item) => (
            <option key={item.line_id} value={String(item.line_id)}>
              {item.product_name || "Product"} · Line #{item.line_id} · Qty{" "}
              {item.quantity} · {item.delivery_status || "Unknown"}
            </option>
          ))}
        </select>
        {selected && (
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-[#F4F8FD] p-3">
            {selected.primary_image && (
              <img
                src={selected.primary_image}
                alt=""
                className="h-12 w-12 rounded-lg object-cover"
              />
            )}
            <div>
              <p className="text-sm font-semibold">
                {selected.product_name || "Product"}
              </p>
              <p className="text-xs text-slate-600">
                Line #{selected.line_id} · Quantity: {selected.quantity} ·{" "}
                {selected.delivery_status || "Unknown"}
              </p>
            </div>
          </div>
        )}
      </div>
      {!orderLoading && orderIdentityVerified && items.length === 0 && (
        <p className="text-sm text-slate-500">No order items available.</p>
      )}
      {selected && orderIdentityVerified && !orderLoading && (
        <LineWorkflow
          key={`${orderDetails!.order_reference}:${selected.line_id}`}
          orderId={orderId}
          scope={{
            orderReference: orderDetails!.order_reference,
            orderLineId: Number(selected.line_id),
          }}
          quantity={selected.quantity}
          attempted={attempted.current}
          onBusy={setBusy}
        />
      )}
    </section>
  );
}
function LineWorkflow({
  orderId,
  scope,
  quantity,
  attempted,
  onBusy,
}: {
  orderId: number;
  scope: IndiaPostLineScope;
  quantity: number;
  attempted: Set<string>;
  onBusy: (busy: boolean) => void;
}) {
  const [fields, setFields] = useState<Fields>({
    warehouse_id: "",
    weight_grams: "",
    length_cm: "",
    width_cm: "",
    height_cm: "",
  });
  const [stockVerified, setStockVerified] = useState(false);
  const [contentsVerified, setContentsVerified] = useState(false);
  const [uatBookingAuthorized, setUatBookingAuthorized] = useState(false);
  const [readiness, setReadiness] = useState<Record<string, any> | null>(null);
  const [preview, setPreview] = useState<Record<string, any> | null>(null);
  const [awb, setAwb] = useState("");
  const [shipments, setShipments] = useState<IndiaPostShipment[]>([]);
  const [localAttempts, setLocalAttempts] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState("");
  const [shipmentWarnings, setShipmentWarnings] = useState<string[]>([]);
  const [shipmentsReadOk, setShipmentsReadOk] = useState(false);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<IndiaPostWarehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const opLock = useRef(false);
  const scopeKey = `${scope.orderReference}:${scope.orderLineId}`;
  // Do not convert or reallocate the known legacy order's AWB.
  const knownLegacy =
    orderId === 9 || scope.orderReference === "ORD6AF6FF628D370";
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
  const packageValid =
    Number.isSafeInteger(payload.warehouse_id) &&
    payload.warehouse_id > 0 &&
    Number.isInteger(payload.weight_grams) &&
    payload.weight_grams >= 1 &&
    payload.weight_grams <= 35000 &&
    payload.length_cm >= 14 &&
    payload.length_cm <= 150 &&
    payload.width_cm >= 9 &&
    payload.width_cm <= 150 &&
    payload.height_cm >= 1 &&
    payload.height_cm <= 150;
  const invalidate = () => {
    setReadiness(null);
    setPreview(null);
    setUatBookingAuthorized(false);
    setContentsVerified(false);
  };
  const readShipments = useCallback(async () => {
    setShipmentsLoading(true);
    setShipmentsReadOk(false);
    try {
      const data = assertLine(
        await indiaPostApi.getLineShipments(scope),
        orderId,
        scope,
      );
      if (
        !Array.isArray(data.shipments) ||
        !Array.isArray(data.allocations) ||
        !Array.isArray(data.local_attempts) ||
        !["linked", "unmapped", "reconciliation_required"].includes(
          data.mapping_status,
        )
      )
        throw new Error("Invalid line shipment response.");
      if (
        data.shipments.some(
          (s: any) =>
            !isAwb(s?.barcode_no) ||
            String(s.order_id) !== String(orderId) ||
            s.order_reference !== scope.orderReference,
        ) ||
        data.allocations.some((a: any) => !isAwb(a?.barcode_no)) ||
        data.local_attempts.some((a: any) => !isAwb(a?.barcode_no))
      )
        throw new Error("Unverified parcel data.");
      if (
        data.mapping_status === "unmapped" &&
        (data.shipments.length || data.allocations.length)
      )
        throw new Error("Conflicting parcel mapping.");
      setMapping(data.mapping_status);
      setShipments(data.shipments);
      setLocalAttempts(data.local_attempts);
      setShipmentWarnings(
        Array.isArray(data.warnings) ? data.warnings.map(String) : [],
      );
      const codes = [
        ...new Set<string>(data.allocations.map((a: any) => a.barcode_no)),
      ];
      setAwb(
        data.mapping_status === "linked" && codes.length === 1 ? codes[0] : "",
      );
      setShipmentsReadOk(
        data.mapping_status !== "reconciliation_required" && codes.length <= 1,
      );
      return data;
    } catch (e) {
      setMapping("");
      setShipments([]);
      setLocalAttempts([]);
      setAwb("");
      setError(extractErrorMessage(e));
      throw e;
    } finally {
      setShipmentsLoading(false);
    }
  }, [orderId, scope.orderReference, scope.orderLineId]);
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
        return String(a.name || a.title || "").localeCompare(
          String(b.name || b.title || ""),
        );
      });
      setWarehouses(active);
      if (active.length === 0) {
        setNotice(
          "No active warehouses found. Create one first or activate an existing one.",
        );
      }
    } catch (err) {
      console.error("loadWarehouses error:", err);
      setError(extractErrorMessage(err, "Failed to load warehouses"));
    } finally {
      setWarehousesLoading(false);
    }
  }, []);
  useEffect(() => {
    void loadWarehouses();
    void readShipments().catch(() => {});
  }, [loadWarehouses, readShipments]);
  const canPrepare =
    shipmentsReadOk &&
    !shipmentsLoading &&
    !knownLegacy &&
    shipments.length === 0 &&
    localAttempts.length === 0 &&
    packageValid;
  const canAllocate =
    canPrepare &&
    mapping === "unmapped" &&
    !awb &&
    readiness?.ready_for_preview === true &&
    readiness?.allocated_awb === null &&
    readiness?.line_awb_allocation_enabled === true &&
    contentsVerified &&
    !attempted.has(`allocate:${scopeKey}`);
  const canPreview =
    canPrepare &&
    mapping === "linked" &&
    isAwb(awb) &&
    readiness?.ready_for_preview === true &&
    readiness?.allocated_awb === awb &&
    !attempted.has(`book:${scopeKey}`);
  const canBook =
    canPreview &&
    contentsVerified &&
    uatBookingAuthorized &&
    preview?.ready_for_booking === true &&
    preview?.booking_enabled === true &&
    readiness?.line_booking_enabled === true &&
    preview?.awb === awb;
  // Explain every disabled condition without weakening any booking guard.
  const bookingBlockers: string[] = [];
  if (busy) bookingBlockers.push(`Processing ${busy}…`);
  if (shipmentsLoading) bookingBlockers.push("Loading parcel records.");
  if (!shipmentsReadOk)
    bookingBlockers.push(
      "Parcel records are not verified. Reload or reconcile.",
    );
  if (knownLegacy)
    bookingBlockers.push("Legacy parcel requires reconciliation.");
  if (
    shipments.length > 0 ||
    localAttempts.length > 0 ||
    attempted.has(`book:${scopeKey}`)
  ) {
    bookingBlockers.push(
      "A booking or attempt already exists. Reconcile; do not submit again.",
    );
  }
  if (!packageValid)
    bookingBlockers.push("Enter valid warehouse and measured package details.");
  if (mapping !== "linked" || !isAwb(awb))
    bookingBlockers.push("Verify the allocated AWB and line mapping.");
  if (readiness?.ready_for_preview !== true || readiness?.allocated_awb !== awb)
    bookingBlockers.push("Run Check Readiness for this AWB.");
  if (readiness && readiness.line_booking_enabled !== true)
    bookingBlockers.push("Order-line booking is disabled on the server.");
  if (preview?.ready_for_booking !== true || preview?.awb !== awb)
    bookingBlockers.push(
      "Generate and review the booking preview for this AWB.",
    );
  if (preview && preview.booking_enabled !== true)
    bookingBlockers.push("Booking is disabled on the server.");
  if (!contentsVerified)
    bookingBlockers.push("Tick the selected parcel contents confirmation.");
  if (!uatBookingAuthorized)
    bookingBlockers.push(
      "After reviewing the preview, tick authorized UAT approval.",
    );
  const run = async (label: string, action: () => Promise<void>) => {
    if (opLock.current || shipmentsLoading) return;
    opLock.current = true;
    onBusy(true);
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      const msg = extractErrorMessage(e);
      setError(msg);
      toast.error(msg);
    } finally {
      opLock.current = false;
      setBusy("");
      onBusy(false);
    }
  };
  const check = () =>
    run("readiness", async () => {
      if (!packageValid)
        throw new Error(
          "Enter valid measured package dimensions and warehouse.",
        );
      setReadiness(null);
      setPreview(null);
      setUatBookingAuthorized(false);
      const data = assertLine(
        await indiaPostApi.getLineReadiness(scope, payload),
        orderId,
        scope,
      );
      if (
        Number(data.line_quantity) !== Number(quantity) ||
        data.booking_performed !== false ||
        typeof data.ready_for_preview !== "boolean" ||
        typeof data.line_booking_enabled !== "boolean" ||
        typeof data.line_awb_allocation_enabled !== "boolean"
      )
        throw new Error("Readiness response could not be verified.");
      if (data.allocated_awb !== null && !isAwb(data.allocated_awb))
        throw new Error("Invalid allocation in readiness.");
      setReadiness(data);
      if (data.allocated_awb !== null && data.allocated_awb !== awb) {
        setReadiness(null);
        await readShipments();
        throw new Error(
          "AWB state changed. Run readiness again after refresh.",
        );
      }
      setNotice(
        data.ready_for_preview
          ? "Readiness passed. Feature flags still apply."
          : "Resolve listed blockers before booking.",
      );
    });
  const allocate = () =>
    run("allocation", async () => {
      if (!canAllocate)
        throw new Error("Allocation is not authorized for this line.");
      if (
        !window.confirm(
          `Allocate a dedicated AWB for ${scope.orderReference}, line #${scope.orderLineId} (all ${quantity} units)?`,
        )
      )
        return;
      attempted.add(`allocate:${scopeKey}`);
      setReadiness(null);
      setPreview(null);
      try {
        const data = assertLine(
          await indiaPostApi.allocateLineAwb(scope, {
            ...payload,
            confirm_parcel_contents: true,
          }),
          orderId,
          scope,
        );
        if (!isAwb(data.awb) || data.booking_performed !== false)
          throw new Error(
            "Allocation outcome could not be verified. Reconcile before retrying.",
          );
        const latest = await readShipments();
        if (!latest.allocations.some((a: any) => a.barcode_no === data.awb))
          throw new Error(
            "Allocation not visible in verified mapping. Reconcile.",
          );
        setNotice(
          "Dedicated AWB allocated, not booked. Check readiness again.",
        );
        toast.success("AWB verified");
      } catch (e) {
        setShipmentsReadOk(false);
        throw new Error(
          `${extractErrorMessage(e)} Do not retry allocation blindly. Refresh and reconcile.`,
        );
      }
    });
  const doPreview = () =>
    run("preview", async () => {
      if (!canPreview)
        throw new Error("Check readiness and verify the dedicated AWB first.");
      setPreview(null);
      setUatBookingAuthorized(false);
      const data = assertLine(
        await indiaPostApi.previewLineBooking(scope, {
          ...payload,
          barcode_no: awb,
        }),
        orderId,
        scope,
      );
      if (
        data.awb !== awb ||
        data.ready_for_booking !== true ||
        data.booking_performed !== false ||
        typeof data.booking_enabled !== "boolean" ||
        !data.article ||
        data.article.barcode_no !== awb
      )
        throw new Error("Booking preview could not be verified.");
      setPreview(data);
      setNotice("Review verified preview; no carrier booking performed.");
    });
  const submit = () =>
    run("booking", async () => {
      if (!canBook)
        throw new Error("Booking disabled or confirmation missing.");
      if (
        !window.confirm(
          `Submit authorized UAT booking for line #${scope.orderLineId}, AWB ${awb}? Do not retry an unknown outcome.`,
        )
      )
        return;
      attempted.add(`book:${scopeKey}`);
      setUatBookingAuthorized(false);
      setPreview(null);
      setReadiness(null);
      try {
        const data = assertLine(
          await indiaPostApi.submitLineBooking(scope, {
            ...payload,
            barcode_no: awb,
            confirm_parcel_contents: true,
            confirm_authorized_uat_booking: true,
          }),
          orderId,
          scope,
        );
        if (
          data.awb !== awb ||
          data.booking_status !== "submitted" ||
          data.physical_booking_confirmed !== false
        )
          throw new Error("Booking outcome not verified.");
        setNotice("Booking submitted; physical handover is not confirmed.");
        await readShipments();
        toast.success("UAT booking submitted");
      } catch (e) {
        setShipmentsReadOk(false);
        throw new Error(
          `${extractErrorMessage(e)} Do not retry; reconcile with carrier.`,
        );
      }
    });
  const refresh = () =>
    run("tracking", async () => {
      setPreview(null);
      setReadiness(null);
      setUatBookingAuthorized(false);
      const data = assertLine(
        await indiaPostApi.syncLineTracking(scope),
        orderId,
        scope,
      );
      await readShipments();
      setNotice(
        data.warning ||
          "Tracking records refreshed; product delivery status is not automatically changed.",
      );
    });
  return (
    <div className="space-y-5">
      {/* Package form */}
      <div className="rounded-2xl border border-[#DCE6F2] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
            <FiBox size={15} />
          </div>
          <h3 className="text-sm font-bold text-[#111827]">
            Package details · Line #{scope.orderLineId}
          </h3>
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
                  setStockVerified(false);
                  invalidate();
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
          {(
            ["weight_grams", "length_cm", "width_cm", "height_cm"] as const
          ).map((key) => (
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
                  invalidate();
                }}
                disabled={!!busy}
                placeholder={`Enter ${fieldNames[key].toLowerCase()}`}
              />
            </label>
          ))}
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={stockVerified}
            onChange={(e) => {
              setStockVerified(e.target.checked);
              invalidate();
            }}
            disabled={!!busy}
          />
          <span>
            I have physically checked/reserved this product stock at the
            selected warehouse.
          </span>
        </label>
      </div>
      {knownLegacy && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Existing order-level AWB must be reconciled before independent
          booking. No automatic allocation or reassignment.
        </p>
      )}
      {readiness &&
        (!readiness.line_awb_allocation_enabled ||
          !readiness.line_booking_enabled) && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Feature disabled on server:{" "}
            {!readiness.line_awb_allocation_enabled && "AWB allocation. "}
            {!readiness.line_booking_enabled && "Booking. "}Do not enable
            without approval.
          </p>
        )}
      <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
        <input
          type="checkbox"
          checked={contentsVerified}
          onChange={(e) => {
            setContentsVerified(e.target.checked);
            setUatBookingAuthorized(false);
          }}
          disabled={!!busy}
        />{" "}
        I confirm this parcel contains all {quantity} units of line #
        {scope.orderLineId}, and no other lines.
      </label>
      <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
        <input
          type="checkbox"
          checked={uatBookingAuthorized}
          onChange={(e) => setUatBookingAuthorized(e.target.checked)}
          disabled={
            !!busy || preview?.booking_enabled !== true || !contentsVerified
          }
        />{" "}
        I have authorized UAT approval and verified the preview, sender,
        recipient, package and AWB.
      </label>
      {attempted.has(`book:${scopeKey}`) && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Booking attempted during this session. Reconcile shipment records; do
          not submit again.
        </p>
      )}
      {!canBook || busy ? (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
        >
          <p className="font-semibold">Why Submit UAT Booking is disabled</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {bookingBlockers.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
        >
          Ready to submit the authorized UAT booking for {awb}. Submit only
          once.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!busy || shipmentsLoading || !packageValid}
          onClick={check}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
        >
          1. Check Readiness
        </button>
        <button
          type="button"
          disabled={!!busy || !canAllocate}
          onClick={allocate}
          className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          2. Allocate AWB
        </button>
        <button
          type="button"
          disabled={!!busy || !canPreview}
          onClick={doPreview}
          className="rounded-lg border border-indigo-400 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-40"
        >
          3. Preview Booking
        </button>
        <button
          type="button"
          disabled={!!busy || !canBook}
          onClick={submit}
          className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          4. Submit UAT Booking
        </button>
        <button
          type="button"
          disabled={
            !!busy ||
            shipmentsLoading ||
            !shipmentsReadOk ||
            shipments.length === 0
          }
          onClick={refresh}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
        >
          5. Refresh Tracking
        </button>
        <button
          type="button"
          disabled={!!busy || shipmentsLoading}
          onClick={() =>
            void run("reload", async () => {
              invalidate();
              await readShipments();
            })
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Reload parcel records
        </button>
      </div>
      {busy && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-indigo-700"
        >
          <FiLoader size={14} className="animate-spin" /> Processing {busy}…
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          <FiAlertCircle className="mr-1.5 inline" size={14} />
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
          {notice}
        </p>
      )}
      {awb && (
        <p className="text-sm">
          Allocated AWB: <strong className="font-mono">{awb}</strong> ·
          Allocation alone is not booking confirmation.
        </p>
      )}
      {readiness && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <p className="font-semibold">
            <FiCheckCircle className="mr-1.5 inline" size={14} />
            Readiness: {readiness.ready_for_preview ? "Passed" : "Blocked"}
          </p>
          {Array.isArray(readiness.blockers) &&
            readiness.blockers.map((v: string, i: number) => (
              <p key={i} className="mt-1 text-red-700">
                {v}
              </p>
            ))}
          {Array.isArray(readiness.warnings) &&
            readiness.warnings.map((v: string, i: number) => (
              <p key={i} className="mt-1 text-amber-700">
                {v}
              </p>
            ))}
        </div>
      )}
      {preview && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <h3 className="font-semibold">Verified booking preview</h3>
          <p className="mt-1 text-xs text-slate-500">
            {preview.booking_enabled
              ? "Booking enabled on server (explicit UAT approval required)."
              : "Booking disabled on server."}
          </p>
          <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              "barcode_no",
              "article_type",
              "sender_name",
              "sender_add_line_1",
              "sender_city",
              "sender_state",
              "sender_pincode",
              "receiver_name",
              "receiver_add_line_1",
              "receiver_city",
              "receiver_state",
              "receiver_pincode",
              "physical_weight",
              "length",
              "breadth_diameter",
              "height",
            ].map((k) => (
              <div key={k} className="rounded bg-slate-50 p-2">
                <dt className="text-xs text-slate-500">
                  {k.replace(/_/g, " ")}
                </dt>
                <dd className="break-words">
                  {String(preview.article[k] ?? "—")}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
        <p className="mb-2 flex items-center gap-2 font-semibold">
          <FiTruck size={14} /> Line #{scope.orderLineId} · Shipment records
        </p>
        {shipmentsLoading ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : !shipmentsReadOk ? (
          <p className="text-xs text-amber-700">
            Shipment mapping not verified. Reload or reconcile.
          </p>
        ) : (
          <>
            <p className="mb-2 text-xs text-slate-500">Mapping: {mapping}</p>
            {shipments.length ? (
              shipments.map((s) => (
                <p key={s.barcode_no} className="mb-1 text-xs">
                  <span className="font-mono">{s.barcode_no}</span>:{" "}
                  <strong>{s.booking_status || "unknown"}</strong>
                  {s.latest_event ? ` · ${s.latest_event}` : ""}
                </p>
              ))
            ) : (
              <p className="text-xs text-slate-500">
                No verified booked shipment for this line.
              </p>
            )}
          </>
        )}
        {localAttempts.length > 0 && (
          <div className="mt-3 border-t pt-2">
            <p className="text-xs font-semibold">
              Local booking attempts (do not retry)
            </p>
            {localAttempts.map((s) => (
              <p key={s.barcode_no} className="text-xs">
                {s.barcode_no} · {s.booking_status || "unknown"}
              </p>
            ))}
          </div>
        )}
        {shipmentWarnings.map((w, i) => (
          <p key={i} className="mt-1 text-xs text-amber-700">
            {w}
          </p>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Booking is not proof of physical pickup or delivery. Never retry an
        unknown booking without reconciliation.
      </p>
    </div>
  );
}
