import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    RadialBarChart,
    RadialBar,
} from "recharts";
import {
    FiActivity,
    FiCalendar,
    FiCheckCircle,
    FiCreditCard,
    FiDownload,
    FiPackage,
    FiRefreshCw,
    FiShoppingCart,
    FiTruck,
    FiTrendingUp,
    FiUsers,
    FiAlertCircle,
    FiInbox,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

import salesReportApi, {
    type SalesReportData,
    type SalesChartItem,
    type SalesStatusItem,
} from "../../api/endpoints/salesReportApi";

const TEAL = "#0D9488"; // teal-600
const TEAL_LIGHT = "#2DD4BF"; // teal-400
const TEAL_DARK = "#0F766E"; // teal-700
const YELLOW = "#FACC15";
const BORDER = "#D5E8E5";
const MUTED = "#6B7280";
const YELLOW_DARK = "#CA8A04";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 },
    },
};

// =====================================================
// HELPERS
// =====================================================

const localDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getDefaultFromDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return localDate(date);
};

const getDefaultToDate = () => localDate(new Date());

const formatCurrency = (value: number | string | null | undefined) => {
    return `₹${Number(value ?? 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    })}`;
};

const formatNumber = (value: number | string | null | undefined) => {
    return Number(value ?? 0).toLocaleString("en-IN");
};

const formatLabel = (value: string) => {
    return value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const exportToCsv = (
    report: SalesReportData,
    fromDate: string,
    toDate: string
) => {
    const rows: (string | number)[][] = [
        ["SALES REPORT"],
        ["From Date", fromDate],
        ["To Date", toDate],
        [],
        ["Summary", "Value"],
        ["Total Orders", report.summary.total_orders],
        ["Total Items Sold", report.summary.total_items_sold],
        ["Total Revenue", report.summary.total_revenue],
        ["GST Collected", report.summary.total_gst_collected],
        ["Shipping Charges", report.summary.total_shipping_charge],
        ["Coupon Discount", report.summary.total_coupon_discount],
        ["Average Order Value", report.summary.average_order_value],
        [],
        ["DAILY SALES"],
        ["Day", "Orders", "Revenue", "GST", "Items"],
        ...report.chart.map((item) => [
            item.label,
            item.orders,
            item.revenue,
            item.gst,
            item.items,
        ]),
        [],
        ["TOP PRODUCTS"],
        ["Product", "Product Code", "Quantity", "Revenue"],
        ...report.top_products.map((product) => [
            product.name,
            product.product_code,
            product.total_qty,
            product.total_revenue,
        ]),
        [],
        ["TOP DISTRIBUTORS"],
        ["Name", "Email", "Orders", "Revenue"],
        ...report.top_distributors.map((distributor) => [
            distributor.name,
            distributor.email,
            distributor.total_orders,
            distributor.total_revenue,
        ]),
        [],
        ["PAYMENT BREAKDOWN"],
        ["Gateway", "Transactions", "Amount"],
        ...report.payment_breakdown.map((payment) => [
            payment.payment_gateway,
            payment.count,
            payment.amount,
        ]),
    ];

    const csvContent = rows
        .map((row) =>
            row
                .map((value) => {
                    const safeValue = String(value ?? "").replace(/"/g, '""');
                    return `"${safeValue}"`;
                })
                .join(",")
        )
        .join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `sales-report-${fromDate}-to-${toDate}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

// Rank badge colours: gold / silver / bronze for top 3, teal for the rest
const rankStyle = (index: number) => {
    if (index === 0)
        return "bg-gradient-to-br from-[#FDE047] to-[#EAB308] text-[#713F12] shadow-[0_6px_14px_-6px_rgba(234,179,8,0.9)]";
    if (index === 1)
        return "bg-gradient-to-br from-[#E5E7EB] to-[#9CA3AF] text-[#1F2937]";
    if (index === 2)
        return "bg-gradient-to-br from-[#FDBA74] to-[#EA580C] text-white";
    return "bg-[#CCFBF1] text-[#0F766E]";
};

// =====================================================
// TYPES
// =====================================================

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    icon: React.ElementType;
    theme: "blue" | "yellow";
    index: number;
}

interface PanelProps {
    title: string;
    subtitle?: string;
    icon?: React.ElementType;
    children: React.ReactNode;
    className?: string;
    badge?: React.ReactNode;
}

// =====================================================
// STAT CARD
// =====================================================

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    description,
    icon: Icon,
    theme,
    index,
}) => {
    const isYellow = theme === "yellow";

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -3 }}
            className="relative min-w-0 overflow-hidden rounded-[18px] border bg-white p-4 shadow-[0_4px_18px_rgba(13,148,136,0.07)] transition-shadow hover:shadow-[0_12px_28px_rgba(13,148,136,0.14)]"
            style={{ borderColor: BORDER }}
        >
            <div
                className="absolute inset-y-0 left-0 w-0.5"
                style={{
                    background: isYellow ? YELLOW : TEAL,
                }}
            />

            <div className="flex items-start justify-between gap-2 pl-1.5">
                <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[#4B5563]">{title}</p>

                    <motion.p
                        key={value}
                        initial={{ opacity: 0.5, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.035 }}
                        className="mt-2 break-words text-[22px] font-bold leading-tight tracking-[-0.03em] text-[#0B1220] sm:text-[22px]"
                    >
                        {value}
                    </motion.p>
                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isYellow
                        ? "bg-[#FEF9C3] text-[#A16207] ring-1 ring-[#FACC15]/40"
                        : "bg-[#CCFBF1] text-[#0D9488] ring-1 ring-[#0D9488]/15"
                        }`}
                >
                    <Icon size={19} />
                </div>
            </div>

            <p className="mt-3 truncate pl-1.5 text-[11px] text-[#6B7280]">
                {description}
            </p>
        </motion.div>
    );
};

// =====================================================
// REUSABLE PANEL
// =====================================================

const Panel: React.FC<PanelProps> = ({
    title,
    subtitle,
    icon: Icon,
    children,
    className = "",
    badge,
}) => (
    <motion.section
        variants={itemVariants}
        className={`min-w-0 overflow-hidden rounded-[20px] border bg-white shadow-[0_4px_22px_rgba(13,148,136,0.07)] ${className}`}
        style={{ borderColor: BORDER }}
    >
        <header className="flex items-center justify-between gap-3 border-b border-[#D5E8E5] bg-gradient-to-r from-[#E6FAF6] via-white to-white px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
                {Icon && (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0D9488] text-white shadow-[0_8px_18px_-8px_rgba(13,148,136,0.85)]">
                        <Icon size={19} />
                    </div>
                )}

                <div className="min-w-0">
                    <h2 className="truncate text-[16px] font-bold text-[#0B1220]">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-0.5 truncate text-[12px] text-[#6B7280]">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {badge}
        </header>

        <div className="p-4 sm:p-5">{children}</div>
    </motion.section>
);

const CountBadge: React.FC<{ count: number; label: string }> = ({
    count,
    label,
}) => (
    <div className="flex shrink-0 items-baseline gap-1.5 rounded-full bg-[#CCFBF1] px-3 py-1.5 text-[#0F766E] ring-1 ring-[#0D9488]/20">
        <span className="text-[11px] font-semibold leading-none">{count}</span>
        <span className="text-[11px] font-semibold">{label}</span>
    </div>
);

const EmptyState: React.FC<{ title: string; hint: string }> = ({
    title,
    hint,
}) => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#BFE3DE] bg-[#F6FDFC] px-4 py-10 text-center">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0D9488] shadow-sm ring-1 ring-[#D5E8E5]">
            <FiInbox size={20} />
        </div>
        <p className="text-[13px] font-bold text-[#0B1220]">{title}</p>
        <p className="mt-0.5 text-[12px] text-[#6B7280]">{hint}</p>
    </div>
);

// =====================================================
// STATUS LIST
// =====================================================

const StatusList: React.FC<{
    items: SalesStatusItem[];
    labelKey: "delivery_status" | "return_status" | "cancel_state";
}> = ({ items, labelKey }) => {
    if (!items.length) {
        return (
            <p className="rounded-xl bg-[#F6FDFC] p-4 text-center text-[12px] text-[#6B7280]">
                No status data available.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {items.map((item, index) => {
                const label = item[labelKey] || "Unknown";
                const amount = Number(item.total_amount || 0);

                return (
                    <div
                        key={`${label}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[#D5E8E5] bg-[#F6FDFC] px-3 py-3"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-[13px] font-bold text-[#0B1220]">
                                {formatLabel(label)}
                            </p>

                            <p className="mt-1 text-[11px] text-[#6B7280]">
                                {formatNumber(item.line_count)} lines
                                {" · "}
                                {formatNumber(item.total_qty)} items
                            </p>
                        </div>

                        <div className="shrink-0 text-right">
                            <p className="text-[13px] font-bold text-[#0B1220]">
                                {formatCurrency(amount)}
                            </p>
                            <p className="mt-1 text-[11px] text-[#6B7280]">Total amount</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// =====================================================
// MAIN SALES REPORT
// =====================================================

const SalesReport: React.FC = () => {
    const [report, setReport] = useState<SalesReportData | null>(null);

    const [fromDate, setFromDate] = useState(getDefaultFromDate);
    const [toDate, setToDate] = useState(getDefaultToDate);

    const [appliedFromDate, setAppliedFromDate] = useState(getDefaultFromDate);
    const [appliedToDate, setAppliedToDate] = useState(getDefaultToDate);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const fetchReport = useCallback(
        async (startDate: string, endDate: string, refreshing = false) => {
            try {
                if (refreshing) {
                    setIsRefreshing(true);
                } else {
                    setIsLoading(true);
                }

                setErrorMessage("");

                const response = await salesReportApi.getSalesReport({
                    from_date: startDate,
                    to_date: endDate,
                });

                if (!response.data.status || !response.data.data) {
                    throw new Error(
                        response.data.message || "Unable to fetch sales report."
                    );
                }

                setReport(response.data.data);
                setAppliedFromDate(startDate);
                setAppliedToDate(endDate);
            } catch (error: any) {
                const message =
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to fetch sales report.";

                setErrorMessage(message);
                toast.error(message);
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        void fetchReport(fromDate, toDate);
        // Load the initial date range once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleApplyFilters = () => {
        if (!fromDate || !toDate) {
            toast.error("Please select both dates.");
            return;
        }

        if (fromDate > toDate) {
            toast.error("From date cannot be after the To date.");
            return;
        }

        void fetchReport(fromDate, toDate);
    };

    // Quick date presets (Last 7 days / 30 days / This month)
    const applyPreset = (preset: "7d" | "30d" | "month") => {
        const end = new Date();
        const start = new Date();

        if (preset === "7d") start.setDate(end.getDate() - 7);
        if (preset === "30d") start.setDate(end.getDate() - 30);
        if (preset === "month") start.setDate(1);

        const from = localDate(start);
        const to = localDate(end);

        setFromDate(from);
        setToDate(to);
        void fetchReport(from, to);
    };

    const handleRefresh = () => {
        void fetchReport(appliedFromDate, appliedToDate, true);
    };

    // ✅ FIX 1: Export now uses appliedFromDate / appliedToDate
    // which are only updated when the filter is actually applied.
    const handleExport = () => {
        if (!report || isExporting) return;

        try {
            setIsExporting(true);

            exportToCsv(report, appliedFromDate, appliedToDate);
            toast.success("Sales report exported successfully.");
        } catch (error) {
            console.error("Sales report export failed:", error);
            toast.error("Unable to export sales report.");
        } finally {
            setIsExporting(false);
        }
    };

    const summary = report?.summary;
    const chartData: SalesChartItem[] = report?.chart || [];
    const orderStatus = report?.order_status_breakdown;

    const refundSummary = report?.return_refund_summary;

    const paymentTotal = (report?.payment_breakdown || []).reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
    );

    const paymentColors = [TEAL, YELLOW, TEAL_LIGHT, "#5EEAD4"];

    const radialData = (report?.payment_breakdown || []).map((payment, index) => ({
        ...payment,
        name: formatLabel(payment.payment_gateway),
        fill: paymentColors[index % paymentColors.length],
    }));

    // ===================================================
    // LOADING
    // ===================================================

    if (isLoading && !report) {
        return (
            <div className="flex min-h-[65vh] items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            repeat: Infinity,
                            duration: 1,
                            ease: "linear",
                        }}
                        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0D9488] text-[#FACC15] shadow-lg"
                    >
                        <FiRefreshCw size={22} />
                    </motion.div>

                    <p className="text-sm font-semibold text-[#6B7280]">
                        Loading sales report...
                    </p>
                </div>
            </div>
        );
    }

    // ===================================================
    // ERROR STATE
    // ===================================================

    if (!report) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center bg-white p-4">
                <div className="w-full max-w-md rounded-[20px] border border-[#D5E8E5] bg-white p-8 text-center shadow-lg">
                    <FiAlertCircle size={30} className="mx-auto text-[#0D9488]" />

                    <h2 className="mt-4 text-lg font-bold text-[#0B1220]">
                        Unable to load sales report
                    </h2>

                    <p className="mt-2 text-sm leading-5 text-[#6B7280]">
                        {errorMessage || "Please try again."}
                    </p>

                    <button
                        type="button"
                        onClick={() => void fetchReport(fromDate, toDate)}
                        className="mt-5 rounded-xl bg-[#0D9488] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0F766E]"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const maxProductRevenue = Math.max(
        1,
        ...report.top_products.map((p) => Number(p.total_revenue || 0))
    );
    const maxDistributorRevenue = Math.max(
        1,
        ...report.top_distributors.map((d) => Number(d.total_revenue || 0))
    );

    // ===================================================
    // UI
    // ===================================================

    return (
        <div className="min-h-screen bg-white">
            <motion.div
                key={`${appliedFromDate}-${appliedToDate}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="min-h-screen bg-white bg-[radial-gradient(900px_420px_at_100%_-5%,rgba(250,204,21,0.10),transparent),radial-gradient(900px_480px_at_-5%_0%,rgba(13,148,136,0.07),transparent)] p-3 sm:p-4 lg:p-6"
            >
                {/* HEADER */}

                <motion.header
                    variants={itemVariants}
                    className="mb-6 flex flex-col justify-between gap-4 border-b pb-5 xl:flex-row xl:items-center"
                    style={{ borderColor: BORDER }}
                >
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#2DD4BF]" />
                            <span className="h-2 w-2 rounded-full bg-[#FACC15]" />
                            <span className="h-2 w-2 rounded-full bg-[#0D9488]" />

                            <span className="ml-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4B5563]">
                                Reports & Analytics
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-[22px] font-semibold tracking-[-0.035em] text-[#0B1220] sm:text-[24px]">
                                Sales Report
                            </h1>

                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FACC15]/60 bg-[#FEF9C3] px-3 py-1 text-[11px] font-bold text-[#854D0E]">
                                <span className="h-2 w-2 rounded-full bg-[#EAB308]" />
                                Live data
                            </span>
                        </div>

                        <p className="mt-0.5 max-w-2xl text-[13px] leading-5 text-[#6B7280]">
                            Track revenue, orders, product performance, distributors and
                            payments.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={isRefreshing || isLoading}
                            onClick={handleRefresh}
                            className="flex h-11 items-center gap-2 rounded-xl border border-[#BFE3DE] bg-white px-4 text-[12px] font-bold text-[#0D9488] shadow-sm transition hover:bg-[#CCFBF1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] disabled:opacity-50"
                        >
                            <motion.span
                                animate={{ rotate: isRefreshing ? 360 : 0 }}
                                transition={{
                                    repeat: isRefreshing ? Infinity : 0,
                                    duration: 0.8,
                                    ease: "linear",
                                }}
                                className="flex"
                            >
                                <FiRefreshCw size={15} />
                            </motion.span>

                            {isRefreshing ? "Refreshing..." : "Refresh"}
                        </button>

                        <button
                            type="button"
                            disabled={isExporting}
                            onClick={handleExport}
                            className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-[#FDE047] to-[#FACC15] px-5 text-[12px] font-bold text-[#111827] shadow-[0_8px_20px_-8px_rgba(250,204,21,0.65)] transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CA8A04] disabled:opacity-50"
                        >
                            <FiDownload size={15} />
                            {isExporting ? "Exporting..." : "Export CSV"}
                        </button>
                    </div>
                </motion.header>

                {/* DATE FILTERS */}

                <motion.section
                    variants={itemVariants}
                    className="mb-6 overflow-hidden rounded-[20px] border bg-white shadow-[0_4px_22px_rgba(13,148,136,0.06)]"
                    style={{ borderColor: BORDER }}
                >
                    <div className="flex flex-col gap-3 border-b border-[#D5E8E5] bg-gradient-to-r from-[#E6FAF6] via-white to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D9488] text-white">
                                <FiCalendar size={17} />
                            </div>

                            <div>
                                <h2 className="text-[15px] font-bold text-[#0B1220]">
                                    Filter sales report
                                </h2>
                                <p className="mt-0.5 text-[12px] text-[#6B7280]">
                                    Select a date range to fetch report data.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {[
                                { key: "7d", label: "Last 7 days" },
                                { key: "30d", label: "Last 30 days" },
                                { key: "month", label: "This month" },
                            ].map((preset) => (
                                <button
                                    key={preset.key}
                                    type="button"
                                    disabled={isLoading || isRefreshing}
                                    onClick={() => applyPreset(preset.key as "7d" | "30d" | "month")}
                                    className="rounded-full border border-[#BFE3DE] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#0F766E] transition hover:bg-[#CCFBF1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] disabled:opacity-50"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
                            <div>
                                <label
                                    htmlFor="sales-from-date"
                                    className="mb-1.5 block text-[12px] font-semibold text-[#374151]"
                                >
                                    From date
                                </label>

                                <input
                                    id="sales-from-date"
                                    type="date"
                                    value={fromDate}
                                    max={toDate || undefined}
                                    onChange={(event) => setFromDate(event.target.value)}
                                    className="h-11 w-full rounded-xl border bg-[#F6FDFC] px-3 text-[13px] text-[#111827] outline-none transition focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/15"
                                    style={{ borderColor: BORDER }}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="sales-to-date"
                                    className="mb-1.5 block text-[12px] font-semibold text-[#374151]"
                                >
                                    To date
                                </label>

                                <input
                                    id="sales-to-date"
                                    type="date"
                                    value={toDate}
                                    min={fromDate || undefined}
                                    onChange={(event) => setToDate(event.target.value)}
                                    className="h-11 w-full rounded-xl border bg-[#F6FDFC] px-3 text-[13px] text-[#111827] outline-none transition focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/15"
                                    style={{ borderColor: BORDER }}
                                />
                            </div>

                            <button
                                type="button"
                                disabled={isLoading || isRefreshing}
                                onClick={handleApplyFilters}
                                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0D9488] px-7 text-[12px] font-bold text-white not-even:transition hover:bg-[#0F766E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <FiRefreshCw className="animate-spin" size={14} />
                                ) : (
                                    <FiActivity size={14} />
                                )}
                                Apply filters
                            </button>
                        </div>

                        <p className="mt-3 text-[12px] text-[#6B7280]">
                            Report period:{" "}
                            <span className="rounded-md bg-[#CCFBF1] px-2 py-0.5 font-semibold text-[#0F766E]">
                                {report.from_date} to {report.to_date}
                            </span>
                        </p>
                    </div>
                </motion.section>

                {/* SUMMARY CARDS */}

                <motion.div
                    variants={containerVariants}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
                >
                    <StatCard
                        title="Total revenue"
                        value={formatCurrency(summary?.total_revenue)}
                        description="Revenue for selected period"
                        icon={FaRupeeSign}
                        theme="blue"
                        index={0}
                    />

                    <StatCard
                        title="Total orders"
                        value={formatNumber(summary?.total_orders)}
                        description="Orders in selected period"
                        icon={FiShoppingCart}
                        theme="yellow"
                        index={1}
                    />

                    <StatCard
                        title="Items sold"
                        value={formatNumber(summary?.total_items_sold)}
                        description="Total quantity sold"
                        icon={FiPackage}
                        theme="blue"
                        index={2}
                    />

                    <StatCard
                        title="GST collected"
                        value={formatCurrency(summary?.total_gst_collected)}
                        description="Total GST collected"
                        icon={FaRupeeSign}
                        theme="yellow"
                        index={3}
                    />

                    <StatCard
                        title="Shipping charges"
                        value={formatCurrency(summary?.total_shipping_charge)}
                        description="Total shipping charges"
                        icon={FiTruck}
                        theme="blue"
                        index={4}
                    />

                    <StatCard
                        title="Average order"
                        value={formatCurrency(summary?.average_order_value)}
                        description="Average order value"
                        icon={FiTrendingUp}
                        theme="yellow"
                        index={5}
                    />
                </motion.div>

                {/* REVENUE CHART + PAYMENT BREAKDOWN */}

                <motion.div
                    variants={containerVariants}
                    className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3"
                >
                    <Panel
                        title="Sales analytics"
                        subtitle="Revenue, order count and daily performance"
                        icon={FiActivity}
                        className="xl:col-span-2"
                    >
                        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-[#0D9488]" />
                                <span className="text-[12px] font-medium text-[#374151]">
                                    Revenue
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-[#FACC15]" />
                                <span className="text-[12px] font-medium text-[#374151]">
                                    Orders
                                </span>
                            </div>
                        </div>

                        <div className="h-[320px] w-full rounded-2xl border border-[#D5E8E5] bg-[#F9FEFD] p-2">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={chartData}
                                        margin={{ top: 12, right: 6, left: -12, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="revenueGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop offset="0%" stopColor={TEAL} stopOpacity={0.45} />
                                                <stop offset="100%" stopColor={TEAL} stopOpacity={0.02} />
                                            </linearGradient>

                                            <linearGradient
                                                id="ordersGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop offset="0%" stopColor={YELLOW} stopOpacity={0.4} />
                                                <stop offset="100%" stopColor={YELLOW} stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            stroke={BORDER}
                                            strokeDasharray="4 4"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 12, fill: "#4B5563" }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={8}
                                        />

                                        <YAxis
                                            yAxisId="revenue"
                                            tick={{ fontSize: 11, fill: "#4B5563" }}
                                            tickFormatter={(value: number) =>
                                                value >= 1000
                                                    ? `₹${(value / 1000).toFixed(1)}k`
                                                    : `₹${value}`
                                            }
                                            axisLine={false}
                                            tickLine={false}
                                            width={54}
                                        />

                                        <YAxis
                                            yAxisId="orders"
                                            orientation="right"
                                            allowDecimals={false}
                                            tick={{ fontSize: 11, fill: "#4B5563" }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={32}
                                        />

                                        <Tooltip
                                            formatter={(value: any, name: any) => [
                                                name === "Orders"
                                                    ? formatNumber(value)
                                                    : formatCurrency(value),
                                                name,
                                            ]}
                                            contentStyle={{
                                                border: `1px solid ${BORDER}`,
                                                borderRadius: 12,
                                                fontSize: 12,
                                                boxShadow: "0 8px 25px rgba(13,148,136,0.14)",
                                            }}
                                            labelStyle={{ fontWeight: 700, color: "#0B1220" }}
                                        />

                                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

                                        <Area
                                            yAxisId="revenue"
                                            dataKey="revenue"
                                            name="Revenue"
                                            type="monotone"
                                            stroke={TEAL}
                                            strokeWidth={3}
                                            fill="url(#revenueGradient)"
                                            dot={{
                                                r: 4,
                                                fill: TEAL,
                                                stroke: "#FFFFFF",
                                                strokeWidth: 2,
                                            }}
                                            activeDot={{ r: 6, fill: TEAL_DARK }}
                                        />

                                        <Area
                                            yAxisId="orders"
                                            dataKey="orders"
                                            name="Orders"
                                            type="monotone"
                                            stroke={YELLOW_DARK}
                                            strokeWidth={2.5}
                                            fill="url(#ordersGradient)"
                                            dot={{
                                                r: 4,
                                                fill: YELLOW,
                                                stroke: "#FFFFFF",
                                                strokeWidth: 2,
                                            }}
                                            activeDot={{ r: 6, fill: YELLOW_DARK }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center rounded-xl text-[13px] text-[#6B7280]">
                                    No sales chart data available.
                                </div>
                            )}
                        </div>
                    </Panel>

                    {/* PAYMENT BREAKDOWN */}

                    <Panel
                        title="Payment breakdown"
                        subtitle="Revenue by payment gateway"
                        icon={FiCreditCard}
                    >
                        {report.payment_breakdown.length > 0 ? (
                            <>
                                {/* ✅ FIX 2: Mota gola (thicker donut) + bigger radius */}
                                <div className="relative h-[260px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="45%"
                                            outerRadius="105%"
                                            barSize={26}
                                            data={radialData}
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            <RadialBar
                                                dataKey="amount"
                                                background={{ fill: "#EEF7F6" }}
                                                cornerRadius={10}
                                            />

                                            <Tooltip
                                                formatter={(value: any, name: any) => [
                                                    formatCurrency(value),
                                                    name,
                                                ]}
                                                contentStyle={{
                                                    border: `1px solid ${BORDER}`,
                                                    borderRadius: 10,
                                                    fontSize: 12,
                                                }}
                                            />
                                        </RadialBarChart>
                                    </ResponsiveContainer>

                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-[11px] font-semibold text-[#4B5563]">
                                            Total
                                        </span>
                                        <span className="mt-0.5 text-[18px] font-extrabold text-[#0B1220]">
                                            {formatCurrency(paymentTotal)}
                                        </span>
                                        <span className="text-[11px] text-[#6B7280]">Payments</span>
                                    </div>
                                </div>

                                <div
                                    className="mt-3 space-y-4 border-t pt-4"
                                    style={{ borderColor: BORDER }}
                                >
                                    {report.payment_breakdown.map((payment, index) => {
                                        const percentage =
                                            paymentTotal > 0
                                                ? (Number(payment.amount || 0) / paymentTotal) * 100
                                                : 0;

                                        return (
                                            <div key={`${payment.payment_gateway}-${index}`}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <span
                                                            className="h-3 w-3 shrink-0 rounded-full"
                                                            style={{
                                                                background:
                                                                    paymentColors[index % paymentColors.length],
                                                            }}
                                                        />
                                                        <span className="truncate text-[13px] font-semibold text-[#0B1220]">
                                                            {formatLabel(payment.payment_gateway)}
                                                        </span>
                                                    </div>

                                                    <span className="text-[13px] font-bold text-[#0B1220]">
                                                        {formatCurrency(payment.amount)}
                                                    </span>
                                                </div>

                                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEF7F6]">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            background:
                                                                paymentColors[index % paymentColors.length],
                                                        }}
                                                    />
                                                </div>

                                                <div className="mt-1 flex items-center justify-between text-[11px] text-[#6B7280]">
                                                    <span>{percentage.toFixed(1)}% of total</span>
                                                    <span>{formatNumber(payment.count)} transactions</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <EmptyState
                                title="No payment data"
                                hint="Payments will appear here for this period."
                            />
                        )}
                    </Panel>
                </motion.div>

                {/* TOP PRODUCTS + TOP DISTRIBUTORS */}

                <motion.div
                    variants={containerVariants}
                    className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2"
                >
                    <Panel
                        title="Top selling products"
                        subtitle="Products ranked by sales performance"
                        icon={FiPackage}
                        badge={<CountBadge count={report.top_products.length} label="products" />}
                    >
                        {report.top_products.length > 0 ? (
                            <div className="space-y-3">
                                {report.top_products.map((product, index) => {
                                    const pct = Math.round(
                                        (Number(product.total_revenue || 0) / maxProductRevenue) * 100
                                    );

                                    return (
                                        <div
                                            key={product.product_id}
                                            className="rounded-2xl border border-[#D5E8E5] bg-white p-3.5 transition hover:border-[#0D9488]/50 hover:shadow-[0_10px_24px_-12px_rgba(13,148,136,0.45)]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${rankStyle(
                                                        index
                                                    )}`}
                                                >
                                                    {index + 1}
                                                </span>

                                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D5E8E5] bg-[#F6FDFC]">
                                                    {product.image ? (
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="h-full w-full object-contain p-1"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <FiPackage className="text-[#6B7280]" size={22} />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[14px] font-semibold text-[#0B1220]">
                                                        {product.name}
                                                    </p>
                                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <span className="rounded-md bg-[#F0F4F8] px-1.5 py-0.5 text-[11px] font-medium text-[#4B5563]">
                                                            {product.product_code || "N/A"}
                                                        </span>
                                                        <span className="text-[12px] text-[#6B7280]">
                                                            {formatNumber(product.total_qty)} sold
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState
                                title="No product data"
                                hint="Top products will show up once orders come in."
                            />
                        )}
                    </Panel>

                    <Panel
                        title="Top distributors"
                        subtitle="Distributors ranked by order revenue"
                        icon={FiUsers}
                        badge={
                            <CountBadge count={report.top_distributors.length} label="distributors" />
                        }
                    >
                        {report.top_distributors.length > 0 ? (
                            <div className="space-y-3">
                                {report.top_distributors.map((distributor, index) => {
                                    const pct = Math.round(
                                        (Number(distributor.total_revenue || 0) /
                                            maxDistributorRevenue) *
                                        100
                                    );

                                    return (
                                        <div
                                            key={distributor.user_id}
                                            className="rounded-2xl border border-[#D5E8E5] bg-white p-3.5 transition hover:border-[#FACC15]/70 hover:shadow-[0_10px_24px_-12px_rgba(234,179,8,0.55)]"
                                        >
                                            <div className="flex items-center gap-3">


                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FDE047] to-[#FACC15] text-[15px] font-extrabold text-[#713F12] ring-2 ring-white shadow">
                                                    {String(distributor.name || "?")
                                                        .trim()
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[14px] font-bold text-[#0B1220]">
                                                        {distributor.name}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-[12px] text-[#6B7280]">
                                                        {distributor.email}
                                                    </p>
                                                    <span className="mt-1 inline-flex rounded-full bg-[#CCFBF1] px-2 py-0.5 text-[11px] font-semibold text-[#0F766E]">
                                                        {formatNumber(distributor.total_orders)} orders
                                                    </span>
                                                </div>

                                                <div className="shrink-0 text-right">
                                                    <p className="text-[14px] font-extrabold text-[#0D9488]">
                                                        {formatCurrency(distributor.total_revenue)}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-[#6B7280]">
                                                        Revenue
                                                    </p>
                                                </div>
                                            </div>


                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState
                                title="No distributor data"
                                hint="Top distributors will show up once orders come in."
                            />
                        )}
                    </Panel>
                </motion.div>

                {/* FOOTER */}

                <div
                    className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4"
                    style={{ borderColor: BORDER }}
                >
                    <p className="text-[12px] text-[#6B7280]">
                        Sales report · {report.from_date} to {report.to_date}
                    </p>

                    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0D9488]">
                        <FiCheckCircle size={13} />
                        Data loaded successfully
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default SalesReport;