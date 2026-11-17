
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
  Package,
  ShoppingBag,
  IndianRupee,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  X,
  FileText,
  Loader2,
  Filter,
  ShieldAlert,
  Layers3,
  ChartNoAxesCombined,
} from "lucide-react";

import { toast } from "react-hot-toast";

import productSalesReportApi, {
  ProductSalesReportData,
  CategorySalesRow,
  ProductSalesRow,
} from "../../api/endpoints/report/productSalesReport";

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
};

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

/* ================= HELPERS ================= */

const numberFormat = (value: number | null | undefined) =>
  Number(value || 0).toLocaleString("en-IN");

const currencyFormat = (value: number | null | undefined) =>
  `₹${numberFormat(value)}`;

const escapeCsv = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const getCurrentISOWeek = (date = new Date()) => {
  const current = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );

  const day = current.getUTCDay() || 7;

  current.setUTCDate(current.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));

  return {
    year: current.getUTCFullYear(),
    week: Math.ceil(
      ((current.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    ),
  };
};

const getWeekLabel = (week: number) =>
  `Week ${String(week).padStart(2, "0")}`;

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, index) => currentYear - index);
};

const getWeeklyValue = (
  weekly: Record<string, number> | undefined,
  week: number
) => Number(weekly?.[String(week)] || 0);

/* ================= SUMMARY CARD ================= */

type SummaryCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bg: string;
};

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bg,
}: SummaryCardProps) => (
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
        {value}
      </h3>

      <p className="mt-0.5 truncate text-[9px] text-gray-400">
        {subtitle}
      </p>
    </div>
  </div>
);

/* ================= SECTION TAB ================= */

type ReportTab = "category" | "products" | "orders";

type SectionTabProps = {
  active: boolean;
  label: string;
  count: number;
  icon: React.ElementType;
  onClick: () => void;
};

const SectionTab = ({
  active,
  label,
  count,
  icon: Icon,
  onClick,
}: SectionTabProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
      active
        ? "bg-[#2D6FE8] text-white shadow-sm"
        : "border border-[#DCE6F2] bg-white text-gray-600 hover:bg-[#F4F8FD]"
    }`}
  >
    <Icon size={15} />

    {label}

    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
        active
          ? "bg-white/20 text-white"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {count}
    </span>
  </button>
);

/* ================= MAIN COMPONENT ================= */

const ProductSalesReport = () => {
  /* ================= PERMISSIONS ================= */

  const {
    hasPermission,
    hasAnyPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewReport = useMemo(() => {
    if (isSuperAdmin) return true;

    return (
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
      hasModuleAccess("sales_product_report") ||
      hasModuleAccess("product_sales_report") ||
      hasModuleAccess("sales_report") ||
      hasModuleAccess("reports")
    );
  }, [
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasModuleAccess,
  ]);

  /* ================= EXPORT PERMISSION ================= */

  const canExport = useMemo(() => {
    if (isSuperAdmin) return true;

    return (
      hasAnyPermission([
        "sales_product_report.download",
        "sales_product_report.export",
        "product_sales_report.download",
        "sales_report.download",
        "sales_report.export",
      ]) ||
      hasModuleAccess("sales_product_report.download") ||
      hasModuleAccess("sales_report.download")
    );
  }, [isSuperAdmin, hasAnyPermission, hasModuleAccess]);

  /* ================= LOGO ================= */

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

  /* ================= FILTER STATE ================= */

  const currentISO = useMemo(() => getCurrentISOWeek(), []);

  const [selectedYear, setSelectedYear] = useState(currentISO.year);
  const [selectedWeek, setSelectedWeek] = useState(currentISO.week);

  const [appliedYear, setAppliedYear] = useState(currentISO.year);
  const [appliedWeek, setAppliedWeek] = useState(currentISO.week);

  const [search, setSearch] = useState("");

  // Product Sales is the default selected tab.
  const [activeTab, setActiveTab] = useState<ReportTab>("products");

  const [currentPage, setCurrentPage] = useState(1);

  const perPage = 10;

  /* ================= DATA STATE ================= */

  const [report, setReport] =
    useState<ProductSalesReportData | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ================= FETCH REPORT ================= */

  const fetchReport = useCallback(
    async (year: number, week: number, showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const response = await productSalesReportApi.getAll({
          year,
          week,
        });

        if (response.status && response.data) {
          setReport(response.data);
          setAppliedYear(year);
          setAppliedWeek(week);
        } else {
          setReport(null);

          toast.error(
            response.message || "Unable to fetch product sales report"
          );
        }
      } catch (error: any) {
        console.error("Product sales report error:", error);

        toast.error(
          error?.response?.data?.message ||
            "Failed to fetch product sales report"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (permissionsLoading) return;

    if (!canViewReport) {
      setLoading(false);
      return;
    }

    void fetchReport(currentISO.year, currentISO.week, true);
  }, [
    permissionsLoading,
    canViewReport,
    currentISO,
    fetchReport,
  ]);

  /* ================= WEEK DATA ================= */

  const weeks = report?.weeks || [];

  const activeWeek = report?.anchor_week || appliedWeek;

  const categoryRows = report?.category_summary?.rows || [];

  const productRows = report?.product_sales?.rows || [];

  const orderRows = report?.order_counts?.rows || [];

  /* ================= SEARCH & FILTER ================= */

  const filteredCategoryRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categoryRows.filter((item) =>
      String(item.category || "").toLowerCase().includes(query)
    );
  }, [categoryRows, search]);

  const filteredProductRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return productRows.filter((item) =>
      String(item.product_name || "").toLowerCase().includes(query)
    );
  }, [productRows, search]);

  const filteredOrderRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orderRows.filter((item) =>
      String(item.product_name || "").toLowerCase().includes(query)
    );
  }, [orderRows, search]);

  const activeRows = useMemo(() => {
    if (activeTab === "products") return filteredProductRows;

    if (activeTab === "category") return filteredCategoryRows;

    return filteredOrderRows;
  }, [
    activeTab,
    filteredCategoryRows,
    filteredProductRows,
    filteredOrderRows,
  ]);

  /* ================= SUMMARY ================= */

  const summary = useMemo(() => {
    const salesTotal = Number(
      report?.product_sales?.weekly_totals?.total || 0
    );

    const orderTotal = Number(
      report?.order_counts?.weekly_totals?.total || 0
    );

    const categoryTotal = Number(
      report?.category_summary?.weekly_totals?.total || 0
    );

    const soldProducts = productRows.filter(
      (item) => Number(item.total) > 0
    ).length;

    return {
      salesTotal,
      orderTotal,
      categoryTotal,
      soldProducts,
      totalProducts: productRows.length,
      totalCategories: categoryRows.length,
    };
  }, [report, productRows, categoryRows]);

  /* ================= PAGINATION ================= */

  const totalPages = Math.max(
    1,
    Math.ceil(activeRows.length / perPage)
  );

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * perPage;

    return activeRows.slice(start, start + perPage);
  }, [activeRows, currentPage, perPage]);

  const startRecord =
    activeRows.length === 0
      ? 0
      : (currentPage - 1) * perPage + 1;

  const endRecord = Math.min(
    currentPage * perPage,
    activeRows.length
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* ================= APPLY FILTER ================= */

  const applyFilters = () => {
    setSearch("");
    setCurrentPage(1);

    void fetchReport(selectedYear, selectedWeek, true);
  };

  const clearFilters = () => {
    setSelectedYear(currentISO.year);
    setSelectedWeek(currentISO.week);
    setSearch("");
    setCurrentPage(1);

    void fetchReport(currentISO.year, currentISO.week, true);
  };

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    if (!canExport) {
      toast.error(
        "You don't have permission to export this report."
      );
      return;
    }

    if (!activeRows.length || !report) {
      toast.error("No records available to export");
      return;
    }

    let headers: string[] = [];
    let rows: unknown[][] = [];

    if (activeTab === "category") {
      headers = [
        "Category ID",
        "Category",
        ...weeks.map((week) => getWeekLabel(week)),
        "Total Sales",
      ];

      rows = (activeRows as CategorySalesRow[]).map((item) => [
        item.category_id,
        item.category,
        ...weeks.map((week) =>
          getWeeklyValue(item.weekly, week)
        ),
        item.total,
      ]);
    } else {
      // Product ID removed from CSV export.
      headers = [
        "Product Name",
        ...weeks.map((week) => getWeekLabel(week)),
        activeTab === "orders" ? "Total Orders" : "Total Sales",
      ];

      rows = (activeRows as ProductSalesRow[]).map((item) => [
        item.product_name,
        ...weeks.map((week) =>
          getWeeklyValue(item.weekly, week)
        ),
        item.total,
      ]);
    }

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) =>
        row.map(escapeCsv).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `product-${activeTab}-report-${appliedYear}-week-${appliedWeek}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success("Report exported successfully");
  };

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
            You don't have permission to view the Product Sales Report.
          </p>
        </div>
      </div>
    );
  }

  /* ================= TOTAL HELPERS ================= */

  const weeklyTotals =
    activeTab === "category"
      ? report?.category_summary?.weekly_totals
      : activeTab === "products"
        ? report?.product_sales?.weekly_totals
        : report?.order_counts?.weekly_totals;

  const overallTotal = Number(weeklyTotals?.total || 0);

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
            <span>Sales</span>
            <ChevronRight size={13} />
            <span>Sales Report</span>
            <ChevronRight size={13} />
            <span>Product Sales</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            Product Sales Report
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Analyze category-wise and product-wise weekly sales performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              void fetchReport(appliedYear, appliedWeek, false)
            }
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
              disabled={!activeRows.length || loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          title="Total Sales"
          value={currencyFormat(summary.salesTotal)}
          subtitle="All product sales"
          icon={IndianRupee}
          color={THEME.primary}
          bg={THEME.primarySoft}
        />

        <SummaryCard
          title="Total Orders"
          value={numberFormat(summary.orderTotal)}
          subtitle="Product order count"
          icon={ShoppingBag}
          color={THEME.green}
          bg={THEME.greenSoft}
        />

        <SummaryCard
          title="Category Sales"
          value={currencyFormat(summary.categoryTotal)}
          subtitle="Category-wise sales"
          icon={Layers3}
          color={THEME.purple}
          bg={THEME.purpleSoft}
        />

        <SummaryCard
          title="Products Sold"
          value={summary.soldProducts}
          subtitle="Products with sales"
          icon={Package}
          color={THEME.orange}
          bg={THEME.orangeSoft}
        />

        <SummaryCard
          title="Total Products"
          value={summary.totalProducts}
          subtitle="Products in report"
          icon={FileText}
          color={THEME.primary}
          bg={THEME.primarySoft}
        />

        <SummaryCard
          title="Categories"
          value={summary.totalCategories}
          subtitle="Available categories"
          icon={ChartNoAxesCombined}
          color={THEME.green}
          bg={THEME.greenSoft}
        />
      </div>

      {/* WEEK FILTER */}

      <div className="rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={17} className="text-[#2D6FE8]" />

          <h2 className="text-sm font-bold text-gray-800">
            Report Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Select Year
            </label>

            <div className="relative">
              <CalendarDays
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                value={selectedYear}
                onChange={(event) =>
                  setSelectedYear(Number(event.target.value))
                }
                className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
              >
                {getYearOptions().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Select Week
            </label>

            <div className="relative">
              <CalendarDays
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                value={selectedWeek}
                onChange={(event) =>
                  setSelectedWeek(Number(event.target.value))
                }
                className="h-10 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-[#2D6FE8]"
              >
                {Array.from(
                  { length: 53 },
                  (_, index) => index + 1
                ).map((week) => (
                  <option key={week} value={week}>
                    {getWeekLabel(week)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={applyFilters}
              disabled={loading || refreshing}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-5 text-sm font-semibold text-white transition hover:bg-[#1E40AF] disabled:opacity-60"
            >
              <Filter size={15} />
              Apply
            </button>

            <button
              type="button"
              onClick={clearFilters}
              disabled={loading || refreshing}
              title="Reset filters"
              className="flex h-10 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white px-3 text-gray-600 transition hover:bg-gray-50 hover:text-red-500 disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {report && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
            <span className="rounded-md bg-[#EAF3FF] px-2.5 py-1 text-[10px] font-semibold text-[#1E40AF]">
              Year: {report.year}
            </span>

            <span className="rounded-md bg-[#EDE9FE] px-2.5 py-1 text-[10px] font-semibold text-[#6D28D9]">
              Anchor Week: {report.anchor_week}
            </span>

            <span className="text-[10px] text-gray-400">
              Showing {weeks.length} weekly periods
            </span>
          </div>
        )}
      </div>

      {/* REPORT TABLE */}

      <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-[#DCE6F2] p-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Sales Breakdown
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Weekly performance for selected year and week
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search category or product..."
                className="h-9 w-full rounded-lg border border-[#DCE6F2] bg-white pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2D6FE8] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="flex h-9 items-center justify-center gap-1 rounded-lg border border-[#DCE6F2] px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                <X size={13} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* TABS - PRODUCT SALES FIRST */}

        <div className="flex gap-2 overflow-x-auto border-b border-[#DCE6F2] bg-[#FBFDFF] px-4 py-3">
          <SectionTab
            active={activeTab === "products"}
            label="Product Sales"
            count={productRows.length}
            icon={Package}
            onClick={() => setActiveTab("products")}
          />

          <SectionTab
            active={activeTab === "category"}
            label="Category Summary"
            count={categoryRows.length}
            icon={Layers3}
            onClick={() => setActiveTab("category")}
          />

          <SectionTab
            active={activeTab === "orders"}
            label="Order Counts"
            count={orderRows.length}
            icon={ShoppingBag}
            onClick={() => setActiveTab("orders")}
          />
        </div>

        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <Loader2
              size={32}
              className="animate-spin text-[#2D6FE8]"
            />

            <p className="mt-3 text-sm font-medium text-gray-500">
              Loading product sales report...
            </p>
          </div>
        ) : !report ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FileText size={25} />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-800">
              No Report Data Found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Unable to find report data for the selected period.
            </p>

            <button
              type="button"
              onClick={() =>
                void fetchReport(selectedYear, selectedWeek, true)
              }
              className="mt-4 rounded-lg bg-[#2D6FE8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
            >
              Try Again
            </button>
          </div>
        ) : activeRows.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <Search size={25} />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-800">
              No Records Found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              No records match your search.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-4 rounded-lg bg-[#2D6FE8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-max border-collapse text-left">
                <thead>
                  <tr className="bg-[#F7FAFE]">
                    <th className="sticky left-0 z-10 min-w-[260px] border-b border-[#DCE6F2] bg-[#F7FAFE] px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      {activeTab === "category"
                        ? "Category"
                        : "Product"}
                    </th>

                    {weeks.map((week) => (
                      <th
                        key={week}
                        className={`whitespace-nowrap border-b border-[#DCE6F2] px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide ${
                          week === activeWeek
                            ? "bg-[#EAF3FF] text-[#1E40AF]"
                            : "text-gray-500"
                        }`}
                      >
                        {getWeekLabel(week)}
                      </th>
                    ))}

                    <th className="whitespace-nowrap border-b border-[#DCE6F2] bg-[#EAF3FF] px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-[#1E40AF]">
                      Grand Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.map((row: any) => (
                    <tr
                      key={
                        activeTab === "category"
                          ? row.category_id
                          : row.product_id
                      }
                      className="transition hover:bg-[#F8FBFF]"
                    >
                      <td className="sticky left-0 z-[1] border-b border-[#EDF1F7] bg-white px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                            {activeTab === "category" ? (
                              <Layers3 size={15} />
                            ) : (
                              <Package size={15} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[260px] truncate text-xs font-semibold text-gray-800">
                              {activeTab === "category"
                                ? row.category
                                : row.product_name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {weeks.map((week: number) => {
                        const value = getWeeklyValue(
                          row.weekly,
                          week
                        );

                        return (
                          <td
                            key={week}
                            className={`whitespace-nowrap border-b border-[#EDF1F7] px-4 py-3.5 text-right text-xs ${
                              value > 0
                                ? "font-semibold text-gray-800"
                                : "text-gray-300"
                            } ${
                              week === activeWeek
                                ? "bg-[#F5F9FF]"
                                : ""
                            }`}
                          >
                            {activeTab === "orders"
                              ? numberFormat(value)
                              : currencyFormat(value)}
                          </td>
                        );
                      })}

                      <td className="whitespace-nowrap border-b border-[#EDF1F7] bg-[#FBFDFF] px-4 py-3.5 text-right text-xs font-bold text-[#1E40AF]">
                        {activeTab === "orders"
                          ? numberFormat(row.total)
                          : currencyFormat(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="bg-[#F7FAFE]">
                    {/* Product ID removed, so only one fixed column remains. */}
                    <td className="sticky left-0 z-[1] border-t border-[#DCE6F2] bg-[#F7FAFE] px-4 py-3.5 text-xs font-bold uppercase text-gray-800">
                      Weekly Total
                    </td>

                    {weeks.map((week) => {
                      const value = getWeeklyValue(
                        weeklyTotals,
                        week
                      );

                      return (
                        <td
                          key={week}
                          className="whitespace-nowrap border-t border-[#DCE6F2] px-4 py-3.5 text-right text-xs font-bold text-gray-800"
                        >
                          {activeTab === "orders"
                            ? numberFormat(value)
                            : currencyFormat(value)}
                        </td>
                      );
                    })}

                    <td className="whitespace-nowrap border-t border-[#DCE6F2] bg-[#EAF3FF] px-4 py-3.5 text-right text-xs font-extrabold text-[#1E40AF]">
                      {activeTab === "orders"
                        ? numberFormat(overallTotal)
                        : currencyFormat(overallTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="space-y-3 p-3 lg:hidden">
              {paginatedRows.map((row: any) => (
                <div
                  key={
                    activeTab === "category"
                      ? row.category_id
                      : row.product_id
                  }
                  className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white"
                >
                  <div className="flex items-center gap-3 border-b border-gray-100 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                      {activeTab === "category" ? (
                        <Layers3 size={17} />
                      ) : (
                        <Package size={17} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-800">
                        {activeTab === "category"
                          ? row.category
                          : row.product_name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[9px] font-semibold uppercase text-gray-400">
                        Total
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-[#1E40AF]">
                        {activeTab === "orders"
                          ? numberFormat(row.total)
                          : currencyFormat(row.total)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
                    {weeks.map((week: number) => {
                      const value = getWeeklyValue(
                        row.weekly,
                        week
                      );

                      return (
                        <div
                          key={week}
                          className={`rounded-lg border p-2.5 ${
                            week === activeWeek
                              ? "border-[#BFDBFE] bg-[#EFF6FF]"
                              : "border-gray-100 bg-[#F9FAFB]"
                          }`}
                        >
                          <p
                            className={`text-[9px] font-semibold uppercase ${
                              week === activeWeek
                                ? "text-[#1E40AF]"
                                : "text-gray-400"
                            }`}
                          >
                            {getWeekLabel(week)}
                          </p>

                          <p className="mt-1 break-words text-xs font-bold text-gray-800">
                            {activeTab === "orders"
                              ? numberFormat(value)
                              : currencyFormat(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#1E40AF]">
                    Overall Weekly Total
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {activeTab === "orders"
                      ? "Total product orders"
                      : "Total product sales"}
                  </p>
                </div>

                <p className="text-base font-extrabold text-[#1E40AF]">
                  {activeTab === "orders"
                    ? numberFormat(overallTotal)
                    : currencyFormat(overallTotal)}
                </p>
              </div>
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
                  {activeRows.length}
                </span>{" "}
                records
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] text-gray-600 transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="min-w-[85px] text-center text-xs font-semibold text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
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

      {/* REPORT FOOTER */}

      {report && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-[10px] text-gray-400">
            Product Sales Report · {report.year} ·{" "}
            {getWeekLabel(report.anchor_week)}
          </p>

          <p className="text-[10px] font-medium text-gray-500">
            Data provided by Finance Sales API
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductSalesReport;
