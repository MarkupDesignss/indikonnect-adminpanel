
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
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  Phone,
  Mail,
  User,
  Hash,
  Filter,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

import { toast } from "react-hot-toast";

import deliveryReportApi, {
  DeliveryReportItem,
} from "../../api/endpoints/report/deliveryReport";

/* ================= THEME ================= */

const THEME = {
  primary: "#2D6FE8",
  primaryDark: "#1E40AF",
  primaryLight: "#4F8FF7",
  primarySoft: "#EAF3FF",
  background: "#F4F8FD",
  border: "#DCE6F2",
  text: "#111827",
  muted: "#6B7280",
  white: "#FFFFFF",
  green: "#15803D",
  greenSoft: "#DCFCE7",
  orange: "#C2410C",
  orangeSoft: "#FFEDD5",
  purple: "#6D28D9",
  purpleSoft: "#EDE9FE",
  red: "#C23B32",
};

/* ================= HELPERS ================= */

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
  const value = status?.toLowerCase();

  if (value === "delivered") {
    return {
      background: THEME.greenSoft,
      color: THEME.green,
      dot: THEME.green,
    };
  }

  if (value === "shipped") {
    return {
      background: THEME.purpleSoft,
      color: THEME.purple,
      dot: THEME.purple,
    };
  }

  if (value === "dispatched") {
    return {
      background: THEME.primarySoft,
      color: THEME.primaryDark,
      dot: THEME.primary,
    };
  }

  return {
    background: THEME.orangeSoft,
    color: THEME.orange,
    dot: THEME.orange,
  };
};

const escapeCsv = (value: unknown) => {
  const text = value === null || value === undefined
    ? ""
    : String(value);

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
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
      style={{
        background: style.background,
        color: style.color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: style.dot }}
      />
      {status || "Unknown"}
    </span>
  );
};

/* ================= DATE ITEM ================= */

const DateItem = ({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) => (
  <div className="min-w-0">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      {label}
    </p>
    <p className="mt-1 text-xs font-medium text-gray-700">
      {formatDate(value)}
    </p>
  </div>
);

/* ================= SUMMARY CARD ================= */

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) => (
  <div className="rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{title}</p>

        <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
          {value.toLocaleString("en-IN")}
        </h3>

        <p className="mt-1 text-[11px] text-gray-400">
          {subtitle}
        </p>
      </div>

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: bg, color }}
      >
        <Icon size={19} />
      </div>
    </div>
  </div>
);

/* ================= ORDER CARD ================= */

const MobileOrderCard = ({
  item,
  index,
}: {
  item: DeliveryReportItem;
  index: number;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Order Reference
            </p>

            <p className="mt-1 break-all text-sm font-bold text-gray-900">
              {item["Order Reference"]}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Invoice: {item["Invoice Number"] || "—"}
            </p>
          </div>

          <StatusBadge status={item["Delivery Status"]} />
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-lg bg-[#F7FAFE] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
            <Package size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-800">
              {item["Item Name"]}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              SKU: {item.SKU} · Qty: {item.QTY}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-gray-400">Recipient</p>
            <p className="mt-1 truncate text-xs font-semibold text-gray-800">
              {item["Recipient Name"]}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-gray-400">Carrier</p>
            <p className="mt-1 truncate text-xs font-semibold text-gray-800">
              {item.Carrier || "—"}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-gray-400">Shipment Number</p>
            <p className="mt-1 text-xs font-semibold text-gray-800">
              {item["Shipment Number"] || "—"}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-gray-400">Placed At</p>
            <p className="mt-1 text-xs font-semibold text-gray-800">
              {formatDate(item["Placed At"])}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex w-full items-center justify-between border-t border-gray-100 pt-3 text-xs font-semibold text-[#2D6FE8]"
        >
          {expanded ? "Hide Details" : "View Full Details"}
          <ChevronRight
            size={16}
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>

        <div
          className={`grid transition-all duration-300 ${
            expanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <DateItem
                  label="Dispatched At"
                  value={item["Dispatched At"]}
                />
                <DateItem
                  label="Shipped At"
                  value={item["Shipped At"]}
                />
                <DateItem
                  label="Delivered At"
                  value={item["Delivered At"]}
                />
                <DateItem
                  label="Placed At"
                  value={item["Placed At"]}
                />
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-2 text-xs font-semibold text-gray-800">
                  Recipient Details
                </p>

                <p className="flex items-center gap-2 break-all text-xs text-gray-600">
                  <Phone size={13} />
                  {item["Recipient Phone"] || "—"}
                </p>

                <p className="mt-2 flex items-center gap-2 break-all text-xs text-gray-600">
                  <Mail size={13} />
                  {item["Recipient Email"] || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN PAGE ================= */

const DeliveryReport = () => {
  const [reports, setReports] = useState<DeliveryReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(500);

  const [totalRecords, setTotalRecords] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

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
          setReports(Array.isArray(response.data) ? response.data : []);

          setTotalRecords(
            response.pagination?.total ?? response.data?.length ?? 0
          );

          setLastPage(response.pagination?.last_page ?? 1);
        } else {
          setReports([]);
          toast.error(response.message || "Unable to fetch delivery report");
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

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

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
        (item) => item["Delivery Status"]?.toLowerCase() === "confirmed"
      ).length,
      dispatched: reports.filter(
        (item) => item["Delivery Status"]?.toLowerCase() === "dispatched"
      ).length,
      shipped: reports.filter(
        (item) => item["Delivery Status"]?.toLowerCase() === "shipped"
      ).length,
      delivered: reports.filter(
        (item) => item["Delivery Status"]?.toLowerCase() === "delivered"
      ).length,
    };
  }, [reports]);

  /* ================= DATE FILTER ================= */

  const applyDateFilter = () => {
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("From date cannot be greater than To date");
      return;
    }

    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const hasFilters =
    search || statusFilter !== "all" || fromDate || toDate;

  /* ================= CSV EXPORT ================= */

  const exportCSV = () => {
    if (!filteredReports.length) {
      toast.error("No delivery records available to export");
      return;
    }

    const headers = [
      "Invoice Number",
      "Order Reference",
      "Item Name",
      "SKU",
      "QTY",
      "Delivery Status",
      "Placed At",
      "Dispatched At",
      "Shipped At",
      "Delivered At",
      "Shipment Number",
      "Carrier",
      "Recipient Name",
      "Recipient Phone",
      "Recipient Email",
    ];

    const rows = filteredReports.map((item) =>
      headers.map((header) => {
        return escapeCsv(
          item[header as keyof DeliveryReportItem]
        );
      })
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
    link.download = `delivery-report-${formatDateInput(new Date())}.csv`;

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

          <button
            type="button"
            onClick={exportCSV}
            disabled={!filteredReports.length}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Total Records"
          value={totalRecords}
          subtitle="All delivery records"
          icon={Package}
          color="#2D6FE8"
          bg="#EAF3FF"
        />

        <SummaryCard
          title="Confirmed"
          value={summary.confirmed}
          subtitle="Orders confirmed"
          icon={Clock3}
          color="#C2410C"
          bg="#FFEDD5"
        />

        <SummaryCard
          title="Dispatched"
          value={summary.dispatched}
          subtitle="Orders dispatched"
          icon={Truck}
          color="#2D6FE8"
          bg="#EAF3FF"
        />

        <SummaryCard
          title="Shipped"
          value={summary.shipped}
          subtitle="Orders in transit"
          icon={ArrowUpRight}
          color="#6D28D9"
          bg="#EDE9FE"
        />

        <SummaryCard
          title="Delivered"
          value={summary.delivered}
          subtitle="Successfully delivered"
          icon={CheckCircle2}
          color="#15803D"
          bg="#DCFCE7"
        />
      </div>

      {/* FILTER SECTION */}

      <div className="rounded-xl border border-[#DCE6F2] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={17} className="text-[#2D6FE8]" />
          <h2 className="text-sm font-bold text-gray-800">
            Search & Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.6fr)_1fr_1fr_1fr_auto]">
          {/* SEARCH */}

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

          {/* STATUS */}

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

          {/* FROM DATE */}

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

          {/* TO DATE */}

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

          {/* ACTIONS */}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyDateFilter}
              className="h-10 flex-1 rounded-lg bg-[#2D6FE8] px-4 text-sm font-semibold text-white transition hover:bg-[#1E40AF]"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={clearFilters}
              title="Clear filters"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-gray-500 transition hover:bg-gray-50 hover:text-red-500"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400">
              Active filters:
            </span>

            {statusFilter !== "all" && (
              <span className="rounded-full bg-[#EAF3FF] px-3 py-1 text-[11px] font-semibold capitalize text-[#1E40AF]">
                {statusFilter}
              </span>
            )}

            {fromDate && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] text-gray-600">
                From: {fromDate}
              </span>
            )}

            {toDate && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] text-gray-600">
                To: {toDate}
              </span>
            )}

            {search && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] text-gray-600">
                Search: {search}
              </span>
            )}
          </div>
        )}
      </div>

      {/* REPORT TABLE */}

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

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center">
            <Loader2
              size={32}
              className="animate-spin text-[#2D6FE8]"
            />
            <p className="mt-3 text-sm font-medium text-gray-500">
              Loading delivery reports...
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          /* EMPTY STATE */

          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FileText size={25} />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-800">
              No Delivery Records Found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-gray-500">
              No records match your search or selected filters.
              Try changing your filters.
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
                      "Order Details",
                      "Product",
                      "Recipient",
                      "Shipment",
                      "Timeline",
                      "Status",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap border-b border-[#DCE6F2] px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredReports.map((item, index) => {
                    const key = `${item["Order Reference"]}-${item.SKU}-${index}`;
                    const expanded = expandedOrder === key;

                    return (
                      <React.Fragment key={key}>
                        <tr className="transition hover:bg-[#F8FBFF]">
                          {/* ORDER */}

                          <td className="px-4 py-4 align-top">
                            <p className="text-xs font-bold text-gray-900">
                              {item["Order Reference"]}
                            </p>

                            <p className="mt-1 text-[11px] text-gray-500">
                              Invoice: {item["Invoice Number"] || "—"}
                            </p>

                            <p className="mt-1 text-[11px] text-gray-400">
                              {formatDate(item["Placed At"])}
                            </p>
                          </td>

                          {/* PRODUCT */}

                          <td className="max-w-[190px] px-4 py-4 align-top">
                            <p className="truncate text-xs font-semibold text-gray-800">
                              {item["Item Name"]}
                            </p>

                            <p className="mt-1 text-[11px] text-gray-500">
                              SKU: {item.SKU}
                            </p>

                            <p className="mt-1 text-[11px] text-gray-500">
                              Quantity: {item.QTY}
                            </p>
                          </td>

                          {/* RECIPIENT */}

                          <td className="max-w-[190px] px-4 py-4 align-top">
                            <p className="truncate text-xs font-semibold text-gray-800">
                              {item["Recipient Name"]}
                            </p>

                            <p className="mt-1 text-[11px] text-gray-500">
                              {item["Recipient Phone"]}
                            </p>

                            <p className="mt-1 truncate text-[11px] text-gray-400">
                              {item["Recipient Email"]}
                            </p>
                          </td>

                          {/* SHIPMENT */}

                          <td className="px-4 py-4 align-top">
                            <p className="text-xs font-semibold text-gray-800">
                              {item.Carrier || "—"}
                            </p>

                            <p className="mt-1 text-[11px] text-gray-500">
                              AWB: {item["Shipment Number"] || "—"}
                            </p>
                          </td>

                          {/* TIMELINE */}

                          <td className="px-4 py-4 align-top">
                            <div className="space-y-1.5">
                              <p className="text-[11px] text-gray-500">
                                Dispatched:{" "}
                                <span className="font-medium text-gray-700">
                                  {item["Dispatched At"]
                                    ? formatDate(item["Dispatched At"])
                                    : "—"}
                                </span>
                              </p>

                              <p className="text-[11px] text-gray-500">
                                Shipped:{" "}
                                <span className="font-medium text-gray-700">
                                  {item["Shipped At"]
                                    ? formatDate(item["Shipped At"])
                                    : "—"}
                                </span>
                              </p>

                              <p className="text-[11px] text-gray-500">
                                Delivered:{" "}
                                <span className="font-medium text-gray-700">
                                  {item["Delivered At"]
                                    ? formatDate(item["Delivered At"])
                                    : "—"}
                                </span>
                              </p>
                            </div>
                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-4 align-top">
                            <StatusBadge
                              status={item["Delivery Status"]}
                            />
                          </td>

                          {/* ACTION */}

                          <td className="px-4 py-4 align-top">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOrder(
                                  expanded ? null : key
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] px-3 py-2 text-xs font-semibold text-[#2D6FE8] transition hover:bg-[#EAF3FF]"
                            >
                              Details
                              <ChevronRight
                                size={14}
                                className={`transition-transform ${
                                  expanded ? "rotate-90" : ""
                                }`}
                              />
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDED DETAILS */}

                        {expanded && (
                          <tr className="bg-[#F8FBFF]">
                            <td colSpan={7} className="px-5 py-4">
                              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                <div>
                                  <p className="mb-3 text-xs font-bold text-gray-800">
                                    Delivery Timeline
                                  </p>

                                  <div className="space-y-3">
                                    <DateItem
                                      label="Placed At"
                                      value={item["Placed At"]}
                                    />
                                    <DateItem
                                      label="Dispatched At"
                                      value={item["Dispatched At"]}
                                    />
                                    <DateItem
                                      label="Shipped At"
                                      value={item["Shipped At"]}
                                    />
                                    <DateItem
                                      label="Delivered At"
                                      value={item["Delivered At"]}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <p className="mb-3 text-xs font-bold text-gray-800">
                                    Recipient Information
                                  </p>

                                  <div className="space-y-3 text-xs text-gray-600">
                                    <p className="flex items-center gap-2">
                                      <User
                                        size={14}
                                        className="text-[#2D6FE8]"
                                      />
                                      {item["Recipient Name"]}
                                    </p>

                                    <p className="flex items-center gap-2 break-all">
                                      <Phone
                                        size={14}
                                        className="text-[#2D6FE8]"
                                      />
                                      {item["Recipient Phone"]}
                                    </p>

                                    <p className="flex items-center gap-2 break-all">
                                      <Mail
                                        size={14}
                                        className="text-[#2D6FE8]"
                                      />
                                      {item["Recipient Email"]}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <p className="mb-3 text-xs font-bold text-gray-800">
                                    Shipment Information
                                  </p>

                                  <div className="space-y-3 text-xs text-gray-600">
                                    <p className="flex items-center gap-2">
                                      <Truck
                                        size={14}
                                        className="text-[#2D6FE8]"
                                      />
                                      Carrier: {item.Carrier || "—"}
                                    </p>

                                    <p className="flex items-center gap-2">
                                      <Hash
                                        size={14}
                                        className="text-[#2D6FE8]"
                                      />
                                      Shipment: {item["Shipment Number"] || "—"}
                                    </p>

                                    <p className="flex items-center gap-2">
                                      <Package
                                        size={14}
                                        className="text-[#2D6FE8]"
                                      />
                                      Quantity: {item.QTY}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="space-y-3 p-3 lg:hidden">
              {filteredReports.map((item, index) => (
                <MobileOrderCard
                  key={`${item["Order Reference"]}-${item.SKU}-${index}`}
                  item={item}
                  index={index}
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

      {/* FOOTER NOTE */}

      <div className="flex items-start gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 py-3">
        <FileText
          size={15}
          className="mt-0.5 shrink-0 text-[#2D6FE8]"
        />

        <p className="text-[11px] leading-5 text-gray-500">
          Delivery records are fetched from the delivery report API.
          The summary cards reflect the records currently loaded from
          the API. Missing invoice, shipment or delivery information
          is displayed as —.
        </p>
      </div>
    </div>
  );
};

export default DeliveryReport;
