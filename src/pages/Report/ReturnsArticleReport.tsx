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
  IndianRupee,
  TrendingUp,
  Receipt,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Wallet,
  Loader2,
  Package,
  CalendarDays,
  Filter,
  ShieldAlert,
} from "lucide-react";

import { toast } from "react-hot-toast";

import returnsReportApi, {
  type ReturnsReportItem,
  type ReturnsReportPagination,
  type ReturnsReportFilters,
} from "../../api/endpoints/report/returnsReportApi";

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
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return String(value);
};

const formatDate = (value: string | null) => {
  if (!value) return "—";

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

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return value;
};

const escapeCsv = (value: unknown) => {
  const text =
    value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
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
  value: number | string;
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
        {typeof value === "string"
          ? value
          : isMoney
          ? money(value)
          : numberFormat(value)}
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

const MobileReturnCard = ({
  item,
  index,
}: {
  item: ReturnsReportItem;
  index: number;
}) => {
  return (
    <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Original Bill ID
            </p>
            <p className="mt-1 break-all text-sm font-bold text-[#2D6FE8]">
              {safeValue(item["Original Bill Id"])}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {formatDate(item["Refund Date"])}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Refund Bill ID
            </p>
            <p className="mt-1 break-all text-xs font-semibold text-gray-700">
              {safeValue(item["Refund Bill Id"])}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">#{index}</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-[#F7FAFE] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400">Customer</p>
              <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                {safeValue(item["Customer Name"])}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {safeValue(item["Contact Number"])}
              </p>
              <p className="mt-1 truncate text-[10px] text-gray-400">
                {safeValue(item.Email)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-gray-400">Refund Amount</p>
              <p className="mt-1 text-base font-bold text-[#15803D]">
                {money(Number(item["Refund Amount"]))}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-gray-100 p-3">
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
              <Package size={15} />
            </div>
            <div className="min-w-0">
              <p className="break-words text-xs font-semibold text-gray-800">
                {safeValue(item["Item Name"])}
              </p>
              <p className="mt-1 break-all text-[10px] text-gray-400">
                SKU: {safeValue(item.SKU)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <DetailItem label="QTY" value={safeValue(item.QTY)} />
          <DetailItem
            label="Distributor ID"
            value={safeValue(
              (item as any)["Distributor ID"] ??
                (item as any)["Distributor Id"] ??
                (item as any)["DistributorID"]
            )}
          />
        </div>

        <div className="mt-4 rounded-lg border border-gray-100 p-3">
          <p className="mb-1 text-xs font-bold text-gray-800">
            Return Reason
          </p>
          <p className="break-words text-xs leading-5 text-gray-600">
            {safeValue(item.Reason)}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN PAGE ================= */

const ReturnsReportPage = () => {
  /* ---------- PERMISSIONS ---------- */
  const {
    hasPermission,
    hasAnyPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  // Can user view this report at all?
  const canViewReport = useMemo(() => {
    if (isSuperAdmin) return true;

    return (
      hasModuleAccess("return_refund_report") ||
      hasModuleAccess("reports") ||
      hasAnyPermission([
        "return_refund_report.view",
        "return_refund_report.return_refund.view",
        "return_refund.view",
        "return_refund.report",
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
      hasModuleAccess("return_refund_report") ||
      hasAnyPermission([
        "return_refund_report.download",
        "return_refund_report.return_refund.download",
        "return_refund.download",
        "return_refund.export",
        // legacy slugs (older backend)
        "return_refund.report",
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
  const [rows, setRows] = useState<ReturnsReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [refundFilter, setRefundFilter] = useState("all");

  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(100);

  const [pagination, setPagination] =
    useState<ReturnsReportPagination>({
      current_page: 1,
      per_page: 100,
      total: 0,
      last_page: 1,
    });

  const [refreshKey, setRefreshKey] = useState(0);

  /* ================= FETCH API ================= */

  const fetchReports = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        setError("");

        const filters: ReturnsReportFilters = {
          from_date: appliedFrom || "",
          to_date: appliedTo || "",
          page: currentPage,
          per_page: perPage,
        };

        const response = await returnsReportApi.getAll(filters);

        if (response.data) {
          setRows(
            Array.isArray(response.data) ? response.data : []
          );

          if (response.pagination) {
            setPagination(response.pagination);
            if (
              response.pagination.current_page &&
              response.pagination.current_page !== currentPage
            ) {
              setCurrentPage(response.pagination.current_page);
            }
          } else {
            setPagination({
              current_page: 1,
              per_page: perPage,
              total: response.data.length,
              last_page: 1,
            });
          }
        } else {
          setRows([]);
          toast.error("Unable to fetch returns report");
        }
      } catch (err: any) {
        console.error("Returns report API error:", err);
        setRows([]);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch returns report"
        );
        toast.error(
          err?.response?.data?.message ||
            "Failed to fetch returns report"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, perPage, appliedFrom, appliedTo, refreshKey]
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

  /* ================= FILTER DATA ================= */

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item["Refund Bill Id"],
          item["Original Bill Id"],
          (item as any)["Distributor ID"],
          (item as any)["Distributor Id"],
          (item as any)["DistributorID"],
          item["Customer Name"],
          item["Contact Number"],
          item["Item Name"],
          item.SKU,
          item.Email,
          item.Reason,
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        );

      const refunded = Number(item["Refund Amount"] || 0) > 0;

      const matchesRefund =
        refundFilter === "all" ||
        (refundFilter === "refunded" && refunded) ||
        (refundFilter === "not_refunded" && !refunded);

      return matchesSearch && matchesRefund;
    });
  }, [rows, search, refundFilter]);

  /* ================= SUMMARY ================= */

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, item) => {
        acc.refundAmount += Number(item["Refund Amount"] || 0);
        acc.quantity += Number(item.QTY || 0);
        return acc;
      },
      { refundAmount: 0, quantity: 0 }
    );
  }, [rows]);

  const refundedRows = useMemo(
    () =>
      rows.filter((r) => Number(r["Refund Amount"] || 0) > 0)
        .length,
    [rows]
  );

  const clearFilters = () => {
    setSearch("");
    setRefundFilter("all");
    setDraftFrom("");
    setDraftTo("");
    setAppliedFrom("");
    setAppliedTo("");
    setCurrentPage(1);
  };

  /* ================= APPLY DATE FILTER ================= */

  const applyDateFilter = () => {
    if (draftFrom && draftTo && draftFrom > draftTo) {
      toast.error("From date cannot be greater than To date");
      return;
    }
    setAppliedFrom(draftFrom);
    setAppliedTo(draftTo);
    setCurrentPage(1);
  };

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    if (!canExport) {
      toast.error("You don't have permission to export this report.");
      return;
    }

    if (!filteredRows.length) {
      toast.error("No return records available to export");
      return;
    }

    const headers = [
      "Refund Bill Id",
      "Original Bill Id",
      "Distributor ID",
      "Refund Amount",
      "Reason",
      "Refund Date",
      "Customer Name",
      "Contact Number",
      "Item Name",
      "SKU",
      "QTY",
      "Email",
    ];

    const csvRows = filteredRows.map((item) =>
      headers.map((header) => {
        if (header === "Distributor ID") {
          return escapeCsv(
            (item as any)["Distributor ID"] ??
              (item as any)["Distributor Id"] ??
              (item as any)["DistributorID"]
          );
        }
        return escapeCsv(
          item[header as keyof ReturnsReportItem]
        );
      })
    );

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `returns-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success("Returns report exported successfully");
  };

  /* ================= PAGINATION ================= */

  const startRecord =
    pagination.total === 0
      ? 0
      : (pagination.current_page - 1) * pagination.per_page + 1;

  const endRecord = Math.min(
    pagination.current_page * pagination.per_page,
    pagination.total
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
            You don't have permission to view the Returns Report.
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
            <span>Returns Report</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            Returns Report
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View return details, refund information and customer product
            records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshKey((k) => k + 1);
              fetchReports(false);
            }}
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
              disabled={!filteredRows.length}
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
          title="Total Returns"
          value={pagination.total}
          subtitle="Total records"
          icon={Receipt}
          color="#2D6FE8"
          bg="#EAF3FF"
        />

        <CompactSummaryCard
          title="Refund Amount"
          value={summary.refundAmount}
          subtitle="Loaded page"
          icon={IndianRupee}
          color="#15803D"
          bg="#DCFCE7"
          isMoney
        />

        <CompactSummaryCard
          title="Total QTY"
          value={summary.quantity}
          subtitle="Items on page"
          icon={Package}
          color="#6D28D9"
          bg="#EDE9FE"
        />

        <CompactSummaryCard
          title="Refunded Rows"
          value={refundedRows}
          subtitle="Rows with refund"
          icon={Wallet}
          color="#C23B32"
          bg="#FEE2E2"
        />

        <CompactSummaryCard
          title="Avg Refund"
          value={
            rows.length
              ? summary.refundAmount / rows.length
              : 0
          }
          subtitle="Per record"
          icon={TrendingUp}
          color="#2D6FE8"
          bg="#EAF3FF"
          isMoney
        />

        <CompactSummaryCard
          title="Current Page"
          value={`${pagination.current_page} / ${Math.max(
            pagination.last_page,
            1
          )}`}
          subtitle="Pagination"
          icon={FileText}
          color="#C2410C"
          bg="#FFEDD5"
        />
      </div>

      {/* FILTERS */}

      <div className="rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Search size={17} className="text-[#2D6FE8]" />
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
              placeholder="Search customer, bill ID, SKU..."
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
            />
          </div>

          <div className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="date"
              value={draftTo}
              min={draftFrom || undefined}
              onChange={(e) => setDraftTo(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
            />
          </div>

          <select
            value={refundFilter}
            onChange={(e) => setRefundFilter(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
          >
            <option value="all">All Refunds</option>
            <option value="refunded">Refunded</option>
            <option value="not_refunded">Not Refunded</option>
          </select>

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
              Returns Records
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Complete return, refund and product information
            </p>
          </div>

          <span className="w-fit rounded-full bg-[#EAF3FF] px-3 py-1.5 text-xs font-semibold text-[#1E40AF]">
            {filteredRows.length} Records
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <Loader2
              size={32}
              className="animate-spin text-[#2D6FE8]"
            />
            <p className="mt-3 text-sm font-medium text-gray-500">
              Loading returns report...
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <X size={25} />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-800">
              Unable to load returns report
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {error}
            </p>
            <button
              type="button"
              onClick={() => fetchReports()}
              className="mt-4 rounded-lg bg-[#2D6FE8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
            >
              Retry
            </button>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FileText size={25} />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-800">
              No Return Records Found
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
                      "Bill / Refund",
                      "Customer",
                      "Refund Amount",
                      "QTY",
                      "Product",
                      "Reason",
                      "Refund Date",
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
                  {filteredRows.map((item, index) => {
                    const key = `${
                      item["Refund Bill Id"] ??
                      item["Original Bill Id"] ??
                      "row"
                    }-${item.SKU ?? ""}-${index}`;

                    return (
                      <tr
                        key={key}
                        className="transition hover:bg-[#F8FBFF]"
                      >
                        <td className="px-4 py-4 align-top">
                          <p className="text-xs font-bold text-[#2D6FE8]">
                            {safeValue(item["Original Bill Id"])}
                          </p>
                          <p className="mt-1 whitespace-nowrap text-[11px] text-gray-500">
                            Refund: {safeValue(item["Refund Bill Id"])}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-400">
                            Distributor:{" "}
                            {safeValue(
                              (item as any)["Distributor ID"] ??
                                (item as any)["Distributor Id"] ??
                                (item as any)["DistributorID"]
                            )}
                          </p>
                        </td>

                        <td className="max-w-[180px] px-4 py-4 align-top">
                          <p className="truncate text-xs font-semibold text-gray-800">
                            {safeValue(item["Customer Name"])}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500">
                            {safeValue(item["Contact Number"])}
                          </p>
                          <p className="mt-1 truncate text-[10px] text-gray-400">
                            {safeValue(item.Email)}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p className="whitespace-nowrap text-xs font-bold text-[#15803D]">
                            {money(Number(item["Refund Amount"]))}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p className="text-xs font-semibold text-gray-800">
                            {safeValue(item.QTY)}
                          </p>
                        </td>

                        <td className="max-w-[220px] px-4 py-4 align-top">
                          <p className="line-clamp-2 text-xs font-semibold text-gray-800">
                            {safeValue(item["Item Name"])}
                          </p>
                          <p className="mt-1 truncate text-[10px] text-gray-400">
                            SKU: {safeValue(item.SKU)}
                          </p>
                        </td>

                        <td className="max-w-[180px] px-4 py-4 align-top">
                          <p className="line-clamp-2 text-[11px] leading-5 text-gray-600">
                            {safeValue(item.Reason)}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p className="whitespace-nowrap text-[11px] text-gray-600">
                            {formatDate(item["Refund Date"])}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="space-y-3 p-3 lg:hidden">
              {filteredRows.map((item, index) => (
                <MobileReturnCard
                  key={`${
                    item["Refund Bill Id"] ??
                    item["Original Bill Id"] ??
                    "row"
                  }-${item.SKU ?? ""}-${index}`}
                  item={item}
                  index={startRecord + index}
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
                  {pagination.total.toLocaleString("en-IN")}
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
                  Page {pagination.current_page} of{" "}
                  {Math.max(pagination.last_page, 1)}
                </span>

                <button
                  type="button"
                  disabled={
                    currentPage >= pagination.last_page || loading
                  }
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(pagination.last_page, page + 1)
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

      {/* FOOTER */}

      <div className="flex items-start gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 py-3">
        <FileText size={15} className="mt-0.5 shrink-0 text-[#2D6FE8]" />
        <p className="text-[11px] leading-5 text-gray-500">
          Returns data is fetched from the admin returns report API.
          Summary cards show totals for the currently loaded API page,
          while the total return count comes from API pagination
          metadata. Search and refund filters apply to the currently
          loaded records.
        </p>
      </div>
    </div>
  );
};

export default ReturnsReportPage;