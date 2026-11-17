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
    CalendarDays,
    IndianRupee,
    TrendingUp,
    RotateCcw,
    Wallet,
    Activity,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    Layers3,
    CheckCircle2,
    Clock3,
  } from "lucide-react";
  
  import { toast } from "react-hot-toast";
  import categorySalesReportApi, {
    CategoryReportRow,
    CategorySalesReportData,
    WeeklyValues,
  } from "../../api/endpoints/report/categorySalesReportApi";
  
  
  type ReportSection =
    | "sales"
    | "returns"
    | "outstanding";
  
  const currentYear = new Date().getFullYear();
  
  const getCurrentWeek = () => {
    const date = new Date();
    const target = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
  
    const day = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - day);
  
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  
    return Math.ceil(
      (((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7
    );
  };
  
  const formatCurrency = (value: number | null | undefined) => {
    const amount = Number(value ?? 0);
  
    return `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };
  
  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
  
    return Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 4,
    });
  };
  
  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
  
    return `${(Number(value) * 100).toFixed(2)}%`;
  };
  
  const getWeekValue = (
    values: WeeklyValues | undefined,
    week: number | "total"
  ) => {
    if (!values) return 0;
  
    const value = values[String(week)];
    return value === null || value === undefined ? 0 : Number(value);
  };
  
  const getWeekLabel = (week: number) => `W${week}`;
  
  const getWeekRangeLabel = (
    data: CategorySalesReportData,
    week: number
  ) => {
    const range = data.week_ranges?.[String(week)];
  
    if (!range) return "";
  
    const formatDate = (value: string) => {
      const date = new Date(value.replace(" ", "T"));
  
      if (Number.isNaN(date.getTime())) return value;
  
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
    };
  
    return `${formatDate(range.start_at)} - ${formatDate(range.end_at)}`;
  };
  
  const downloadCSV = (
    filename: string,
    rows: (string | number)[][]
  ) => {
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");
  
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
  
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
  
    link.href = url;
    link.download = filename;
    link.click();
  
    URL.revokeObjectURL(url);
  };
  
  interface MetricCardProps {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
  }
  
  const MetricCard = ({
    title,
    value,
    subtitle,
    icon,
    iconBg,
    iconColor,
  }: MetricCardProps) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
          </p>
  
          <p className="mt-2 truncate text-xl font-bold text-gray-900">
            {value}
          </p>
  
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
  
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
  
  interface WeeklyTableProps {
    title: string;
    description: string;
    rows: CategoryReportRow[];
    weeks: number[];
    totals: WeeklyValues;
    search: string;
    onSearch: (value: string) => void;
    onExport: () => void;
    loading: boolean;
    valueLabel?: string;
  }
  
  const WeeklyTable = ({
    title,
    description,
    rows,
    weeks,
    totals,
    search,
    onSearch,
    onExport,
    loading,
    valueLabel = "Amount",
  }: WeeklyTableProps) => {
    const [page, setPage] = useState(1);
    const perPage = 10;
  
    const filteredRows = useMemo(() => {
      const query = search.trim().toLowerCase();
  
      if (!query) return rows;
  
      return rows.filter(
        (row) =>
          row.category.toLowerCase().includes(query) ||
          String(row.category_id).includes(query)
      );
    }, [rows, search]);
  
    useEffect(() => {
      setPage(1);
    }, [search, rows]);
  
    const totalPages = Math.max(
      1,
      Math.ceil(filteredRows.length / perPage)
    );
  
    const visibleRows = filteredRows.slice(
      (page - 1) * perPage,
      page * perPage
    );
  
    return (
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {title}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {description}
            </p>
          </div>
  
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="Search category..."
                className="h-9 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
  
            <button
              onClick={onExport}
              disabled={loading || rows.length === 0}
              className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>
  
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <RefreshCw className="animate-spin text-blue-600" size={24} />
            </div>
          )}
  
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="sticky left-0 z-[2] min-w-[210px] border-b border-r border-gray-200 bg-gray-50 px-4 py-3 font-bold">
                    Category
                  </th>
  
                  {weeks.map((week) => (
                    <th
                      key={week}
                      title=""
                      className="min-w-[105px] border-b border-gray-200 px-3 py-3 text-right font-bold"
                    >
                      <div>{getWeekLabel(week)}</div>
                    </th>
                  ))}
  
                  <th className="min-w-[130px] border-b border-gray-200 bg-blue-50 px-4 py-3 text-right font-bold text-blue-700">
                    Total
                  </th>
                </tr>
              </thead>
  
              <tbody>
                {visibleRows.length > 0 ? (
                  visibleRows.map((row) => (
                    <tr
                      key={row.category_id}
                      className="border-b border-gray-100 transition hover:bg-blue-50/40"
                    >
                      <td className="sticky left-0 z-[1] border-r border-gray-100 bg-white px-4 py-3 font-semibold text-gray-800">
                        <div>{row.category}</div>
                       
                      </td>
  
                      {weeks.map((week) => (
                        <td
                          key={week}
                          className="px-3 py-3 text-right tabular-nums text-gray-700"
                        >
                          {formatCurrency(getWeekValue(row.weekly, week))}
                        </td>
                      ))}
  
                      <td className="bg-blue-50/50 px-4 py-3 text-right font-bold tabular-nums text-blue-700">
                        {formatCurrency(row.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={weeks.length + 2}
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      {loading ? "Loading report..." : "No category records found"}
                    </td>
                  </tr>
                )}
              </tbody>
  
              <tfoot>
                <tr className="bg-gray-50 font-bold text-gray-900">
                  <td className="sticky left-0 z-[1] border-r border-t border-gray-200 bg-gray-50 px-4 py-3">
                    Total {valueLabel}
                  </td>
  
                  {weeks.map((week) => (
                    <td
                      key={week}
                      className="border-t border-gray-200 px-3 py-3 text-right tabular-nums"
                    >
                      {formatCurrency(getWeekValue(totals, week))}
                    </td>
                  ))}
  
                  <td className="border-t border-gray-200 bg-blue-100 px-4 py-3 text-right tabular-nums text-blue-800">
                    {formatCurrency(getWeekValue(totals, "total"))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
  
        <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Showing {filteredRows.length === 0 ? 0 : (page - 1) * perPage + 1}
            {" - "}
            {Math.min(page * perPage, filteredRows.length)} of{" "}
            {filteredRows.length} categories
          </p>
  
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
  
            <span className="text-xs font-semibold text-gray-600">
              Page {page} of {totalPages}
            </span>
  
            <button
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    );
  };
  
  interface SummaryRowProps {
    label: string;
    values: WeeklyValues;
    weeks: number[];
    type?: "currency" | "number" | "percentage";
    highlight?: boolean;
  }
  
  const SummaryRow = ({
    label,
    values,
    weeks,
    type = "currency",
    highlight = false,
  }: SummaryRowProps) => {
    const renderValue = (value: number | null | undefined) => {
      if (type === "percentage") return formatPercentage(value);
      if (type === "number") return formatNumber(value);
      return formatCurrency(value);
    };
  
    return (
      <tr
        className={
          highlight
            ? "bg-blue-50 font-bold text-blue-800"
            : "border-b border-gray-100 text-gray-700"
        }
      >
        <td className="sticky left-0 z-[1] min-w-[210px] border-r border-gray-100 bg-inherit px-4 py-3 font-semibold">
          {label}
        </td>
  
        {weeks.map((week) => (
          <td
            key={week}
            className="min-w-[105px] px-3 py-3 text-right tabular-nums"
          >
            {values[String(week)] === null
              ? "—"
              : renderValue(values[String(week)])}
          </td>
        ))}
  
        <td className="min-w-[130px] px-4 py-3 text-right tabular-nums">
          {values.total === null ? "—" : renderValue(values.total)}
        </td>
      </tr>
    );
  };
  
  const CategorySalesReport = () => {
    const [report, setReport] = useState<CategorySalesReportData | null>(null);
  
    const [year, setYear] = useState(currentYear);
    const [week, setWeek] = useState(getCurrentWeek());
  
    const [appliedYear, setAppliedYear] = useState(currentYear);
    const [appliedWeek, setAppliedWeek] = useState(getCurrentWeek());
  
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
  
    const [activeSection, setActiveSection] =
      useState<ReportSection>("sales");
  
    const [salesSearch, setSalesSearch] = useState("");
    const [returnsSearch, setReturnsSearch] = useState("");
    const [outstandingSearch, setOutstandingSearch] = useState("");
  
    const fetchReport = useCallback(
      async (
        selectedYear: number,
        selectedWeek: number,
        showLoader = true
      ) => {
        try {
          if (showLoader) {
            setLoading(true);
          } else {
            setRefreshing(true);
          }
  
          const response = await categorySalesReportApi.getAll({
            year: selectedYear,
            week: selectedWeek,
          });
  
          if (response.status && response.data) {
            setReport(response.data);
            setAppliedYear(selectedYear);
            setAppliedWeek(selectedWeek);
          } else {
            setReport(null);
            toast.error(
              response.message || "Unable to fetch category sales report"
            );
          }
        } catch (error: any) {
          console.error("Category sales report error:", error);
  
          toast.error(
            error?.response?.data?.message ||
              "Failed to fetch category sales report"
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );
  
    useEffect(() => {
      fetchReport(currentYear, getCurrentWeek(), true);
    }, [fetchReport]);
  
    const weeks = report?.weeks ?? [];
  
    const selectedWeekRange = report
      ? getWeekRangeLabel(report, appliedWeek)
      : "";
  
    const handleApplyFilters = () => {
      fetchReport(year, week, true);
    };
  
    const handleRefresh = () => {
      fetchReport(appliedYear, appliedWeek, false);
    };
  
    const exportSection = (
      section: ReportSection,
      rows: CategoryReportRow[],
      totals: WeeklyValues,
      filename: string
    ) => {
      if (!report) return;
  
      const header = [
        "Category ID",
        "Category",
        ...weeks.map((item) => `Week ${item}`),
        "Total",
      ];
  
      const csvRows: (string | number)[][] = [
        header,
        ...rows.map((row) => [
          row.category_id,
          row.category,
          ...weeks.map((item) => getWeekValue(row.weekly, item)),
          row.total,
        ]),
        [
          "",
          "Grand Total",
          ...weeks.map((item) => getWeekValue(totals, item)),
          getWeekValue(totals, "total"),
        ],
      ];
  
      downloadCSV(
        `${filename}_${appliedYear}_week_${appliedWeek}.csv`,
        csvRows
      );
    };
  
    const exportAllReport = () => {
      if (!report) return;
  
      const rows: (string | number)[][] = [
        ["Category Sales & Outstanding Report"],
        ["Year", appliedYear, "Anchor Week", appliedWeek],
        [],
        ["Sales By Category"],
        [
          "Category ID",
          "Category",
          ...weeks.map((item) => `Week ${item}`),
          "Total",
        ],
        ...report.sales_by_category.map((row) => [
          row.category_id,
          row.category,
          ...weeks.map((item) => getWeekValue(row.weekly, item)),
          row.total,
        ]),
        ["", "Total Sales", ...weeks.map((item) => getWeekValue(report.total_sales, item)), getWeekValue(report.total_sales, "total")],
        [],
        ["Sales Return By Category"],
        [
          "Category ID",
          "Category",
          ...weeks.map((item) => `Week ${item}`),
          "Total",
        ],
        ...report.sales_return_by_category.map((row) => [
          row.category_id,
          row.category,
          ...weeks.map((item) => getWeekValue(row.weekly, item)),
          row.total,
        ]),
        ["", "Total Sales Return", ...weeks.map((item) => getWeekValue(report.total_sales_return, item)), getWeekValue(report.total_sales_return, "total")],
        [],
        ["Outstanding By Category"],
        [
          "Category ID",
          "Category",
          ...weeks.map((item) => `Week ${item}`),
          "Total",
        ],
        ...report.outstanding_by_category.map((row) => [
          row.category_id,
          row.category,
          ...weeks.map((item) => getWeekValue(row.weekly, item)),
          row.total,
        ]),
        ["", "Total Outstanding", ...weeks.map((item) => getWeekValue(report.total_outstanding, item)), getWeekValue(report.total_outstanding, "total")],
        [],
        ["Financial Summary"],
        ["Metric", ...weeks.map((item) => `Week ${item}`), "Total"],
        ...[
          ["Net Sales", report.net_sales],
          ["Gross Sales Retail", report.gross_sales_retail],
          ["Net Sales BA Price", report.net_sales_ba_price],
          ["CV", report.cv],
          ["CV / Net", report.cv_over_net],
          ["OS / Net", report.os_over_net],
        ].map(([label, values]) => [
          label as string,
          ...weeks.map((item) =>
            getWeekValue(values as WeeklyValues, item)
          ),
          getWeekValue(values as WeeklyValues, "total"),
        ]),
      ];
  
      downloadCSV(
        `category_sales_outstanding_${appliedYear}_week_${appliedWeek}.csv`,
        rows
      );
    };
  
    const activeRows =
      activeSection === "sales"
        ? report?.sales_by_category ?? []
        : activeSection === "returns"
          ? report?.sales_return_by_category ?? []
          : report?.outstanding_by_category ?? [];
  
    const activeTotals =
      activeSection === "sales"
        ? report?.total_sales ?? {}
        : activeSection === "returns"
          ? report?.total_sales_return ?? {}
          : report?.total_outstanding ?? {};
  
    const activeSearch =
      activeSection === "sales"
        ? salesSearch
        : activeSection === "returns"
          ? returnsSearch
          : outstandingSearch;
  
    const setActiveSearch = (value: string) => {
      if (activeSection === "sales") setSalesSearch(value);
      else if (activeSection === "returns") setReturnsSearch(value);
      else setOutstandingSearch(value);
    };
  
    const activeTitle =
      activeSection === "sales"
        ? "Sales By Category"
        : activeSection === "returns"
          ? "Sales Return By Category"
          : "Outstanding By Category";
  
    const activeDescription =
      activeSection === "sales"
        ? "Category-wise sales amount across weekly periods"
        : activeSection === "returns"
          ? "Category-wise returned sales amount across weekly periods"
          : "Category-wise outstanding amount across weekly periods";
  
    const activeFilename =
      activeSection === "sales"
        ? "category_sales"
        : activeSection === "returns"
          ? "category_sales_returns"
          : "category_outstanding";
  
    const selectedSales = report
      ? getWeekValue(report.total_sales, appliedWeek)
      : 0;
  
    const selectedReturns = report
      ? getWeekValue(report.total_sales_return, appliedWeek)
      : 0;
  
    const selectedNetSales = report
      ? getWeekValue(report.net_sales, appliedWeek)
      : 0;
  
    const selectedOutstanding = report
      ? getWeekValue(report.total_outstanding, appliedWeek)
      : 0;
  
    const selectedCV = report
      ? getWeekValue(report.cv, appliedWeek)
      : 0;
  
    return (
      <div className="min-h-screen bg-[#F7F9FC] p-3 sm:p-5">
        <div className="mx-auto max-w-[1600px] space-y-5">
          {/* Header */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <BarChart3 size={21} />
                </div>
  
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Category Sales & Outstanding Report
                  </h1>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Weekly category sales, returns, net sales and outstanding
                  </p>
                </div>
              </div>
            </div>
  
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
  
              <button
                onClick={exportAllReport}
                disabled={!report || loading}
                className="flex h-9 items-center gap-2 rounded-lg bg-[#2D6FE8] px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Download size={14} />
                Export Full Report
              </button>
            </div>
          </div>
  
          {/* Filters */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
              <CalendarDays size={16} className="text-blue-600" />
              Report Filters
            </div>
  
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[180px_180px_auto] lg:items-end">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Year
                </label>
  
                <select
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {Array.from({ length: 7 }, (_, index) => currentYear - 3 + index)
                    .reverse()
                    .map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                </select>
              </div>
  
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Week
                </label>
  
                <select
                  value={week}
                  onChange={(event) => setWeek(Number(event.target.value))}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {Array.from({ length: 53 }, (_, index) => 53 - index).map(
                    (item) => (
                      <option key={item} value={item}>
                        Week {item}
                      </option>
                    )
                  )}
                </select>
              </div>
  
              <div>
                <button
                  onClick={handleApplyFilters}
                  disabled={loading}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 lg:w-auto"
                >
                  <Search size={15} />
                  Apply Filters
                </button>
              </div>
            </div>
  
            {report && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span>
                  Showing:{" "}
                  <strong className="text-gray-800">
                    {appliedYear} · Week {appliedWeek}
                  </strong>
                </span>
  
                {selectedWeekRange && (
                  <span className="flex items-center gap-1">
                    <CalendarDays size={13} />
                    {selectedWeekRange}
                  </span>
                )}
  
                <span className="flex items-center gap-1">
                  {report.week_ranges?.[String(appliedWeek)]?.settled ? (
                    <>
                      <CheckCircle2 size={13} className="text-green-600" />
                      Settled
                    </>
                  ) : (
                    <>
                      <Clock3 size={13} className="text-amber-600" />
                      Not settled
                    </>
                  )}
                </span>
  
                <span>
                  {weeks.length} weekly periods available
                </span>
              </div>
            )}
          </div>
  
          {/* Metric Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              title="Total Sales"
              value={formatCurrency(selectedSales)}
              subtitle={`Week ${appliedWeek} · ${appliedYear}`}
              icon={<IndianRupee size={20} />}
              iconBg="#EAF3FF"
              iconColor="#2D6FE8"
            />
  
            <MetricCard
              title="Sales Returns"
              value={formatCurrency(selectedReturns)}
              subtitle="Returned sales amount"
              icon={<RotateCcw size={20} />}
              iconBg="#FFF7D6"
              iconColor="#B7791F"
            />
  
            <MetricCard
              title="Net Sales"
              value={formatCurrency(selectedNetSales)}
              subtitle="After sales returns"
              icon={<TrendingUp size={20} />}
              iconBg="#E8F8EF"
              iconColor="#16834A"
            />
  
            <MetricCard
              title="Total Outstanding"
              value={formatCurrency(selectedOutstanding)}
              subtitle="Outstanding amount"
              icon={<Wallet size={20} />}
              iconBg="#FCE8E8"
              iconColor="#C23B32"
            />
  
            <MetricCard
              title="Total CV"
              value={formatNumber(selectedCV)}
              subtitle="Commission volume"
              icon={<Activity size={20} />}
              iconBg="#F0EBFF"
              iconColor="#7047C6"
            />
          </div>
  
          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: "sales" as const,
                label: "Sales By Category",
                icon: <TrendingUp size={15} />,
              },
              {
                id: "returns" as const,
                label: "Sales Returns",
                icon: <RotateCcw size={15} />,
              },
              {
                id: "outstanding" as const,
                label: "Outstanding",
                icon: <Wallet size={15} />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
                  activeSection === tab.id
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
  
          {/* Dynamic Category Table */}
          <WeeklyTable
            title={activeTitle}
            description={activeDescription}
            rows={activeRows}
            weeks={weeks}
            totals={activeTotals}
            search={activeSearch}
            onSearch={setActiveSearch}
            loading={loading}
            onExport={() =>
              exportSection(
                activeSection,
                activeRows,
                activeTotals,
                activeFilename
              )
            }
          />
  
          {/* Financial Summary */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Layers3 size={18} />
              </div>
  
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Sales & Outstanding Summary
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Financial metrics across all available weeks
                </p>
              </div>
            </div>
  
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="sticky left-0 z-[2] min-w-[210px] border-b border-r border-gray-200 bg-gray-50 px-4 py-3 font-bold">
                      Metric
                    </th>
  
                    {weeks.map((item) => (
                      <th
                        key={item}
                        className="min-w-[105px] border-b border-gray-200 px-3 py-3 text-right font-bold"
                      >
                        {getWeekLabel(item)}
                      </th>
                    ))}
  
                    <th className="min-w-[130px] border-b border-gray-200 bg-blue-50 px-4 py-3 text-right font-bold text-blue-700">
                      Total
                    </th>
                  </tr>
                </thead>
  
                <tbody>
                  {report && (
                    <>
                      <SummaryRow
                        label="Net Sales"
                        values={report.net_sales}
                        weeks={weeks}
                        highlight
                      />
  
                      <SummaryRow
                        label="Gross Sales Retail"
                        values={report.gross_sales_retail}
                        weeks={weeks}
                      />
  
                      <SummaryRow
                        label="Net Sales BA Price"
                        values={report.net_sales_ba_price}
                        weeks={weeks}
                      />
  
                      <SummaryRow
                        label="Total Sales"
                        values={report.total_sales}
                        weeks={weeks}
                      />
  
                      <SummaryRow
                        label="Total Sales Return"
                        values={report.total_sales_return}
                        weeks={weeks}
                      />
  
                      <SummaryRow
                        label="CV"
                        values={report.cv}
                        weeks={weeks}
                        type="number"
                      />
  
                      <SummaryRow
                        label="CV / Net"
                        values={report.cv_over_net}
                        weeks={weeks}
                        type="percentage"
                      />
  
                      <SummaryRow
                        label="Total Outstanding"
                        values={report.total_outstanding}
                        weeks={weeks}
                      />
  
                      <SummaryRow
                        label="OS / Net"
                        values={report.os_over_net}
                        weeks={weeks}
                        type="percentage"
                      />
                    </>
                  )}
                </tbody>
              </table>
  
              {!report && !loading && (
                <div className="py-10 text-center text-sm text-gray-500">
                  No report data available
                </div>
              )}
  
              {loading && (
                <div className="py-10 text-center text-sm text-gray-500">
                  Loading financial summary...
                </div>
              )}
            </div>
          </section>
  
          {/* Loading / Footer */}
          {loading && !report && (
            <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
              <RefreshCw
                className="mx-auto animate-spin text-blue-600"
                size={26}
              />
              <p className="mt-3 text-sm font-medium text-gray-600">
                Fetching category sales report...
              </p>
            </div>
          )}
  
          {report && (
            <div className="flex flex-col gap-1 text-[11px] text-gray-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Category Sales & Outstanding Report · {appliedYear}
              </span>
              <span>
                Data provided by sales report API
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default CategorySalesReport;
  