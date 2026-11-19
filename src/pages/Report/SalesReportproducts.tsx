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
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Percent,
  Wallet,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-hot-toast";
import salesReportApi, {
  SalesReportItem,
} from "../../api/endpoints/report/salesReport";
import { usePermissions } from "../permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";
/* ================= THEME ================= */
const THEME = {
  primary: "#2D6FE8",
  primaryDark: "#1E40AF",
  primarySoft: "#EAF3FF",
  background: "#F4F8FD",
  border: "#DCE6F2",
  text: "#111827",
  muted: "#6B7280",
  green: "#15803D",
  greenSoft: "#DCFCE7",
  orange: "#C2410C",
  orangeSoft: "#FFEDD5",
  purple: "#6D28D9",
  purpleSoft: "#EDE9FE",
  red: "#C23B32",
  redSoft: "#FEE2E2",
};
const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";
/* ================= HELPERS ================= */
const money = (value: number | null | undefined) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};
const numberFormat = (value: number | null | undefined) => {
  return Number(value || 0).toLocaleString("en-IN");
};
const safeValue = (value: unknown) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }
  return String(value);
};
const formatDate = (value: string | null) => {
  if (!value) return "—";
  // API format: 17-11-2026 14:57
  const match = value.match(
    /^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?$/
  );
  if (match) {
    const [, day, month, year, hour, minute] = match;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour || 0),
      Number(minute || 0)
    );
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: hour ? "2-digit" : undefined,
      minute: minute ? "2-digit" : undefined,
    });
  }
  return value;
};
const getStatusStyle = (status: string) => {
  const value = (status || "").toLowerCase();
  if (
    value === "delivered" ||
    value === "completed" ||
    value === "success"
  ) {
    return {
      bg: THEME.greenSoft,
      color: THEME.green,
    };
  }
  if (
    value === "cancelled" ||
    value === "canceled" ||
    value === "failed" ||
    value === "refunded"
  ) {
    return {
      bg: THEME.redSoft,
      color: THEME.red,
    };
  }
  if (
    value === "shipped" ||
    value === "processing" ||
    value === "partial_delivered" ||
    value === "partially_delivered" ||
    value === "partial_shipped" ||
    value === "partial_refunded"
  ) {
    return {
      bg: THEME.purpleSoft,
      color: THEME.purple,
    };
  }
  if (
    value === "dispatched" ||
    value === "confirmed" ||
    value === "pending"
  ) {
    return {
      bg: THEME.orangeSoft,
      color: THEME.orange,
    };
  }
  return {
    bg: "#F3F4F6",
    color: "#4B5563",
  };
};
const escapeCsv = (value: unknown) => {
  let text = value === null || value === undefined ? "" : String(value);
  // Prevent spreadsheet formula execution without modifying numeric values.
  if (typeof value === "string" && /^[\s]*[=+@-]|^[\t\r\n]/.test(text) && !/^-?\d+(?:\.\d+)?$/.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
};
/* ================= BADGE ================= */
const StatusBadge = ({
  status,
}: {
  status: string;
}) => {
  const style = getStatusStyle(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize"
      style={{
        background: style.bg,
        color: style.color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: style.color }}
      />
      {status ? statusLabel(status) : "Unknown"}
    </span>
  );
};
/* ================= COMPACT SUMMARY CARD ================= */
const CompactSummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bg,
  isMoney = false,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  isMoney?: boolean;
}) => (
  <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#DCE6F2] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
      style={{ background: bg, color }}
    >
      <Icon size={17} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {title}
      </p>
      <h3 className="mt-0.5 break-words text-sm font-bold tracking-tight text-gray-900 sm:text-base">
        {isMoney ? money(value) : numberFormat(value)}
      </h3>
      <p className="mt-0.5 truncate text-[9px] text-gray-400">
        {subtitle}
      </p>
    </div>
  </div>
);
/* ================= DETAIL ITEM ================= */
const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="min-w-0">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      {label}
    </p>
    <div className="mt-1 break-words text-xs font-semibold text-gray-700">
      {value ?? "—"}
    </div>
  </div>
);
/* ================= MOBILE CARD ================= */
const MobileSalesCard = ({
  item,
}: {
  item: SalesReportItem;
}) => {
  return (
    <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Bill ID
            </p>
            <p className="mt-1 break-all text-sm font-bold text-gray-900">
              {item["Bill Id"]}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {formatDate(item["Order Date"])}
            </p>
          </div>
          <StatusBadge status={item["Order Status"]} />
        </div>
        <div className="mt-4 rounded-lg bg-[#F7FAFE] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400">
                Customer
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                {item["Customer Name"]}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {item["Customer Mobile"]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400">
                Net Order Amount
              </p>
              <p className="mt-1 text-base font-bold text-[#2D6FE8]">
                {money(item["Net Order Amount"])}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <DetailItem
            label="Order Amount"
            value={money(item["Order Amount"])}
          />
          <DetailItem
            label="Refunded Amount"
            value={money(item["Refunded Amount"])}
          />
          <DetailItem
            label="Total Items"
            value={item["Total Items"]}
          />
          <DetailItem
            label="Total Tax"
            value={money(item["Total Tax"])}
          />
          <DetailItem
            label="Delivery Status"
            value={
              <StatusBadge status={item["Delivery Status"]} />
            }
          />
          <DetailItem
            label="Shipping State"
            value={item["Customer Shipping State"]}
          />
        </div>
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <DetailItem
              label="Gross Total"
              value={money(item["Gross Total"])}
            />
            <DetailItem
              label="Total List Price"
              value={money(item["Total List Price"])}
            />
            <DetailItem
              label="Discount"
              value={money(item["Discount Amount"])}
            />
            <DetailItem
              label="Shipping Charge"
              value={money(item["Shipping Charge"])}
            />
            <DetailItem
              label="CV"
              value={numberFormat(item.CV)}
            />
            <DetailItem
              label="Username"
              value={safeValue(item["User Name"])}
            />
          </div>
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="mb-3 text-xs font-bold text-gray-800">
              Tax Breakdown
            </p>
            <div className="grid grid-cols-3 gap-2">
              <DetailItem
                label="CGST"
                value={money(item.CGST)}
              />
              <DetailItem
                label="SGST"
                value={money(item.SGST)}
              />
              <DetailItem
                label="IGST"
                value={money(item.IGST)}
              />
            </div>
          </div>
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="mb-3 text-xs font-bold text-gray-800">
              Customer Information
            </p>
            <div className="space-y-3">
              <DetailItem
                label="Customer GSTIN"
                value={safeValue(item["Customer GSTIN"])}
              />
              <DetailItem
                label="Shipping State"
                value={safeValue(item["Customer Shipping State"])}
              />
              <DetailItem
                label="Shipping Date"
                value={formatDate(item["Shipping Date"])}
              />
            </div>
          </div>
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="mb-3 text-xs font-bold text-gray-800">Order Timeline</p>
            <div className="grid grid-cols-2 gap-3">
              {["Confirmed At", "Dispatched At", "Delivered At", "Refunded At"].map((field) => (
                <DetailItem key={field} label={field} value={formatDate(String(readField(item, field) ?? ""))} />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="mb-3 text-xs font-bold text-gray-800">
              Refund Information
            </p>
            <div className="grid grid-cols-2 gap-3">
              <DetailItem
                label="Is Refunded"
                value={item["Is Refunded"]}
              />
              <DetailItem
                label="Refund Status"
                value={safeValue(item["Refund Status"])}
              />
              <DetailItem
                label="Refunded Items"
                value={safeValue(item["Refunded Items"])}
              />
              <DetailItem
                label="Last Refund Date"
                value={formatDate(item["Last Refund Date"])}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
/* ================= FILTER CONFIGURATION ================= */
const DATE_FIELDS = [
  "Order Date", "Shipping Date", "Confirmed At", "Dispatched At",
  "Delivered At", "Refunded At", "Last Refund Date",
] as const;
const NUMBER_FIELDS = [
  "Gross Total", "Order Amount", "Net Order Amount", "Refunded Amount",
  "Total Tax", "CGST", "SGST", "IGST", "Total List Price",
  "Discount Amount", "Shipping Charge", "Total Items", "Refunded Items", "CV",
] as const;
const TEXT_FIELDS = ["Bill Id", "Customer Name", "Customer Mobile", "Customer GSTIN", "User Name"] as const;
const CSV_FIELDS = [
  "Bill Id", "Order Date", "Customer Name", "Customer Mobile", "Gross Total",
  "Order Amount", "Refunded Amount", "Net Order Amount", "Order Status",
  "Total Items", "Total Tax", "CGST", "SGST", "IGST", "Total List Price",
  "Discount Amount", "CV", "User Name", "Customer GSTIN", "Shipping Date",
  "Confirmed At", "Dispatched At", "Delivered At", "Refunded At",
  "Customer Shipping State", "Shipping Charge", "Delivery Status", "Is Refunded",
  "Refund Status", "Refunded Items", "Last Refund Date",
] as const;
type DateField = (typeof DATE_FIELDS)[number];
type NumberField = (typeof NUMBER_FIELDS)[number];
type TextField = (typeof TEXT_FIELDS)[number];
type Range = { field: NumberField; min: string; max: string };
type Filters = {
  search: string; orderStatus: string; deliveryStatus: string; refund: string;
  state: string; gstin: string; taxType: string;
  dateField: DateField; preset: string; fromDate: string; toDate: string;
  fromTime: string; toTime: string; dateAvailability: string;
  sort: string; text: Partial<Record<TextField, string>>; ranges: Range[];
};
const initialFilters = (): Filters => ({
  search: "", orderStatus: "all", deliveryStatus: "all", refund: "all",
  state: "all", gstin: "all", taxType: "all",
  dateField: "Order Date", preset: "all", fromDate: "", toDate: "",
  fromTime: "", toTime: "", dateAvailability: "all", sort: "newest",
  text: {}, ranges: [],
});
const readField = (item: SalesReportItem, key: string): unknown =>
  (item as unknown as Record<string, unknown>)[key];
const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();
const numeric = (value: unknown) => {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
// API contains timezone-less DD-MM-YYYY HH:mm values. Compare as business wall-clock
// dates, not as browser local timestamps; no timezone conversion of API values.
const parseReportDate = (value: unknown) => {
  const match = String(value ?? "").trim().match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;
  const [, d, m, y, h, min, sec] = match;
  const stamp = Date.UTC(+y, +m - 1, +d, +(h || 0), +(min || 0), +(sec || 0));
  const check = new Date(stamp);
  if (check.getUTCFullYear() !== +y || check.getUTCMonth() !== +m - 1 || check.getUTCDate() !== +d || +(h || 0) > 23 || +(min || 0) > 59 || +(sec || 0) > 59) return null;
  return { date: `${y}-${m}-${d}`, time: h === undefined ? null : `${h}:${min}`, stamp };
};
const todayIST = () => {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
};
const shiftDate = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const presetDates = (preset: string) => {
  const today = todayIST();
  switch (preset) {
    case "today": return { fromDate: today, toDate: today };
    case "yesterday": return { fromDate: shiftDate(today, -1), toDate: shiftDate(today, -1) };
    case "last7": return { fromDate: shiftDate(today, -6), toDate: today };
    case "last30": return { fromDate: shiftDate(today, -29), toDate: today };
    case "month": return { fromDate: `${today.slice(0, 7)}-01`, toDate: today };
    case "year": return { fromDate: `${today.slice(0, 4)}-01-01`, toDate: today };
    default: return { fromDate: "", toDate: "" };
  }
};
const isRefundedItem = (item: SalesReportItem) =>
  ["true", "1", "yes"].includes(normalize(readField(item, "Is Refunded"))) ||
  (numeric(readField(item, "Refunded Amount")) ?? 0) > 0 ||
  (numeric(readField(item, "Refunded Items")) ?? 0) > 0 ||
  ["refunded", "partial_refunded", "partially_refunded"].includes(normalize(readField(item, "Order Status")));
const fieldClass = "h-10 w-full min-w-0 rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block min-w-0 space-y-1.5">
    <span className="block text-[11px] font-semibold text-gray-600">{label}</span>
    {children}
  </label>
);
const SelectFilter = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
  <Field label={label}><select className={fieldClass} value={value} onChange={(e) => onChange(e.target.value)}>
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select></Field>
);
const statusLabel = (value: string) => value
  .replace(/^partial_/, "partially_")
  .replace(/_/g, " ")
  .replace(/\b\w/g, (c) => c.toUpperCase());
const choices = (allLabel: string, values: string[]) => [
  { value: "all", label: allLabel }, ...values.map((value) => ({ value, label: statusLabel(value) })),
];
const DATE_PRESETS = [
  { value: "all", label: "All time" }, { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" }, { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" }, { value: "month", label: "This month" },
  { value: "year", label: "This year" }, { value: "custom", label: "Custom range" },
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest selected date" }, { value: "oldest", label: "Oldest selected date" },
  { value: "amount_high", label: "Highest order amount" }, { value: "amount_low", label: "Lowest order amount" },
];

/* ================= MAIN PAGE ================= */
const SalesReportproducts = () => {
  /* ---------- PERMISSIONS ---------- */
  const {
    hasPermission,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();
  // Can user view this report?
  const canViewReport =
    isSuperAdmin || hasPermission("sales_report.view");
  // Can user export CSV?
  const canExport =
    canViewReport &&
    (isSuperAdmin || hasPermission("sales_report.download"));
  /* ---------- LOGO ---------- */
  const [logoUrl, setLogoUrl] = useState<string | null>(
    DEFAULT_LOGO_URL
  );
  const [logoLoading, setLogoLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const fetchLogo = async () => {
      try {
        const response: any = await logoApi.getLogo();
        const possibleLogos: unknown[] = [
          response?.data?.data?.logo,
          response?.data?.logo,
          response?.data?.data?.data?.logo,
          response?.data?.data?.logo_url,
          response?.data?.logo_url,
          response?.logo,
        ];
        const resolvedLogo = possibleLogos.find(
          (value): value is string =>
            typeof value === "string" &&
            /^https?:\/\//i.test(value.trim())
        );
        if (!cancelled && resolvedLogo) {
          setLogoUrl(resolvedLogo.trim());
        }
      } catch (error) {
        console.error("Logo API error:", error);
      } finally {
        if (!cancelled) {
          setLogoLoading(false);
        }
      }
    };
    void fetchLogo();
    return () => {
      cancelled = true;
    };
  }, []);
  /* ---------- DATA ---------- */
  const [reports, setReports] = useState<SalesReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadedPages, setLoadedPages] = useState(0);
  const [expectedPages, setExpectedPages] = useState(1);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [advanced, setAdvanced] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const requestId = useRef(0);
  const setFilter = <K extends keyof Filters,>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };
  const setPreset = (preset: string) => {
    setFilters((prev) => ({ ...prev, preset, ...(preset === "custom" ? {} : presetDates(preset)) }));
    setCurrentPage(1);
  };
  const setDate = (key: "fromDate" | "toDate", value: string) => {
    setFilters((prev) => ({ ...prev, preset: "custom", [key]: value }));
    setCurrentPage(1);
  };
  /* ================= FETCH ALL API PAGES ================= */
  // Uses only the existing, demonstrated page/per_page API parameters.
  const fetchReports = useCallback(async (showLoader = true) => {
    if (!canViewReport || permissionsLoading) return;
    const id = ++requestId.current;
    setLoading(showLoader);
    setRefreshing(!showLoader);
    setErrorMessage("");
    setLoadedPages(0);
    setExpectedPages(1);
    try {
      const all: SalesReportItem[] = [];
      let pages = 1;
      let expectedTotal: number | undefined;
      for (let page = 1; page <= pages; page++) {
        const response = await salesReportApi.getAll({ page, per_page: 100 });
        if (id !== requestId.current) return;
        if (!response.success || !Array.isArray(response.data)) throw new Error("Unable to fetch sales report");
        if (page === 1) {
          expectedTotal = response.meta?.total == null ? undefined : Number(response.meta.total);
          pages = Number(response.meta?.last_page ?? 1);
          if (!Number.isSafeInteger(pages) || pages < 1) throw new Error("Invalid sales report pagination");
          setExpectedPages(pages);
        } else if (Number(response.meta?.last_page ?? pages) !== pages || (expectedTotal !== undefined && Number(response.meta?.total) !== expectedTotal)) {
          throw new Error("Sales records changed during loading. Please refresh.");
        }
        const returnedPage = (response.meta as { current_page?: number } | undefined)?.current_page;
        if (returnedPage != null && Number(returnedPage) !== page) throw new Error("Unexpected sales report page");
        all.push(...response.data);
        setLoadedPages(page);
      }
      const unique = new Map(all.map((item) => [String(item["Bill Id"]), item]));
      if (unique.size !== all.length || (expectedTotal !== undefined && unique.size !== Number(expectedTotal))) throw new Error("Sales records changed during loading. Please refresh.");
      setReports(Array.from(unique.values()));
      setCurrentPage(1);
    } catch (error: any) {
      if (id !== requestId.current) return;
      const message = error?.response?.data?.message || error?.message || "Failed to fetch sales report";
      setReports([]);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (id === requestId.current) { setLoading(false); setRefreshing(false); }
    }
  }, [canViewReport, permissionsLoading]);
  useEffect(() => {
    if (permissionsLoading || !canViewReport) {
      setReports([]);
      if (!permissionsLoading) setLoading(false);
    } else { void fetchReports(); }
    return () => { requestId.current += 1; };
  }, [permissionsLoading, canViewReport, fetchReports]);
  /* ================= FILTER DATA ================= */
  const options = useMemo(() => {
    const distinct = (field: string) => Array.from(new Set(reports.map((item) => normalize(readField(item, field))).filter(Boolean))).sort();
    return { order: distinct("Order Status"), delivery: distinct("Delivery Status"), refund: distinct("Refund Status"), state: distinct("Customer Shipping State") };
  }, [reports]);
  const invalidRange = (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate)
    ? "From date cannot be after to date."
    : filters.ranges.some((r) => r.min !== "" && r.max !== "" && Number(r.min) > Number(r.max))
      ? "Minimum value cannot exceed maximum value." : "";
  const filteredReports = useMemo(() => {
    if (invalidRange) return [];
    const query = normalize(filters.search);
    const matches = reports.filter((item) => {
      const get = (field: string) => readField(item, field);
      const equals = (selection: string, field: string) => selection === "all" || normalize(get(field)) === selection;
      if (query && !CSV_FIELDS.some((field) => normalize(get(field)).includes(query))) return false;
      if (!equals(filters.orderStatus, "Order Status") || !equals(filters.deliveryStatus, "Delivery Status") || !equals(filters.state, "Customer Shipping State")) return false;
      const refunded = isRefundedItem(item);
      const refundStatus = normalize(get("Refund Status"));
      if (filters.refund === "refunded" && !refunded) return false;
      if (filters.refund === "not_refunded" && refunded) return false;
      if (filters.refund === "missing_status" && (!refunded || refundStatus)) return false;
      if (filters.refund.startsWith("status:") && refundStatus !== filters.refund.slice(7)) return false;
      if (filters.gstin !== "all" && (filters.gstin === "present") !== !!normalize(get("Customer GSTIN"))) return false;
      if (filters.taxType !== "all") {
        const cgst = (numeric(get("CGST")) ?? 0) > 0;
        const sgst = (numeric(get("SGST")) ?? 0) > 0;
        const igst = (numeric(get("IGST")) ?? 0) > 0;
        const hasTax = cgst || sgst || igst || (numeric(get("Total Tax")) ?? 0) > 0;
        if (filters.taxType === "none" ? hasTax : filters.taxType === "intra" ? !(cgst && sgst && !igst) : filters.taxType === "igst" ? !igst : filters.taxType === "cgst" ? !cgst : !sgst) return false;
      }
      for (const field of TEXT_FIELDS) {
        if (filters.text[field] && !normalize(get(field)).includes(normalize(filters.text[field]))) return false;
      }
      for (const range of filters.ranges) {
        if (range.min === "" && range.max === "") continue;
        const value = numeric(get(range.field));
        if (value === null || (range.min !== "" && value < Number(range.min)) || (range.max !== "" && value > Number(range.max))) return false;
      }
      const rawDate = get(filters.dateField);
      const date = parseReportDate(rawDate);
      if (filters.dateAvailability === "missing" && normalize(rawDate)) return false;
      if (filters.dateAvailability === "present" && !date) return false;
      if (filters.fromDate || filters.toDate || filters.fromTime || filters.toTime) {
        if (!date) return false;
        if (filters.fromDate && date.date < filters.fromDate) return false;
        if (filters.toDate && date.date > filters.toDate) return false;
        // Time range applies to each selected day; overnight spans are supported.
        if (filters.fromTime || filters.toTime) {
          if (date.time === null) return false;
          const { fromTime: from, toTime: to } = filters;
          if (from && to && from > to) { if (date.time < from && date.time > to) return false; }
          else if ((from && date.time < from) || (to && date.time > to)) return false;
        }
      }
      return true;
    });
    return matches.sort((a, b) => {
      if (filters.sort === "amount_high" || filters.sort === "amount_low") {
        const x = numeric(readField(a, "Order Amount")); const y = numeric(readField(b, "Order Amount"));
        if (x === null) return y === null ? 0 : 1; if (y === null) return -1;
        return filters.sort === "amount_high" ? y - x : x - y;
      }
      const x = parseReportDate(readField(a, filters.dateField))?.stamp;
      const y = parseReportDate(readField(b, filters.dateField))?.stamp;
      if (x === undefined) return y === undefined ? 0 : 1; if (y === undefined) return -1;
      return filters.sort === "oldest" ? x - y : y - x;
    });
  }, [reports, filters, invalidRange]);
  const totalRecords = filteredReports.length;
  const lastPage = Math.max(1, Math.ceil(totalRecords / perPage));
  const activePage = Math.min(currentPage, lastPage);
  const paginatedReports = useMemo(() => filteredReports.slice((activePage - 1) * perPage, activePage * perPage), [filteredReports, activePage, perPage]);
  const clearFilters = () => { setFilters(initialFilters()); setCurrentPage(1); };
  const advancedFilterCount = [
    filters.deliveryStatus !== "all", filters.refund !== "all", filters.taxType !== "all",
    Boolean(filters.fromTime || filters.toTime), filters.gstin !== "all",
    filters.dateAvailability !== "all",
    ...TEXT_FIELDS.map((field) => Boolean(filters.text[field]?.trim())),
    ...filters.ranges.map((range) => Boolean(range.min !== "" || range.max !== "")),
  ].filter(Boolean).length;
  const refundOptions = [
    { value: "all", label: "All orders" },
    { value: "refunded", label: "Refunded (full or partial)" },
    { value: "not_refunded", label: "Not refunded" },
    ...options.refund.map((value) => ({ value: `status:${value}`, label: `Refund status: ${statusLabel(value)}` })),
    { value: "missing_status", label: "Refunded — status not provided" },
  ];

  /* ================= SUMMARY ================= */
  const summary = useMemo(() => {
    return filteredReports.reduce(
      (acc, item) => {
        acc.orderAmount += Number(item["Order Amount"] || 0);
        acc.netAmount += Number(item["Net Order Amount"] || 0);
        acc.grossTotal += Number(item["Gross Total"] || 0);
        acc.refunded += Number(item["Refunded Amount"] || 0);
        acc.tax += Number(item["Total Tax"] || 0);
        acc.items += Number(item["Total Items"] || 0);
        return acc;
      },
      {
        orderAmount: 0,
        netAmount: 0,
        grossTotal: 0,
        refunded: 0,
        tax: 0,
        items: 0,
      }
    );
  }, [filteredReports]);
  /* ================= CSV EXPORT ================= */
  const exportCSV = () => {
    if (!canExport) {
      toast.error("You don't have permission to export this report.");
      return;
    }
    if (loading || refreshing || errorMessage || !filteredReports.length) {
      toast.error("No sales records available to export");
      return;
    }
    const headers = CSV_FIELDS;
    const rows = filteredReports.map((item) => headers.map((header) => escapeCsv(readField(item, header))));
    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\r\n");
    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Sales report exported successfully");
  };
  /* ================= PAGINATION ================= */
  const startRecord =
    totalRecords === 0
      ? 0
      : (activePage - 1) * perPage + 1;
  const endRecord = Math.min(
    activePage * perPage,
    totalRecords
  );
  /* ================= LOADING ================= */
  const pageLoading = permissionsLoading || logoLoading;
  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }
  /* ================= ACCESS DENIED ================= */
  if (!canViewReport) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#C23B32]">
            <ShieldAlert size={26} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to view the Sales Report.
          </p>
        </div>
      </div>
    );
  }
  /* ================= UI ================= */
  return (
    <div
      className="min-h-screen space-y-5 p-3 sm:p-5 lg:p-6"
      style={{ background: THEME.background }}
    >
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2D6FE8]">
            <span>Reports</span>
            <ChevronRight size={13} />
            <span>Sales Report</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            Sales Report
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor sales, orders, revenue, taxes and customer transactions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchReports(false)}
            disabled={refreshing || loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
          {canExport && (
            <button
              type="button"
              onClick={exportCSV}
              disabled={loading || refreshing || !!errorMessage || !filteredReports.length}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          )}
        </div>
      </div>
      {/* COMPACT SUMMARY CARDS — 6 in one row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <CompactSummaryCard
          title="Total Orders"
          value={totalRecords}
          subtitle="Matching orders"
          icon={ShoppingCart}
          color="#2D6FE8"
          bg="#EAF3FF"
        />
        <CompactSummaryCard
          title="Order Amount"
          value={summary.orderAmount}
          subtitle="Filtered records"
          icon={IndianRupee}
          color="#15803D"
          bg="#DCFCE7"
          isMoney
        />
        <CompactSummaryCard
          title="Net Sales"
          value={summary.netAmount}
          subtitle="After refunds"
          icon={TrendingUp}
          color="#6D28D9"
          bg="#EDE9FE"
          isMoney
        />
        <CompactSummaryCard
          title="Refunded"
          value={summary.refunded}
          subtitle="Refund amount"
          icon={Wallet}
          color="#C23B32"
          bg="#FEE2E2"
          isMoney
        />
        <CompactSummaryCard
          title="Gross Total"
          value={summary.grossTotal}
          subtitle="Filtered records"
          icon={IndianRupee}
          color="#2D6FE8"
          bg="#EAF3FF"
          isMoney
        />
        <CompactSummaryCard
          title="Total Tax"
          value={summary.tax}
          subtitle="CGST+SGST+IGST"
          icon={Percent}
          color="#C2410C"
          bg="#FFEDD5"
          isMoney
        />
      </div>
      {/* SEARCH AND ADVANCED FILTERS */}
      <div className="space-y-4 rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search size={17} className="text-[#2D6FE8]" />
            <div><h2 className="text-sm font-bold text-gray-800">Search & Filters</h2><p className="mt-1 text-xs text-gray-500">Find records across all pages.</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setAdvanced((v) => !v)} aria-expanded={advanced} className="rounded-lg border border-[#DCE6F2] px-3 py-2 text-xs font-semibold text-[#2D6FE8] hover:bg-[#EAF3FF]">{advanced ? "Hide advanced filters" : "Advanced filters"}{advancedFilterCount > 0 && <span className="ml-2 rounded-full bg-[#EAF3FF] px-2 py-0.5 text-[10px]">{advancedFilterCount}</span>}</button>
            <button type="button" onClick={clearFilters} className="flex items-center gap-1 rounded-lg border border-[#DCE6F2] px-3 py-2 text-xs font-semibold text-gray-600 hover:text-red-600"><X size={14} /> Reset all</button>
          </div>
        </div>
        {/* PRIMARY FILTERS */}
        <Field label="Search sales records">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-3 text-gray-400" />
            <input className={`${fieldClass} pl-9`} value={filters.search} placeholder="Search bill, customer, mobile, distributor, GSTIN..." onChange={(e) => setFilter("search", e.target.value)} />
          </div>
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SelectFilter label="Order status" value={filters.orderStatus} onChange={(v) => setFilter("orderStatus", v)} options={choices("All order statuses", options.order)} />
          <SelectFilter label="Date type" value={filters.dateField} onChange={(v) => setFilter("dateField", v as DateField)} options={DATE_FIELDS.map((value) => ({ value, label: value }))} />
          <SelectFilter label="Date range" value={filters.preset} onChange={setPreset} options={DATE_PRESETS} />
          <SelectFilter label="Shipping state" value={filters.state} onChange={(v) => setFilter("state", v)} options={choices("All states", options.state)} />
        </div>
        {filters.preset === "custom" && (
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-[#DCE6F2] bg-[#F7FAFE] p-3 sm:grid-cols-2">
            <Field label="From date"><input type="date" className={fieldClass} value={filters.fromDate} onChange={(e) => setDate("fromDate", e.target.value)} /></Field>
            <Field label="To date"><input type="date" className={fieldClass} value={filters.toDate} onChange={(e) => setDate("toDate", e.target.value)} /></Field>
          </div>
        )}
        {/* ADVANCED FILTERS: independent delivery and refund criteria */}
        {advanced && <div className="space-y-4 border-t border-[#DCE6F2] pt-4">
          <div className="rounded-lg border border-[#DCE6F2] bg-[#F7FAFE] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-800">Time range <span className="font-normal text-gray-500">· IST assumed</span></p>
              {(filters.fromTime || filters.toTime) && <button type="button" onClick={() => { setFilters((prev) => ({ ...prev, fromTime: "", toTime: "" })); setCurrentPage(1); }} className="text-xs font-semibold text-[#2D6FE8]">Clear time</button>}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="From time"><input type="time" className={fieldClass} value={filters.fromTime} onChange={(e) => setFilter("fromTime", e.target.value)} /></Field>
              <Field label="To time"><input type="time" className={fieldClass} value={filters.toTime} onChange={(e) => setFilter("toTime", e.target.value)} /></Field>
            </div>
            <p className="mt-2 text-[11px] text-gray-500">Applied to {filters.dateField.toLowerCase()} on each selected date. Overnight ranges (22:00–02:00) are supported.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <SelectFilter label="Delivery status" value={filters.deliveryStatus} onChange={(v) => setFilter("deliveryStatus", v)} options={choices("All delivery statuses", options.delivery)} />
            <SelectFilter label="Refund" value={filters.refund} onChange={(v) => setFilter("refund", v)} options={refundOptions} />
            <SelectFilter label="Tax type" value={filters.taxType} onChange={(v) => setFilter("taxType", v)} options={[{ value: "all", label: "All taxes" }, { value: "igst", label: "IGST" }, { value: "intra", label: "CGST + SGST" }, { value: "cgst", label: "Has CGST" }, { value: "sgst", label: "Has SGST" }, { value: "none", label: "No reported tax" }]} />
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold text-gray-800">Customer & record details</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {TEXT_FIELDS.map((field) => <Field key={field} label={field}><input className={fieldClass} value={filters.text[field] ?? ""} placeholder={`Search ${field.toLowerCase()}`} onChange={(e) => { const value = e.target.value; setFilters((prev) => ({ ...prev, text: { ...prev.text, [field]: value } })); setCurrentPage(1); }} /></Field>)}
              <SelectFilter label="GSTIN availability" value={filters.gstin} onChange={(v) => setFilter("gstin", v)} options={[{ value: "all", label: "All customers" }, { value: "present", label: "GSTIN provided" }, { value: "missing", label: "Without GSTIN" }]} />
              <SelectFilter label="Selected date availability" value={filters.dateAvailability} onChange={(v) => setFilter("dateAvailability", v)} options={[{ value: "all", label: "All records" }, { value: "present", label: "Date available" }, { value: "missing", label: "Date not provided" }]} />
            </div>
          </div>
          <div className="space-y-3 rounded-lg border border-[#DCE6F2] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold text-gray-800">Amount, tax & quantity ranges</p><p className="mt-1 text-[11px] text-gray-500">Combine multiple minimum and maximum filters.</p></div>
              <button type="button" disabled={filters.ranges.length >= NUMBER_FIELDS.length} onClick={() => { const field = NUMBER_FIELDS.find((f) => !filters.ranges.some((r) => r.field === f)); if (field) setFilter("ranges", [...filters.ranges, { field, min: "", max: "" }]); }} className="rounded-lg border border-[#DCE6F2] px-3 py-2 text-xs font-semibold text-[#2D6FE8] disabled:opacity-40">+ Add range</button></div>
            {filters.ranges.map((range, index) => <div key={index} className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <SelectFilter label="Field" value={range.field} onChange={(v) => setFilter("ranges", filters.ranges.map((r, i) => i === index ? { ...r, field: v as NumberField } : r))} options={NUMBER_FIELDS.filter((f) => f === range.field || !filters.ranges.some((r) => r.field === f)).map((value) => ({ value, label: value }))} />
              <Field label="Minimum"><input type="number" step="any" className={fieldClass} value={range.min} placeholder="No minimum" onChange={(e) => setFilter("ranges", filters.ranges.map((r, i) => i === index ? { ...r, min: e.target.value } : r))} /></Field>
              <Field label="Maximum"><input type="number" step="any" className={fieldClass} value={range.max} placeholder="No maximum" onChange={(e) => setFilter("ranges", filters.ranges.map((r, i) => i === index ? { ...r, max: e.target.value } : r))} /></Field>
              <button type="button" aria-label={`Remove ${range.field} filter`} onClick={() => setFilter("ranges", filters.ranges.filter((_, i) => i !== index))} className="flex h-10 items-center justify-center rounded-lg border border-[#DCE6F2] px-3 text-gray-500 hover:text-red-600"><X size={16} /></button>
            </div>)}
          </div>
        </div>}
        {!advanced && (filters.fromTime || filters.toTime) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF3FF] px-3 py-1.5 text-xs font-medium text-[#1E40AF]">
              {filters.dateField}: {filters.fromTime || "00:00"} – {filters.toTime || "23:59"} IST
              <button type="button" aria-label="Remove time filter" onClick={() => { setFilters((prev) => ({ ...prev, fromTime: "", toTime: "" })); setCurrentPage(1); }}><X size={13} /></button>
            </span>
          </div>
        )}
        {invalidRange && <p role="alert" className="text-xs font-semibold text-red-600">{invalidRange}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE6F2] pt-3 text-xs text-gray-500"><span>{loading ? "Loading records..." : refreshing ? "Refreshing — showing previous data" : `${totalRecords.toLocaleString("en-IN")} matching of ${reports.length.toLocaleString("en-IN")} loaded orders`}</span><span>Filters combine automatically</span></div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-[#DCE6F2] p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Sales Records
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Complete order, payment and tax information
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <span className="mb-1 w-fit rounded-full bg-[#EAF3FF] px-3 py-1.5 text-xs font-semibold text-[#1E40AF]">
              {filteredReports.length} Records
            </span>
            <div className="w-full sm:w-52">
              <SelectFilter label="Sort by" value={filters.sort} onChange={(v) => setFilter("sort", v)} options={SORT_OPTIONS} />
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <Loader2
              size={32}
              className="animate-spin text-[#2D6FE8]"
            />
            <p className="mt-3 text-sm font-medium text-gray-500">
              Loading sales report... {loadedPages} / {expectedPages} pages
            </p>
          </div>
        ) : errorMessage ? (
          <div className="p-10 text-center text-sm text-red-600" role="alert">
            <p>{errorMessage}</p><button type="button" className="mt-3 rounded-lg bg-[#2D6FE8] px-4 py-2 text-white" onClick={() => fetchReports()}>Retry</button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FileText size={25} />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-800">
              No Sales Records Found
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              No records match your search or selected filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-lg bg-[#2D6FE8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F7FAFE]">
                    {[
                      "Bill / Order",
                      "Customer",
                      "Order Amount",
                      "Net Amount",
                      "Tax",
                      "Items",
                      "Order Status",
                      "Delivery",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap border-b border-[#DCE6F2] px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedReports.map((item, index) => {
                    const key = `${item["Bill Id"]}-${index}`;
                    return (
                      <tr
                        key={key}
                        className="transition hover:bg-[#F8FBFF]"
                      >
                        {/* BILL */}
                        <td className="px-4 py-4 align-top">
                          <p className="text-xs font-bold text-gray-900">
                            {item["Bill Id"]}
                          </p>
                          <p className="mt-1 whitespace-nowrap text-[11px] text-gray-500">
                            {formatDate(item["Order Date"])}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-400">
                            User: {item["User Name"] || "—"}
                          </p>
                        </td>
                        {/* CUSTOMER */}
                        <td className="max-w-[180px] px-4 py-4 align-top">
                          <p className="truncate text-xs font-semibold text-gray-800">
                            {item["Customer Name"]}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500">
                            {item["Customer Mobile"]}
                          </p>
                          <p className="mt-1 truncate text-[10px] text-gray-400">
                            {item["Customer Shipping State"] || "—"}
                          </p>
                        </td>
                        {/* ORDER AMOUNT */}
                        <td className="px-4 py-4 align-top">
                          <p className="whitespace-nowrap text-xs font-semibold text-gray-800">
                            {money(item["Order Amount"])}
                          </p>
                          <p className="mt-1 whitespace-nowrap text-[10px] text-gray-400">
                            Gross: {money(item["Gross Total"])}
                          </p>
                        </td>
                        {/* NET */}
                        <td className="px-4 py-4 align-top">
                          <p className="whitespace-nowrap text-xs font-bold text-[#15803D]">
                            {money(item["Net Order Amount"])}
                          </p>
                          {Number(item["Refunded Amount"]) > 0 && (
                            <p className="mt-1 whitespace-nowrap text-[10px] text-red-500">
                              Refund: {money(item["Refunded Amount"])}
                            </p>
                          )}
                        </td>
                        {/* TAX */}
                        <td className="px-4 py-4 align-top">
                          <p className="whitespace-nowrap text-xs font-semibold text-gray-800">
                            {money(item["Total Tax"])}
                          </p>
                          <p className="mt-1 whitespace-nowrap text-[10px] text-gray-400">
                            CGST: {money(item.CGST)} / SGST: {money(item.SGST)}
                          </p>
                          <p className="mt-1 whitespace-nowrap text-[10px] text-gray-400">IGST: {money(item.IGST)}
                          </p>
                        </td>
                        {/* ITEMS */}
                        <td className="px-4 py-4 align-top">
                          <p className="text-xs font-semibold text-gray-800">
                            {item["Total Items"]}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-400">
                            CV: {numberFormat(item.CV)}
                          </p>
                        </td>
                        {/* ORDER STATUS */}
                        <td className="px-4 py-4 align-top">
                          <StatusBadge status={item["Order Status"]} />
                        </td>
                        {/* DELIVERY */}
                        <td className="px-4 py-4 align-top">
                          <StatusBadge status={item["Delivery Status"]} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* MOBILE CARDS */}
            <div className="space-y-3 p-3 lg:hidden">
              {paginatedReports.map((item, index) => (
                <MobileSalesCard
                  key={`${item["Bill Id"]}-${index}`}
                  item={item}
                />
              ))}
            </div>
            {/* PAGINATION */}
            <div className="flex flex-col justify-between gap-3 border-t border-[#DCE6F2] px-4 py-3 sm:flex-row sm:items-center">
              <p className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-800">
                  {startRecord}–{endRecord}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-800">
                  {totalRecords}
                </span>{" "}
                records
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-gray-600">Rows per page
                  <select className="rounded-md border border-[#DCE6F2] bg-white p-1.5" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                    {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={activePage <= 1 || loading || refreshing}
                  onClick={() =>
                    setCurrentPage(Math.max(1, activePage - 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="min-w-[85px] text-center text-xs font-semibold text-gray-700">
                  Page {activePage} of {lastPage}
                </span>
                <button
                  type="button"
                  disabled={activePage >= lastPage || loading || refreshing}
                  onClick={() =>
                    setCurrentPage(Math.min(lastPage, activePage + 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default SalesReportproducts;
