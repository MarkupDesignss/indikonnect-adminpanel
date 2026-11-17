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
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  Receipt,
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
    value === "failed"
  ) {
    return {
      bg: THEME.redSoft,
      color: THEME.red,
    };
  }

  if (
    value === "shipped" ||
    value === "processing"
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
  const text =
    value === null || value === undefined
      ? ""
      : String(value);

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
      {value || "—"}
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
                value={item["Refunded Items"]}
              />

              <DetailItem
                label="Last Refund Date"
                value={safeValue(item["Last Refund Date"])}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN PAGE ================= */

const SalesReportproducts = () => {
  /* ---------- PERMISSIONS ---------- */
  const {
    hasPermission,
    hasAnyPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  // Can user view this report?
  const canViewReport = useMemo(() => {
    if (isSuperAdmin) return true;

    return (
      hasModuleAccess("sales_product_report") ||
      hasModuleAccess("reports") ||
      hasModuleAccess("sales") ||
      hasAnyPermission([
        "sales_product_report.view",
        "sales_product_report.sales.view",
        "sales.view",
        "sales.report",
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
      hasModuleAccess("sales_product_report") ||
      hasModuleAccess("sales") ||
      hasAnyPermission([
        "sales_product_report.download",
        "sales_product_report.sales.download",
        "sales.download",
        "sales.export",
        "sales.report",
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
  const [reports, setReports] = useState<SalesReportItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [deliveryStatus, setDeliveryStatus] = useState("all");
  const [refundFilter, setRefundFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(100);

  const [totalRecords, setTotalRecords] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  /* ================= FETCH API ================= */

  const fetchReports = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const response = await salesReportApi.getAll({
          page: currentPage,
          per_page: perPage,
        });

        if (response.success) {
          setReports(
            Array.isArray(response.data) ? response.data : []
          );

          setTotalRecords(
            response.meta?.total ?? response.data?.length ?? 0
          );

          setLastPage(response.meta?.last_page ?? 1);
        } else {
          setReports([]);
          toast.error("Unable to fetch sales report");
        }
      } catch (error: any) {
        console.error("Sales report API error:", error);

        toast.error(
          error?.response?.data?.message ||
            "Failed to fetch sales report"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, perPage]
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

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item["Bill Id"],
          item["Customer Name"],
          item["Customer Mobile"],
          item["User Name"],
          item["Customer GSTIN"],
          item["Customer Shipping State"],
          item["Order Status"],
          item["Delivery Status"],
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        );

      const matchesOrderStatus =
        orderStatus === "all" ||
        item["Order Status"]?.toLowerCase() ===
          orderStatus.toLowerCase();

      const matchesDeliveryStatus =
        deliveryStatus === "all" ||
        item["Delivery Status"]?.toLowerCase() ===
          deliveryStatus.toLowerCase();

      const isRefunded =
        String(item["Is Refunded"]).toLowerCase() === "true" ||
        Number(item["Refunded Amount"]) > 0;

      const matchesRefund =
        refundFilter === "all" ||
        (refundFilter === "refunded" && isRefunded) ||
        (refundFilter === "not_refunded" && !isRefunded);

      return (
        matchesSearch &&
        matchesOrderStatus &&
        matchesDeliveryStatus &&
        matchesRefund
      );
    });
  }, [
    reports,
    search,
    orderStatus,
    deliveryStatus,
    refundFilter,
  ]);

  /* ================= SUMMARY ================= */

  const summary = useMemo(() => {
    return reports.reduce(
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
  }, [reports]);

  const clearFilters = () => {
    setSearch("");
    setOrderStatus("all");
    setDeliveryStatus("all");
    setRefundFilter("all");
  };

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    if (!canExport) {
      toast.error("You don't have permission to export this report.");
      return;
    }

    if (!filteredReports.length) {
      toast.error("No sales records available to export");
      return;
    }

    const headers = [
      "Bill Id",
      "Order Date",
      "Customer Name",
      "Customer Mobile",
      "Gross Total",
      "Order Amount",
      "Refunded Amount",
      "Net Order Amount",
      "Order Status",
      "Total Items",
      "Total Tax",
      "CGST",
      "SGST",
      "IGST",
      "Total List Price",
      "Discount Amount",
      "CV",
      "User Name",
      "Customer GSTIN",
      "Shipping Date",
      "Customer Shipping State",
      "Shipping Charge",
      "Delivery Status",
      "Is Refunded",
      "Refund Status",
      "Refunded Items",
      "Last Refund Date",
    ];

    const rows = filteredReports.map((item) =>
      headers.map((header) =>
        escapeCsv(item[header as keyof SalesReportItem])
      )
    );

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
              disabled={!filteredReports.length}
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
          subtitle="Total records"
          icon={ShoppingCart}
          color="#2D6FE8"
          bg="#EAF3FF"
        />

        <CompactSummaryCard
          title="Order Amount"
          value={summary.orderAmount}
          subtitle="Loaded page"
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
          subtitle="Loaded page"
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
              placeholder="Search bill, customer, mobile..."
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
          >
            <option value="all">All Order Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="delivered">Delivered</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="processing">Processing</option>
          </select>

          <select
            value={deliveryStatus}
            onChange={(e) => setDeliveryStatus(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
          >
            <option value="all">All Delivery Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="dispatched">Dispatched</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>

          <select
            value={refundFilter}
            onChange={(e) => setRefundFilter(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
          >
            <option value="all">All Refunds</option>
            <option value="refunded">Refunded</option>
            <option value="not_refunded">Not Refunded</option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            title="Clear filters"
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-red-500"
          >
            <X size={15} />
            Clear
          </button>
        </div>
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
              Loading sales report...
            </p>
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
                  {filteredReports.map((item, index) => {
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
                            IGST: {money(item.IGST)}
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
              {filteredReports.map((item, index) => (
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

export default SalesReportproducts;