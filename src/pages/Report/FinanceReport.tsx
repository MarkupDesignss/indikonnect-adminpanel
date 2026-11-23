"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  FileText,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Loader2,
  ShieldAlert,
  Receipt,
  Wallet,
  Package,
  CreditCard,
} from "lucide-react";
import { toast } from "react-hot-toast";

import financeReportApi, {
  FinanceReportItem,
} from "../../api/endpoints/report/financeReport";
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

const money = (value: number | null | undefined) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const valueOrDash = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "—"
    : String(value);

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";

  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})(.*)$/);

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}${match[4] || ""}`;
  }

  const parsed = new Date(value.replace(" ", "T"));

  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const formatDateInput = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const escapeCsv = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

/* ================= PRODUCT / HSN HELPERS ================= */

const getProductNames = (item: FinanceReportItem) => {
  if (Array.isArray(item.products) && item.products.length > 0) {
    return item.products
      .map(
        (product) =>
          product.name?.trim() ||
          product.product_code?.trim() ||
          "Product",
      )
      .join(" | ");
  }

  return item.product_names || "";
};

const getProductHsnCodes = (item: FinanceReportItem) => {
  if (!Array.isArray(item.products) || item.products.length === 0) {
    return "";
  }

  return item.products
    .map((product) => product.hsn_code?.trim() || "N/A")
    .join(" | ");
};

/* ================= ORDER REFERENCE HELPER ================= */

const getOrderReference = (item: FinanceReportItem) =>
  (item as FinanceReportItem & {
    order_reference?: string | null;
  }).order_reference || "";

/* ================= STATUS ================= */

const statusStyle = (status: string | null | undefined) => {
  const value = (status || "").toLowerCase();

  if (
    value.includes("deliver") ||
    value === "completed" ||
    value === "paid"
  ) {
    return {
      bg: THEME.greenSoft,
      color: THEME.green,
    };
  }

  if (value.includes("ship") || value.includes("partial")) {
    return {
      bg: THEME.purpleSoft,
      color: THEME.purple,
    };
  }

  if (value.includes("refund") || value.includes("cancel")) {
    return {
      bg: THEME.redSoft,
      color: THEME.red,
    };
  }

  if (value.includes("dispatch") || value.includes("confirm")) {
    return {
      bg: THEME.primarySoft,
      color: THEME.primaryDark,
    };
  }

  return {
    bg: THEME.orangeSoft,
    color: THEME.orange,
  };
};

function StatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const style = statusStyle(status);

  return (
    <span
      className="inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize"
      style={{
        background: style.bg,
        color: style.color,
      }}
    >
      {valueOrDash(status)}
    </span>
  );
}

/* ================= SUMMARY CARD ================= */

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
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

        <h3 className="mt-0.5 truncate text-sm font-bold text-gray-900 sm:text-base">
          {value}
        </h3>

        <p className="mt-0.5 truncate text-[9px] text-gray-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */

const FinanceReport = () => {
  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  /* ================= PERMISSIONS ================= */

  const canViewReport = useMemo(() => {
    if (isSuperAdmin) return true;

    return (
      hasModuleAccess("finance_sales_report") ||
      hasPermission("finance_sales_report.view")
    );
  }, [isSuperAdmin, hasModuleAccess, hasPermission]);

  const canExport = useMemo(() => {
    if (isSuperAdmin) return true;

    return hasPermission("finance_sales_report.download");
  }, [isSuperAdmin, hasPermission]);

  /* ================= LOGO ================= */

  const [logoUrl, setLogoUrl] = useState<string | null>(
    DEFAULT_LOGO_URL,
  );

  const [logoLoading, setLogoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadLogo = async () => {
      try {
        const response: any = await logoApi.getLogo();

        const candidates = [
          response?.data?.data?.logo,
          response?.data?.logo,
          response?.data?.data?.data?.logo,
          response?.data?.data?.logo_url,
          response?.data?.logo_url,
          response?.logo,
        ];

        const found = candidates.find(
          (value) =>
            typeof value === "string" &&
            /^https?:\/\//i.test(value.trim()),
        );

        if (!cancelled && found) {
          setLogoUrl(found.trim());
        }
      } catch (error) {
        console.error("Logo API error:", error);
      } finally {
        if (!cancelled) {
          setLogoLoading(false);
        }
      }
    };

    void loadLogo();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ================= REPORT STATE ================= */

  const [reports, setReports] = useState<FinanceReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const perPage = 100;

  const [totalRecords, setTotalRecords] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  /* ================= FETCH REPORT ================= */

  const fetchReports = useCallback(
    async (showLoader = true, page = currentPage) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const response = await financeReportApi.getAll({
          page,
          per_page: perPage,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
        });

        if (response.success) {
          setReports(
            Array.isArray(response.data) ? response.data : [],
          );

          setTotalRecords(
            response.meta?.total ?? response.data?.length ?? 0,
          );

          setLastPage(response.meta?.last_page ?? 1);
        } else {
          setReports([]);

          toast.error(
            response.message || "Unable to fetch finance report",
          );
        }
      } catch (error: any) {
        console.error("Finance report error:", error);

        toast.error(
          error?.response?.data?.message ||
            "Failed to fetch finance report",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, fromDate, toDate],
  );

  useEffect(() => {
    if (permissionsLoading) return;

    if (!canViewReport) {
      setLoading(false);
      return;
    }

    void fetchReports(true);
  }, [permissionsLoading, canViewReport, fetchReports]);

  /* ================= SEARCH & FILTER ================= */

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((item) => {
      const searchable = [
        item.invoice_number,
        item.customer_name,
        item.customer_mobile,
        item.customer_email,
        item.customer_gstin,
        item.user_name,
        item.product_names,
        item.order_status,
        item.delivery_status,
        item.payment_gateway,
        item.gateway_transaction_id,
        item.courier_company,
        item.courier_tracking_number,
      ];

      const matchesSearch =
        !query ||
        searchable.some((value) =>
          String(value ?? "").toLowerCase().includes(query),
        );

      const matchesStatus =
        statusFilter === "all" ||
        [item.order_status, item.delivery_status].some(
          (status) =>
            (status || "").toLowerCase() === statusFilter,
        );

      const matchesAccount =
        accountFilter === "all" ||
        (item.account_type || "").toLowerCase() === accountFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAccount
      );
    });
  }, [reports, search, statusFilter, accountFilter]);

  /* ================= SUMMARY ================= */

  const summary = useMemo(
    () => ({
      sales: reports.reduce(
        (sum, item) =>
          sum + Number(item.net_order_amount || 0),
        0,
      ),

      gst: reports.reduce(
        (sum, item) =>
          sum + Number(item.total_gst || 0),
        0,
      ),

      invoices: totalRecords,

      items: reports.reduce(
        (sum, item) =>
          sum + Number(item.total_items || 0),
        0,
      ),

      refunded: reports.filter(
        (item) =>
          String(item.is_refunded).toLowerCase() === "true" ||
          String(item.is_refunded).toLowerCase() === "yes" ||
          Number(item.refunded_items || 0) > 0,
      ).length,
    }),
    [reports, totalRecords],
  );

  /* ================= APPLY FILTERS ================= */

  const applyFilters = () => {
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("From date cannot be greater than To date");
      return;
    }

    setCurrentPage(1);
    void fetchReports(true, 1);
  };

  /* ================= CLEAR FILTERS ================= */

  const clearFilters = async () => {
    setSearch("");
    setStatusFilter("all");
    setAccountFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);

    try {
      setLoading(true);

      const response = await financeReportApi.getAll({
        page: 1,
        per_page: perPage,
      });

      if (response.success) {
        setReports(
          Array.isArray(response.data) ? response.data : [],
        );

        setTotalRecords(
          response.meta?.total ?? response.data?.length ?? 0,
        );

        setLastPage(response.meta?.last_page ?? 1);
      } else {
        setReports([]);

        toast.error(
          response.message || "Unable to clear report filters",
        );
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to clear filters",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= CSV / EXCEL EXPORT ================= */

  const exportCSV = () => {
    if (!canExport) {
      toast.error(
        "You don't have permission to export this report.",
      );
      return;
    }

    if (!filteredReports.length) {
      toast.error("No finance records available to export");
      return;
    }

    const headers = [
      "Invoice Number",
      "Order Reference", 
      "Invoice Date",
      "Customer Name",
      "Customer Mobile",
      "Account Type",
      "Email",
      "GSTIN",
      "Billing State",
      "Product Names",
      "HSN Codes",
      "Product Subtotal",
      "Shipping (Without GST)",
      "Subtotal",
      "Product GST",
      "Shipping GST",
      "Total GST",
      "CGST",
      "SGST",
      "IGST",
      "Order Amount",
      "Discount Amount",
      "Net Order Amount",
      "Order Status",
      "Delivery Status",
      "Total Items",
      "CV",
      "Distributor/User ID",
      "Order Date",
      "Payment Gateway",
      "Gateway Transaction ID",
      "Courier",
      "Tracking Number",
    ];

    const rows = filteredReports.map((item) => {
      const values: unknown[] = [
        item.invoice_number,
        getOrderReference(item), // Added Order Reference value
        item.invoice_date,
        item.customer_name,
        item.customer_mobile,
        item.account_type,
        item.customer_email,
        item.customer_gstin,
        item.billing_state,
        item.delivery_state,
        getProductNames(item),
        getProductHsnCodes(item),
        item.product_subtotal,
        item.shipping_charge_without_gst,
        item.subtotal,
        item.product_gst,
        item.shipping_gst,
        item.total_gst,
        item.tax_breakdown?.cgst,
        item.tax_breakdown?.sgst,
        item.tax_breakdown?.igst,
        item.order_amount,
        item.discount_amount,
        item.net_order_amount,
        item.order_status,
        item.delivery_status,
        item.total_items,
        item.cv,
        item.user_name,
        item.order_date,
        item.payment_gateway,
        item.gateway_transaction_id,

        // Courier and tracking are not removed from Excel.
        item.courier_company,
        item.courier_tracking_number,

        item.is_refunded,
        item.refund_status,
        item.refunded_items,
      ];

      return values.map(escapeCsv);
    });

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `finance-report-${formatDateInput(
      new Date(),
    )}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success("Finance report exported successfully");
  };

  /* ================= PAGINATION ================= */

  const startRecord =
    totalRecords === 0
      ? 0
      : (currentPage - 1) * perPage + 1;

  const endRecord = Math.min(
    currentPage * perPage,
    totalRecords,
  );

  const pageLoading = permissionsLoading || logoLoading;

  /* ================= LOADING ================= */

  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  /* ================= ACCESS DENIED ================= */

  if (!canViewReport) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <ShieldAlert
            size={28}
            className="mx-auto mb-4 text-[#C23B32]"
          />

          <h2 className="text-lg font-bold text-gray-900">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to view the Finance Sales
            Report.
          </p>
        </div>
      </div>
    );
  }

  /* ================= MAIN UI ================= */

  return (
    <div
      className="min-h-screen space-y-5 p-3 sm:p-5 lg:p-6"
      style={{ background: THEME.background }}
    >
      {/* ================= HEADER ================= */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2D6FE8]">
            <span>Reports</span>
            <ChevronRight size={13} />
            <span>Finance Sales Report</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            Finance Sales Report
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review invoices, customer details, GST, payments and
            shipment information.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchReports(false)}
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

      {/* ================= SUMMARY CARDS ================= */}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        <SummaryCard
          title="Total Invoices"
          value={summary.invoices.toLocaleString("en-IN")}
          subtitle="All finance records"
          icon={Receipt}
          color="#2D6FE8"
          bg="#EAF3FF"
        />

        <SummaryCard
          title="Net Order Amount"
          value={money(summary.sales)}
          subtitle="Current page total"
          icon={Wallet}
          color="#15803D"
          bg="#DCFCE7"
        />

        <SummaryCard
          title="Total GST"
          value={money(summary.gst)}
          subtitle="Current page GST"
          icon={CreditCard}
          color="#6D28D9"
          bg="#EDE9FE"
        />

        <SummaryCard
          title="Total Items"
          value={summary.items.toLocaleString("en-IN")}
          subtitle="Current page quantity"
          icon={Package}
          color="#C2410C"
          bg="#FFEDD5"
        />

        <SummaryCard
          title="Refunded Orders"
          value={summary.refunded.toLocaleString("en-IN")}
          subtitle="Refunded records"
          icon={RefreshCw}
          color="#C23B32"
          bg="#FEE2E2"
        />
      </div>

      {/* ================= FILTERS ================= */}

      <div className="rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={17} className="text-[#2D6FE8]" />

          <h2 className="text-sm font-bold text-gray-800">
            Search & Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_1fr_1fr_1fr_1fr_auto]">
          {/* SEARCH */}

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoice, customer, mobile, product, transaction..."
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="dispatched">Dispatched</option>
            <option value="shipped">Shipped</option>
            <option value="partial_shipped">Partial Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* ACCOUNT TYPE */}

          <select
            value={accountFilter}
            onChange={(event) => setAccountFilter(event.target.value)}
            className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
          >
            <option value="all">All Account Types</option>
            <option value="customer">Customer</option>
            <option value="distributor">Distributor</option>
          </select>

          {/* FROM DATE */}

          <div className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-2 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
            />
          </div>

          {/* TO DATE */}

          <div className="relative">
            <CalendarDays
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-2 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
            />
          </div>

          {/* ACTIONS */}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyFilters}
              disabled={loading}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:opacity-60"
            >
              <Filter size={15} />
              Apply
            </button>

            <button
              type="button"
              onClick={() => void clearFilters()}
              title="Clear filters"
              className="flex h-10 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-red-500"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= FINANCE RECORDS ================= */}

      <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-[#DCE6F2] p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Finance Records
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Invoice, customer, product, tax and payment information
            </p>
          </div>

          <span className="w-fit rounded-full bg-[#EAF3FF] px-3 py-1.5 text-xs font-semibold text-[#1E40AF]">
            {filteredReports.length} Records
          </span>
        </div>

        {/* ================= LOADING ================= */}

        {loading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <Loader2
              size={32}
              className="animate-spin text-[#2D6FE8]"
            />

            <p className="mt-3 text-sm font-medium text-gray-500">
              Loading finance report...
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          /* ================= EMPTY STATE ================= */

          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FileText size={25} />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-800">
              No Finance Records Found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-gray-500">
              No records match your search or selected filters.
            </p>

            <button
              type="button"
              onClick={() => void clearFilters()}
              className="mt-4 rounded-lg bg-[#2D6FE8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* ================= DESKTOP TABLE ================= */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F7FAFE]">
                    {[
                      "Invoice / Date",
                      "Customer",
                      "Products",
                      "Amount / GST",
                      "Payment",
                      "Order / Delivery",
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
                      key={`${item.invoice_number || "invoice"}-${index}`}
                      className="border-b border-gray-100 transition last:border-0 hover:bg-[#F8FBFF]"
                    >
                      {/* INVOICE / DATE */}

                      <td className="px-4 py-4 align-top">
                        <p className="text-xs font-bold text-gray-900">
                          {valueOrDash(item.invoice_number)}
                        </p>

                        <p className="mt-1 whitespace-nowrap text-[10px] text-gray-500">
                          {formatDate(item.invoice_date)}
                        </p>

                        {/* Order ID line removed */}
                      </td>

                      {/* CUSTOMER */}

                      <td className="max-w-[190px] px-4 py-4 align-top">
                        <p className="truncate text-xs font-semibold text-gray-800">
                          {valueOrDash(item.customer_name)}
                        </p>

                        <p className="mt-1 break-all text-[10px] font-medium text-[#2D6FE8]">
                          Mobile: {valueOrDash(item.customer_mobile)}
                        </p>

                        <p className="mt-1 max-w-[180px] truncate text-[10px] text-gray-500">
                          {valueOrDash(item.customer_email)}
                        </p>

                        <p className="mt-1 text-[10px] capitalize text-gray-400">
                          {valueOrDash(item.account_type)}
                        </p>
                      </td>

                      {/* PRODUCTS */}

                      <td className="max-w-[220px] px-4 py-4 align-top">
                        <p className="line-clamp-2 text-xs font-semibold text-gray-800">
                          {valueOrDash(item.product_names)}
                        </p>

                        <p className="mt-1 text-[10px] text-gray-500">
                          {item.total_items || 0} items
                        </p>
                      </td>

                      {/* PRICE / GST / DISCOUNT */}

                      <td className="px-4 py-4 align-top">
                        <p className="whitespace-nowrap text-xs font-bold text-gray-900">
                          {money(item.net_order_amount)}
                        </p>

                        <p className="mt-1 whitespace-nowrap text-[10px] text-gray-500">
                          GST: {money(item.total_gst)}
                        </p>

                        <p className="mt-1 whitespace-nowrap text-[10px] text-gray-400">
                          Discount: {money(item.discount_amount)}
                        </p>
                      </td>

                      {/* PAYMENT */}

                      <td className="px-4 py-4 align-top">
                        <p className="text-xs font-semibold text-gray-800">
                          {valueOrDash(item.payment_gateway)}
                        </p>

                        <p className="mt-1 max-w-[150px] break-all text-[10px] text-gray-500">
                          {valueOrDash(item.gateway_transaction_id)}
                        </p>
                      </td>

                      {/* ORDER / DELIVERY */}

                      <td className="px-4 py-4 align-top">
                        <StatusBadge status={item.order_status} />

                        <div className="mt-1">
                          <StatusBadge status={item.delivery_status} />
                        </div>

                        <p className="mt-1 whitespace-nowrap text-[10px] text-gray-400">
                          {formatDate(item.order_date)}
                        </p>

                        {/* Courier and tracking are not displayed in the UI */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================= MOBILE CARDS ================= */}

            <div className="space-y-3 p-3 lg:hidden">
              {filteredReports.map((item, index) => (
                <div
                  key={`${item.invoice_number || "invoice"}-${index}`}
                  className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white"
                >
                  <div className="p-4">
                    {/* INVOICE HEADER */}

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          Invoice Number
                        </p>

                        <p className="mt-1 break-all text-sm font-bold text-gray-900">
                          {valueOrDash(item.invoice_number)}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(item.invoice_date)}
                        </p>

                        {/* Order ID line removed */}
                      </div>

                      <StatusBadge status={item.order_status} />
                    </div>

                    {/* CUSTOMER DETAILS */}

                    <div className="mt-4 rounded-lg bg-[#F7FAFE] p-3">
                      <p className="text-sm font-semibold text-gray-800">
                        {valueOrDash(item.customer_name)}
                      </p>

                      <p className="mt-1 break-all text-xs font-medium text-[#2D6FE8]">
                        Mobile: {valueOrDash(item.customer_mobile)}
                      </p>

                      <p className="mt-1 break-all text-xs text-gray-500">
                        {valueOrDash(item.customer_email)}
                      </p>

                      <p className="mt-1 text-xs capitalize text-gray-500">
                        {valueOrDash(item.account_type)}
                      </p>
                    </div>

                    {/* AMOUNT AND PAYMENT */}

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                          Net Order Amount
                        </p>

                        <p className="mt-1 break-words text-xs font-semibold text-gray-700">
                          {money(item.net_order_amount)}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                          Total GST
                        </p>

                        <p className="mt-1 break-words text-xs font-semibold text-gray-700">
                          {money(item.total_gst)}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                          Payment Gateway
                        </p>

                        <p className="mt-1 break-words text-xs font-semibold text-gray-700">
                          {valueOrDash(item.payment_gateway)}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                          Delivery Status
                        </p>

                        <div className="mt-1">
                          <StatusBadge status={item.delivery_status} />
                        </div>
                      </div>
                    </div>

                    {/* PRODUCTS */}

                    <div className="mt-3 border-t border-[#E8EEF6] pt-3">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                        Products
                      </p>

                      <p className="mt-1 break-words text-xs text-gray-600">
                        {valueOrDash(item.product_names)}
                      </p>

                      <p className="mt-1 text-[10px] text-gray-400">
                        {item.total_items || 0} items
                      </p>
                    </div>

                    {/* Courier and tracking are not displayed in mobile UI */}
                  </div>
                </div>
              ))}
            </div>

            {/* ================= PAGINATION ================= */}

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
                    setCurrentPage((page) =>
                      Math.max(1, page - 1),
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
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
                      Math.min(lastPage, page + 1),
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
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

export default FinanceReport;