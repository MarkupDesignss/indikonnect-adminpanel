"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  RefreshCw,
  Download,
  Truck,
  Package,
  CheckCircle2,
  Clock3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  ArrowUpRight,
  Loader2,
  Filter,
  ShieldAlert,
} from "lucide-react";

import { toast } from "react-hot-toast";

import deliveryReportApi, {
  DeliveryReportItem,
} from "../../api/endpoints/report/deliveryReport";

import { usePermissions } from "../../pages/permissions/usePermissions";
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

const numberFormat = (value: number | null | undefined) => {
  return Number(value || 0).toLocaleString("en-IN");
};

const safeValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return String(value);
};

const formatDate = (value: string | null) => {
  if (!value) return "—";

  const date = new Date(value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusStyle = (status: string) => {
  const value = (status || "").toLowerCase();

  if (value === "delivered" || value === "completed") {
    return { bg: THEME.greenSoft, color: THEME.green };
  }

  if (value === "shipped") {
    return { bg: THEME.purpleSoft, color: THEME.purple };
  }

  if (value === "dispatched") {
    return { bg: THEME.primarySoft, color: THEME.primaryDark };
  }

  return { bg: THEME.orangeSoft, color: THEME.orange };
};

const escapeCsv = (value: unknown) => {
  const text =
    value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/* ================= STATUS BADGE ================= */

const StatusBadge = ({ status }: { status: string }) => {
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
      {status || "Unknown"}
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
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bg: string;
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
        {typeof value === "string" ? value : numberFormat(value)}
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
      {value || "—"}
    </div>
  </div>
);

/* ================= MOBILE CARD ================= */

const MobileDeliveryCard = ({
  item,
}: {
  item: DeliveryReportItem;
}) => {
  return (
    <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Order Reference
            </p>

            <p className="mt-1 break-all text-sm font-bold text-gray-900">
              {safeValue(item["Order Reference"])}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Invoice: {safeValue(item["Invoice Number"])}
            </p>
          </div>

          <StatusBadge status={item["Delivery Status"]} />
        </div>

        <div className="mt-4 rounded-lg bg-[#F7FAFE] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
              <Package size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-800">
                {safeValue(item["Item Name"])}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                SKU: {safeValue(item.SKU)} · Qty:{" "}
                {safeValue(item.QTY)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-gray-100 p-3">
          <p className="mb-3 text-xs font-bold text-gray-800">
            Recipient Information
          </p>
          <div className="grid grid-cols-2 gap-3">
            <DetailItem
              label="Name"
              value={safeValue(item["Recipient Name"])}
            />
            <DetailItem
              label="Phone"
              value={safeValue(item["Recipient Phone"])}
            />
            <DetailItem
              label="Email"
              value={safeValue(item["Recipient Email"])}
            />
            <DetailItem
              label="Placed At"
              value={formatDate(item["Placed At"])}
            />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-gray-100 p-3">
          <p className="mb-3 text-xs font-bold text-gray-800">
            Shipment Information
          </p>
          <div className="grid grid-cols-2 gap-3">
            <DetailItem
              label="Carrier"
              value={safeValue(item.Carrier)}
            />
            <DetailItem
              label="AWB"
              value={safeValue(item["Shipment Number"])}
            />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-gray-100 p-3">
          <p className="mb-3 text-xs font-bold text-gray-800">
            Timeline
          </p>
          <div className="space-y-2">
            <div className="flex justify-between gap-2">
              <span className="text-[10px] text-gray-400">
                Dispatched
              </span>
              <span className="text-xs font-semibold text-gray-700">
                {item["Dispatched At"]
                  ? formatDate(item["Dispatched At"])
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[10px] text-gray-400">
                Shipped
              </span>
              <span className="text-xs font-semibold text-gray-700">
                {item["Shipped At"]
                  ? formatDate(item["Shipped At"])
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[10px] text-gray-400">
                Delivered
              </span>
              <span className="text-xs font-semibold text-gray-700">
                {item["Delivered At"]
                  ? formatDate(item["Delivered At"])
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN PAGE ================= */

const DeliveryReport = () => {
  /* ---------- PERMISSIONS ---------- */
  const {
    hasPermission,
    hasAnyPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  // Can user access this report at all?
  const canViewReport = useMemo(() => {
    if (isSuperAdmin) return true;

    return (
      hasModuleAccess("delivery_report") ||
      hasModuleAccess("reports") ||
      hasAnyPermission([
        "delivery_report.view",
        "delivery_report.delivery.view",
        "delivery.view",
        "delivery.report",
      ]) ||
      hasPermission("reports.view")
    );
  }, [
    isSuperAdmin,
    hasModuleAccess,
    hasAnyPermission,
    hasPermission,
  ]);

  // Can user export CSV?
  const canExport = useMemo(() => {
    if (isSuperAdmin) return true;

    return (
      hasModuleAccess("delivery_report") ||
      hasAnyPermission([
        "delivery_report.download",
        "delivery_report.delivery.download",
        "delivery.download",
        "delivery.export",
      ])
    );
  }, [isSuperAdmin, hasModuleAccess, hasAnyPermission]);

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
  const [reports, setReports] = useState<DeliveryReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(100);

  const [totalRecords, setTotalRecords] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  /* ================= FETCH ================= */

  const fetchReports = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const response = await deliveryReportApi.getAll({
          page: currentPage,
          per_page: perPage,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
        });

        if (response.status) {
          setReports(
            Array.isArray(response.data) ? response.data : []
          );

          setTotalRecords(
            response.pagination?.total ??
              response.data?.length ??
              0
          );

          setLastPage(response.pagination?.last_page ?? 1);
        } else {
          setReports([]);
          toast.error(
            response.message || "Unable to fetch delivery report"
          );
        }
      } catch (error: any) {
        console.error("Delivery report error:", error);

        toast.error(
          error?.response?.data?.message ||
            "Failed to fetch delivery report"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, perPage, fromDate, toDate]
  );

  // Gate the initial fetch on permissions.
  useEffect(() => {
    if (permissionsLoading) return;

    if (!canViewReport) {
      setLoading(false);
      return;
    }

    fetchReports();
  }, [permissionsLoading, canViewReport, fetchReports]);

  /* ================= FILTER ================= */

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item["Invoice Number"],
          item["Order Reference"],
          item["Item Name"],
          item.SKU,
          item["Shipment Number"],
          item.Carrier,
          item["Recipient Name"],
          item["Recipient Phone"],
          item["Recipient Email"],
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );

      const matchesStatus =
        statusFilter === "all" ||
        item["Delivery Status"]?.toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  /* ================= SUMMARY ================= */

  const summary = useMemo(() => {
    return {
      total: reports.length,
      confirmed: reports.filter(
        (item) =>
          item["Delivery Status"]?.toLowerCase() === "confirmed"
      ).length,
      dispatched: reports.filter(
        (item) =>
          item["Delivery Status"]?.toLowerCase() === "dispatched"
      ).length,
      shipped: reports.filter(
        (item) =>
          item["Delivery Status"]?.toLowerCase() === "shipped"
      ).length,
      delivered: reports.filter(
        (item) =>
          item["Delivery Status"]?.toLowerCase() === "delivered"
      ).length,
    };
  }, [reports]);

  /* ================= FILTER ACTIONS ================= */

  const applyDateFilter = () => {
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("From date cannot be greater than To date");
      return;
    }
    setCurrentPage(1);
    fetchReports();
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    if (!canExport) {
      toast.error("You don't have permission to export this report.");
      return;
    }

    if (!filteredReports.length) {
      toast.error("No delivery records available to export");
      return;
    }

    const headers = [
    
      "Invoice Number",
      "Item Name",
      "SKU",
      "QTY",
      "Delivery Status",
      "Shipment Number",
      "Carrier",
      "Recipient Name",
      "Recipient Phone",
      "Recipient Email",
    ];

    const rows = filteredReports.map((item) =>
      headers.map((header) => {
        if (header === "Bill Id") {
          return escapeCsv((item as any)["Bill Id"] || "");
        }
        return escapeCsv(
          item[header as keyof DeliveryReportItem]
        );
      })
    );

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `delivery-report-${formatDateInput(
      new Date()
    )}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success("Delivery report exported successfully");
  };

  /* ================= PAGINATION ================= */

  const startRecord =
    totalRecords === 0
      ? 0
      : (currentPage - 1) * perPage + 1;

  const endRecord = Math.min(
    currentPage * perPage,
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
            You don't have permission to view the Delivery Report.
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
            <span>Delivery Report</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            Delivery Report
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Track orders, shipment progress and delivery information.
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
              disabled={!filteredReports.length}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* COMPACT SUMMARY CARDS */}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <CompactSummaryCard
          title="Total Records"
          value={totalRecords}
          subtitle="All delivery records"
          icon={Package}
          color="#2D6FE8"
          bg="#EAF3FF"
        />

        <CompactSummaryCard
          title="Confirmed"
          value={summary.confirmed}
          subtitle="Orders confirmed"
          icon={Clock3}
          color="#C2410C"
          bg="#FFEDD5"
        />

        <CompactSummaryCard
          title="Dispatched"
          value={summary.dispatched}
          subtitle="Orders dispatched"
          icon={Truck}
          color="#2D6FE8"
          bg="#EAF3FF"
        />

        <CompactSummaryCard
          title="Shipped"
          value={summary.shipped}
          subtitle="Orders in transit"
          icon={ArrowUpRight}
          color="#6D28D9"
          bg="#EDE9FE"
        />

        <CompactSummaryCard
          title="Delivered"
          value={summary.delivered}
          subtitle="Successfully delivered"
          icon={CheckCircle2}
          color="#15803D"
          bg="#DCFCE7"
        />

        <CompactSummaryCard
          title="Current Page"
          value={`${currentPage} / ${Math.max(lastPage, 1)}`}
          subtitle="Pagination"
          icon={FileText}
          color="#C2410C"
          bg="#FFEDD5"
        />
      </div>

      {/* FILTERS */}

      <div className="rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={17} className="text-[#2D6FE8]" />
          <h2 className="text-sm font-bold text-gray-800">
            Search & Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order, SKU, recipient..."
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="dispatched">Dispatched</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>

          <div className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-2 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
            />
          </div>

          <div className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-2 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyDateFilter}
              disabled={loading}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white transition hover:bg-[#1E40AF] disabled:opacity-60"
            >
              <Filter size={15} />
              Apply
            </button>

            <button
              type="button"
              onClick={clearFilters}
              title="Clear filters"
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-red-500"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-[#DCE6F2] p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Delivery Records
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Detailed order and shipment information
            </p>
          </div>

          <span className="w-fit rounded-full bg-[#EAF3FF] px-3 py-1.5 text-xs font-semibold text-[#1E40AF]">
            {filteredReports.length} Records
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <Loader2
              size={32}
              className="animate-spin text-[#2D6FE8]"
            />
            <p className="mt-3 text-sm font-medium text-gray-500">
              Loading delivery report...
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FileText size={25} />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-800">
              No Delivery Records Found
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
                      "Order / Invoice",
                      "Product",
                      "Recipient",
                      "Shipment",
                      "Timeline",
                      "Status",
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
                  {filteredReports.map((item, index) => (
                    <tr
                      key={`${item["Order Reference"]}-${item.SKU}-${index}`}
                      className="transition hover:bg-[#F8FBFF]"
                    >
                      <td className="px-4 py-4 align-top">
                        <p className="text-xs font-bold text-gray-900">
                          {safeValue(item["Order Reference"])}
                        </p>
                        <p className="mt-1 whitespace-nowrap text-[11px] text-gray-500">
                          Invoice:{" "}
                          {safeValue(item["Invoice Number"])}
                        </p>
                        <p className="mt-1 whitespace-nowrap text-[10px] text-gray-400">
                          {formatDate(item["Placed At"])}
                        </p>
                      </td>

                      <td className="max-w-[190px] px-4 py-4 align-top">
                        <p className="truncate text-xs font-semibold text-gray-800">
                          {safeValue(item["Item Name"])}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-500">
                          SKU: {safeValue(item.SKU)}
                        </p>
                        <p className="mt-1 text-[10px] text-gray-400">
                          Qty: {safeValue(item.QTY)}
                        </p>
                      </td>

                      <td className="max-w-[190px] px-4 py-4 align-top">
                        <p className="truncate text-xs font-semibold text-gray-800">
                          {safeValue(item["Recipient Name"])}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-500">
                          {safeValue(item["Recipient Phone"])}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-gray-400">
                          {safeValue(item["Recipient Email"])}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <p className="text-xs font-semibold text-gray-800">
                          {safeValue(item.Carrier)}
                        </p>
                        <p className="mt-1 whitespace-nowrap text-[11px] text-gray-500">
                          AWB:{" "}
                          {safeValue(item["Shipment Number"])}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-gray-500">
                            Dispatched:{" "}
                            <span className="font-semibold text-gray-700">
                              {item["Dispatched At"]
                                ? formatDate(item["Dispatched At"])
                                : "—"}
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Shipped:{" "}
                            <span className="font-semibold text-gray-700">
                              {item["Shipped At"]
                                ? formatDate(item["Shipped At"])
                                : "—"}
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Delivered:{" "}
                            <span className="font-semibold text-gray-700">
                              {item["Delivered At"]
                                ? formatDate(item["Delivered At"])
                                : "—"}
                            </span>
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <StatusBadge
                          status={item["Delivery Status"]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="space-y-3 p-3 lg:hidden">
              {filteredReports.map((item, index) => (
                <MobileDeliveryCard
                  key={`${item["Order Reference"]}-${item.SKU}-${index}`}
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || loading}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="min-w-[85px] text-center text-xs font-semibold text-gray-700">
                  Page {currentPage} of {lastPage}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= lastPage || loading}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(lastPage, page + 1)
                    )
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

export default DeliveryReport;