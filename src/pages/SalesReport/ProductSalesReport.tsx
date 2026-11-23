"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Search,
  RefreshCw,
  Download,
  Package,
  ShoppingBag,
  IndianRupee,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  FileText,
  Loader2,
  Filter,
  ShieldAlert,
  X,
  Layers3,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { orderApi } from "../../api/endpoints/orders";
import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

/* ================= TYPES ================= */
type Money = number | string | null;
interface ReportItem {
  line_id: number | string;
  item_reference_id?: string;
  product_id?: number;
  product_name: string;
  product_code?: string;
  brand_name?: string;
  category_name?: string;
  quantity: Money;
  unit_price: Money;
  gst_amount?: Money;
  delivery_charges?: Money;
  line_total: Money;
  delivery_status?: string;
  return_status?: string;
  primary_image?: string | null;
  images?: { image_url?: string; is_primary?: boolean }[];
  invoice?: { invoice_number?: string } | null;
}
interface ReportOrder {
  id: number | string;
  order_reference: string;
  order_date: string;
  order_status?: string;
  payment_status?: string;
  order_type?: string;
  total_payable: Money;
  user?: { name?: string; ba_id?: string } | null;
  items: ReportItem[];
}
type WeekRange = { from: string; to: string };
const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";
const TIME_ZONE = "Asia/Kolkata";
const DAY = 86400000;
const PAGE_SIZE = 10;
const integer = new Intl.NumberFormat("en-IN");
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (v: Money | undefined) =>
  v == null || v === "" ? "—" : inr.format(num(v));
const label = (v?: string) =>
  v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";
const orderKey = (o: ReportOrder) => String(o.id);
const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/* ISO weeks, Monday through Sunday. UTC here is used as a calendar-day coordinate. */
function indiaDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function dateKeyValid(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const d = new Date(`${key}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === key;
}
function orderDay(value: string): string | null {
  if (typeof value !== "string" || !value) return null;
  const s = value.trim();
  // Laravel timestamps without an offset are assumed to be India business time.
  const local =
    /^(\d{4}-\d{2}-\d{2})(?:[ T](?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?)?$/.exec(
      s,
    );
  if (local) return dateKeyValid(local[1]) ? local[1] : null;
  // Only explicitly zoned timestamps are interpreted as instants.
  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(s) || !dateKeyValid(s.slice(0, 10)))
    return null;
  const d = new Date(s.replace(" ", "T"));
  return Number.isFinite(d.getTime()) ? indiaDateKey(d) : null;
}
function weekOne(year: number) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  return jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * DAY;
}
function isoWeek(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  const monday = date.getTime() - ((date.getUTCDay() + 6) % 7) * DAY;
  const year = new Date(monday + 3 * DAY).getUTCFullYear();
  return `${year}-W${String(Math.floor((monday - weekOne(year)) / (7 * DAY)) + 1).padStart(2, "0")}`;
}
function weekStart(key: string): number | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  const start = weekOne(year) + (week - 1) * 7 * DAY;
  return week >= 1 && start < weekOne(year + 1) ? start : null;
}
function toDay(t: number) {
  return new Date(t).toISOString().slice(0, 10);
}
function bounds(range: WeekRange) {
  const from = weekStart(range.from);
  const to = weekStart(range.to);
  if (from == null || to == null || from > to) return null;
  return {
    from: toDay(from),
    until: toDay(to + 7 * DAY),
    end: toDay(to + 6 * DAY),
    text: `${dateFormat.format(from)} – ${dateFormat.format(to + 6 * DAY)}`,
  };
}
function weekOptions(firstYear: number, current: string) {
  const result: { value: string; label: string }[] = [];
  for (let year = Number(current.slice(0, 4)); year >= firstYear; year--) {
    const count = (weekOne(year + 1) - weekOne(year)) / (7 * DAY);
    for (let week = count; week >= 1; week--) {
      const value = `${year}-W${String(week).padStart(2, "0")}`;
      if (value > current) continue;
      result.push({
        value,
        label: `Week ${String(week).padStart(2, "0")}, ${year}`,
      });
    }
  }
  return result;
}

function escapeCsv(value: unknown) {
  let s = value == null ? "" : String(value);
  if (typeof value === "string" && /^[\s]*[=+\-@]|^[\t\r\n]/.test(s))
    s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}
function downloadCsv(rows: unknown[][], filename: string) {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Status({ value }: { value?: string }) {
  const status = (value || "").toLowerCase();
  const color = ["paid", "delivered", "completed"].includes(status)
    ? "bg-green-50 text-green-700"
    : ["cancelled", "canceled", "failed", "refunded"].includes(status)
      ? "bg-red-50 text-red-700"
      : ["pending", "processing", "undelivered"].includes(status)
        ? "bg-amber-50 text-amber-700"
        : "bg-[#EAF3FF] text-[#2D6FE8]";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${color}`}
    >
      {label(value)}
    </span>
  );
}
function ProductImage({ item }: { item: ReportItem }) {
  const src =
    item.primary_image ||
    item.images?.find((i) => i.is_primary)?.image_url ||
    item.images?.[0]?.image_url;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] text-slate-400">
      {src && !failed ? (
        <img
          src={src}
          alt={item.product_name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Package size={19} />
      )}
    </div>
  );
}
function SummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className="mt-1 break-words text-lg font-bold text-slate-900">
          {value}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-500">{detail}</p>
      </div>
    </div>
  );
}
const buttonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50";
const inputClass =
  "h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100";

/* ================= REPORT ================= */
const ProductSalesReport = () => {
  const {
    hasPermission,
    hasAnyPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();
  const canViewReport =
    isSuperAdmin ||
    hasPermission("sales.view") ||
    hasAnyPermission([
      "sales.view",
      "sales_product_report.view",
      "product_sales_report.view",
      "sales_report.view",
      "sales_report.products.view",
      "reports.sales.view",
      "reports.view",
    ]) ||
    [
      "sales_product_report",
      "product_sales_report",
      "sales_report",
      "reports",
    ].some((module) => hasModuleAccess(module));
  const canExport =
    isSuperAdmin ||
    hasAnyPermission([
      "sales_product_report.download",
      "sales_product_report.export",
      "product_sales_report.download",
      "sales_report.download",
      "sales_report.export",
    ]) ||
    hasModuleAccess("sales_product_report.download") ||
    hasModuleAccess("sales_report.download");

  const currentWeek = isoWeek(indiaDateKey(new Date()));
  const [draft, setDraft] = useState<WeekRange>(() => ({
    from: currentWeek,
    to: currentWeek,
  }));
  const [applied, setApplied] = useState<WeekRange>(() => ({
    from: currentWeek,
    to: currentWeek,
  }));
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO_URL);
  const requestId = useRef(0);

  useEffect(() => {
    let active = true;
    if (!permissionsLoading && canViewReport)
      void (async () => {
        try {
          const r: any = await logoApi.getLogo();
          const candidates: unknown[] = [
            r?.data?.data?.logo,
            r?.data?.logo,
            r?.data?.data?.logo_url,
            r?.data?.logo_url,
          ];
          const src = candidates.find(
            (x): x is string =>
              typeof x === "string" && /^https?:\/\//i.test(x),
          );
          if (active && src) setLogoUrl(src);
        } catch {
          /* fallback logo */
        }
      })();
    return () => {
      active = false;
    };
  }, [permissionsLoading, canViewReport]);

  const fetchOrders = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setOrders([]);
    try {
      const response = await orderApi.getOrders();
      const payload: any = response.data;
      if (payload?.success !== true || !Array.isArray(payload.data))
        throw new Error(
          payload?.message ||
            "Invalid orders response. Expected an array of orders.",
        );
      // Existing API contract is an unpaginated array. Never silently report just one server page.
      const meta = payload.meta ?? payload.pagination ?? payload;
      if (
        num(meta.last_page) > 1 ||
        meta.next_page_url ||
        payload.links?.next ||
        (meta.total != null && num(meta.total) > payload.data.length)
      ) {
        throw new Error(
          "Orders API returned a partial page. Load every server page before generating this report.",
        );
      }
      const map = new Map<string, ReportOrder>();
      for (const record of payload.data) {
        const order = record?.order ?? record;
        if (!order || order.id == null || !Array.isArray(order.items))
          throw new Error(
            "An order is missing its ID or items. Cannot generate a complete report.",
          );
        if (!orderDay(order.order_date))
          throw new Error(
            "An order has an invalid order date. Please check the API response.",
          );
        const group = map.get(String(order.id));
        const items = new Map<string, ReportItem>();
        for (const item of [...(group?.items ?? []), ...order.items]) {
          if (!item || item.line_id == null)
            throw new Error("An order item is missing its line ID.");
          items.set(String(item.line_id), item);
        }
        map.set(String(order.id), { ...order, items: [...items.values()] });
      }
      if (id !== requestId.current) return;
      setOrders([...map.values()]);
      setPage(1);
      setCollapsed(new Set());
    } catch (e: any) {
      if (id !== requestId.current) return;
      const message =
        e?.response?.data?.message || e?.message || "Failed to load orders.";
      setError(message);
      setOrders([]);
      toast.error(message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permissionsLoading || !canViewReport) {
      ++requestId.current;
      setOrders([]);
      return;
    }
    void fetchOrders();
    return () => {
      ++requestId.current;
    };
  }, [permissionsLoading, canViewReport, fetchOrders]);

  const options = useMemo(() => {
    const years = orders.map((o) =>
      Number(isoWeek(orderDay(o.order_date)!).slice(0, 4)),
    );
    const year = Number(currentWeek.slice(0, 4));
    return weekOptions(
      years.reduce((min, y) => Math.min(min, y), year - 5),
      currentWeek,
    );
  }, [orders, currentWeek]);
  const activeBounds = useMemo(() => bounds(applied), [applied]);
  const draftBounds = useMemo(() => bounds(draft), [draft]);
  const pending = draft.from !== applied.from || draft.to !== applied.to;

  const periodOrders = useMemo(() => {
    if (!activeBounds) return [];
    return orders
      .filter((o) => {
        const day = orderDay(o.order_date);
        return (
          day != null && day >= activeBounds.from && day < activeBounds.until
        );
      })
      .sort((a, b) => {
        const daySort = (orderDay(b.order_date) || "").localeCompare(
          orderDay(a.order_date) || "",
        );
        return (
          daySort || String(b.order_date).localeCompare(String(a.order_date))
        );
      });
  }, [orders, activeBounds]);
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return periodOrders;
    // Match an order OR any of its items, but keep the whole order intact.
    return periodOrders.filter((o) =>
      [
        o.id,
        o.order_reference,
        o.user?.name,
        o.user?.ba_id,
        ...o.items.flatMap((i) => [
          i.product_name,
          i.product_code,
          i.brand_name,
          i.category_name,
          i.item_reference_id,
          i.invoice?.invoice_number,
        ]),
      ].some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [periodOrders, search]);
  const summary = useMemo(() => {
    const items = filteredOrders.flatMap((o) => o.items);
    return {
      orders: filteredOrders.length,
      lines: items.length,
      quantity: items.reduce((s, i) => s + num(i.quantity), 0),
      value: filteredOrders.reduce((s, o) => s + num(o.total_payable), 0),
    };
  }, [filteredOrders]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleOrders = filteredOrders.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function applyFilters() {
    if (!draftBounds || draft.to > currentWeek) {
      toast.error("Select a valid From Week and To Week range.");
      return;
    }
    setApplied({ ...draft });
    setPage(1);
    setCollapsed(new Set());
  }
  function resetFilters() {
    const range = { from: currentWeek, to: currentWeek };
    setDraft(range);
    setApplied(range);
    setSearch("");
    setPage(1);
    setCollapsed(new Set());
  }
  function toggleOrder(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function exportCSV() {
    if (
      !canViewReport ||
      !canExport ||
      loading ||
      pending ||
      error ||
      !filteredOrders.length
    )
      return;
    const rows: unknown[][] = [
      [
      
        "Order Reference",
        "Order Date",
        "Customer",
        "BA ID",
        "Order Status",
        "Payment Status",
        "Item Reference",
        "Product",
        "SKU",
        "Brand",
        "Category",
        "Invoice",
        "Quantity",
        "Unit Price (INR)",
        "GST Amount (INR)",
        "Delivery Charge (INR)",
        "Item Total (INR)",
        "Item Status",
        "Return Status",
        "Order Value (INR; once per order)",
      ],
    ];
    filteredOrders.forEach((o) => {
      const base = [
        o.id,
        o.order_reference,
        o.order_date,
        o.user?.name,
        o.user?.ba_id,
        o.order_status,
        o.payment_status,
      ];
      if (!o.items.length) {
        rows.push([...base, ...Array(13).fill(""), o.total_payable]);
        return;
      }
      o.items.forEach((i, idx) =>
        rows.push([
          ...base,
          i.item_reference_id,
          i.product_name,
          i.product_code,
          i.brand_name,
          i.category_name,
          i.invoice?.invoice_number,
          i.quantity,
          i.unit_price,
          i.gst_amount,
          i.delivery_charges,
          i.line_total,
          i.delivery_status,
          i.return_status,
          idx === 0 ? o.total_payable : "",
        ]),
      );
    });
    downloadCsv(rows, `product-sales-${applied.from}-to-${applied.to}.csv`);
    toast.success("Report downloaded successfully");
  }

  if (permissionsLoading) return <PermissionLoadingState logoUrl={logoUrl} />;
  if (!canViewReport)
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F4F8FD] p-5">
        <div className="rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center">
          <ShieldAlert className="mx-auto mb-3 text-red-600" size={32} />
          <h2 className="font-bold text-slate-900">Access Denied</h2>
          <p className="mt-2 text-sm text-slate-500">
            You don't have permission to view the Product Sales Report.
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen space-y-5 bg-[#F4F8FD] p-3 sm:p-5 lg:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2D6FE8]">
            Sales <ChevronRight size={13} /> Sales Report{" "}
            <ChevronRight size={13} /> Product Sales
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Product Sales Report
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View orders and their purchased products within a selected week
            range.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonClass}
            disabled={loading}
            onClick={() => void fetchOrders()}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
          {canExport && (
            <button
              type="button"
              className={primaryClass}
              disabled={loading || !!error || pending || !filteredOrders.length}
              onClick={exportCSV}
            >
              <Download size={16} /> Download CSV
            </button>
          )}
        </div>
      </header>

      <section className="rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={18} className="text-[#2D6FE8]" />
          <h2 className="text-sm font-semibold text-slate-900">
            Select Week Range
          </h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <label className="min-w-0 text-xs font-medium text-slate-600">
            From Week
            <select
              className={`${inputClass} mt-1.5`}
              value={draft.from}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, from: e.target.value }))
              }
            >
              {options.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0 text-xs font-medium text-slate-600">
            To Week
            <select
              className={`${inputClass} mt-1.5`}
              value={draft.to}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, to: e.target.value }))
              }
            >
              {options.map((w) => (
                <option
                  key={w.value}
                  value={w.value}
                  disabled={w.value < draft.from}
                >
                  {w.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyFilters}
              disabled={!draftBounds || loading}
              className={primaryClass}
            >
              <Filter size={15} /> Apply Filter
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className={buttonClass}
            >
              <X size={15} /> Reset
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
          <span className="text-slate-500">
            Selected dates:{" "}
            <strong className="text-slate-800">
              {draftBounds?.text || "From Week must not be after To Week"}
            </strong>
          </span>
          {pending && (
            <span className="font-medium text-amber-700">
              Apply filters to update the report.
            </span>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-[#DCE6F2] bg-white text-sm text-slate-500">
          <Loader2 className="animate-spin text-[#2D6FE8]" size={30} /> Loading
          orders…
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-100 bg-white p-8 text-center"
        >
          <ShieldAlert size={28} className="mx-auto mb-3 text-red-600" />
          <h3 className="font-semibold text-slate-900">
            Unable to load report
          </h3>
          <p className="my-3 text-sm text-slate-500">{error}</p>
          <button
            type="button"
            className={buttonClass}
            onClick={() => void fetchOrders()}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Total Orders"
              value={integer.format(summary.orders)}
              detail="Unique matching orders"
              icon={ShoppingBag}
              tone="bg-blue-50 text-[#2D6FE8]"
            />
            <SummaryCard
              title="Total Order Items"
              value={integer.format(summary.lines)}
              detail="Order product lines"
              icon={Layers3}
              tone="bg-violet-50 text-violet-700"
            />
            <SummaryCard
              title="Total Quantity"
              value={integer.format(summary.quantity)}
              detail="Units ordered"
              icon={Package}
              tone="bg-amber-50 text-amber-700"
            />
            <SummaryCard
              title="Total Order Value"
              value={inr.format(summary.value)}
              detail="Before refunds; all payment statuses"
              icon={IndianRupee}
              tone="bg-green-50 text-green-700"
            />
          </div>
          <section className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE6F2] p-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Orders & Products
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {activeBounds?.text} · {filteredOrders.length} orders
                </p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-400"
                />
                <input
                  aria-label="Search orders and products"
                  className={`${inputClass} pl-9 pr-9`}
                  placeholder="Search order, product, SKU…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="absolute right-3 top-3 text-slate-400"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            {!visibleOrders.length ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center p-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FileText size={23} />
                </div>
                <h3 className="font-semibold text-slate-900">
                  No orders found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {search
                    ? "Try a different search term."
                    : "No orders were placed in the selected week range."}
                </p>
              </div>
            ) : (
              <div className="space-y-4 bg-[#F8FAFD] p-3 sm:p-4">
                {visibleOrders.map((order) => {
                  const id = orderKey(order);
                  const isOpen = !collapsed.has(id);
                  const units = order.items.reduce(
                    (s, i) => s + num(i.quantity),
                    0,
                  );
                  return (
                    <article
                      key={id}
                      className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white"
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => toggleOrder(id)}
                        className="flex w-full flex-wrap items-center gap-3 bg-white p-3.5 text-left hover:bg-[#F8FAFD]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                          <ShoppingBag size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block break-all text-sm font-bold text-[#2D6FE8]">
                            {order.order_reference || `#${order.id}`}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {orderDay(order.order_date)} ·{" "}
                            {order.user?.name || "—"} · {order.items.length}{" "}
                            items / {units} units
                          </span>
                        </span>
                        <Status value={order.order_status} />
                        <span className="min-w-[100px] text-right">
                          <span className="block text-[10px] text-slate-500">
                            Order value
                          </span>
                          <span className="block text-sm font-bold text-slate-900">
                            {money(order.total_payable)}
                          </span>
                        </span>
                        <ChevronDown
                          size={17}
                          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="overflow-x-auto border-t border-[#DCE6F2]">
                          <table className="w-full min-w-[950px] text-left text-xs">
                            <thead className="bg-[#F4F8FD] text-[11px] uppercase tracking-wide text-slate-500">
                              <tr>
                                {[
                                  "Product",
                                  "Brand / Category",
                                  "Qty",
                                  "Unit Price",
                                  "GST",
                                  "Delivery",
                                  "Item Total",
                                  "Item Status",
                                ].map((h, idx) => (
                                  <th
                                    key={h}
                                    scope="col"
                                    className={`whitespace-nowrap px-3 py-3 font-semibold ${idx >= 2 && idx <= 6 ? "text-right" : ""}`}
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {order.items.length ? (
                                order.items.map((item) => (
                                  <tr
                                    key={String(item.line_id)}
                                    className="hover:bg-slate-50/70"
                                  >
                                    <td className="px-3 py-3">
                                      <div className="flex items-center gap-2.5">
                                        <ProductImage item={item} />
                                        <div className="min-w-[140px] max-w-[250px]">
                                          <p className="font-semibold text-slate-900">
                                            {item.product_name || "—"}
                                          </p>
                                          <p className="mt-1 text-[11px] text-slate-500">
                                            SKU: {item.product_code || "—"}
                                          </p>
                                          {item.invoice?.invoice_number && (
                                            <p className="mt-0.5 text-[10px] text-slate-500">
                                              {item.invoice.invoice_number}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-3">
                                      <p className="font-medium text-slate-800">
                                        {item.brand_name || "—"}
                                      </p>
                                      <p className="mt-1 text-[11px] text-slate-500">
                                        {item.category_name || "—"}
                                      </p>
                                    </td>
                                    <td className="px-3 py-3 text-right tabular-nums">
                                      {item.quantity ?? "—"}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                                      {money(item.unit_price)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                                      {money(item.gst_amount)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                                      {money(item.delivery_charges)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                                      {money(item.line_total)}
                                    </td>
                                    <td className="px-3 py-3">
                                      <Status value={item.delivery_status} />
                                      {item.return_status &&
                                        item.return_status !== "none" && (
                                          <p className="mt-1 text-[10px] text-amber-700">
                                            Return: {label(item.return_status)}
                                          </p>
                                        )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan={8}
                                    className="p-5 text-center text-slate-500"
                                  >
                                    No items returned for this order.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                          <div className="flex flex-wrap justify-between gap-2 border-t border-[#DCE6F2] bg-[#FAFCFF] px-4 py-2.5 text-xs text-slate-500">
                            <span>
                              Payment: <Status value={order.payment_status} />
                            </span>
                            <span>
                              Items total:{" "}
                              <strong className="text-slate-900">
                                {inr.format(
                                  order.items.reduce(
                                    (s, i) => s + num(i.line_total),
                                    0,
                                  ),
                                )}
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE6F2] p-4 text-xs text-slate-500">
              <span>
                Showing{" "}
                {filteredOrders.length ? (safePage - 1) * PAGE_SIZE + 1 : 0}–
                {Math.min(safePage * PAGE_SIZE, filteredOrders.length)} of{" "}
                {filteredOrders.length} orders
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={safePage <= 1}
                  onClick={() => setPage(safePage - 1)}
                  className={buttonClass}
                >
                  <ChevronLeft size={15} />
                </button>
                <span>
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage(safePage + 1)}
                  className={buttonClass}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </section>
          <p className="px-1 text-[11px] text-slate-500">
            Order date in IST · All order statuses included · Order value is the
            API total_payable, counted once per order, not net revenue.
          </p>
        </>
      )}
    </div>
  );
};
export default ProductSalesReport;
