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

// =====================================================
// COLOR PALETTE
// =====================================================

const BLUE = "#4F7FE8";
const BLUE_LIGHT = "#93B4FA";
const BLUE_DARK = "#315FCA";

const TEAL = "#0D9488";
const TEAL_LIGHT = "#2DD4BF";
const TEAL_DARK = "#0F766E";

const YELLOW = "#FACC15";
const YELLOW_DARK = "#CA8A04";

const BORDER = "#E2E8F0";
const MUTED = "#6B7280";

// Separate light themes for each panel.
type PanelTone = "blue" | "purple" | "green" | "amber";

const PANEL_TONES: Record<
    PanelTone,
    {
        border: string;
        header: string;
        surface: string;
        icon: string;
        iconShadow: string;
        badgeBg: string;
        badgeText: string;
        rowBg: string;
        rowBorder: string;
        accent: string;
    }
> = {
    blue: {
        border: "#D5E2FF",
        header:
            "linear-gradient(110deg, #EAF1FF 0%, #F4F7FF 52%, #FFFFFF 100%)",
        surface: "#FBFCFF",
        icon: "#4F7FE8",
        iconShadow: "0 7px 16px -8px rgba(79,127,232,0.5)",
        badgeBg: "#E5EDFF",
        badgeText: "#3159AE",
        rowBg: "#F7F9FF",
        rowBorder: "#DCE6FF",
        accent: "#4F7FE8",
    },

    purple: {
        border: "#E1D7FF",
        header:
            "linear-gradient(110deg, #F0EBFF 0%, #F8F5FF 52%, #FFFFFF 100%)",
        surface: "#FDFCFF",
        icon: "#8B68D9",
        iconShadow: "0 7px 16px -8px rgba(139,104,217,0.45)",
        badgeBg: "#EEE7FF",
        badgeText: "#6D45B6",
        rowBg: "#FAF8FF",
        rowBorder: "#E8DEFF",
        accent: "#8B68D9",
    },

    green: {
        border: "#CDEBD8",
        header:
            "linear-gradient(110deg, #E9F8EE 0%, #F4FCF6 52%, #FFFFFF 100%)",
        surface: "#FBFEFC",
        icon: "#37A875",
        iconShadow: "0 7px 16px -8px rgba(55,168,117,0.42)",
        badgeBg: "#E0F5E8",
        badgeText: "#23794F",
        rowBg: "#F6FCF8",
        rowBorder: "#D3ECDD",
        accent: "#37A875",
    },

    amber: {
        border: "#F2DCC0",
        header:
            "linear-gradient(110deg, #FFF2DF 0%, #FFFAF2 52%, #FFFFFF 100%)",
        surface: "#FFFDFA",
        icon: "#D99A43",
        iconShadow: "0 7px 16px -8px rgba(217,154,67,0.42)",
        badgeBg: "#FFF0D9",
        badgeText: "#9A611D",
        rowBg: "#FFFAF3",
        rowBorder: "#F2DFBF",
        accent: "#D99A43",
    },
};

// =====================================================
// ANIMATION VARIANTS
// =====================================================

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

const formatCurrency = (
    value: number | string | null | undefined
): string => {
    return `₹${Number(value ?? 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    })}`;
};

const formatNumber = (
    value: number | string | null | undefined
): string => {
    return Number(value ?? 0).toLocaleString("en-IN");
};

const formatLabel = (value: string): string => {
    return value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

// =====================================================
// CSV EXPORT
// =====================================================

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

// =====================================================
// RANK BADGES
// =====================================================

const rankStyle = (index: number) => {
    if (index === 0) {
        return "bg-gradient-to-br from-[#FDE68A] to-[#F5C451] text-[#78520B]";
    }

    if (index === 1) {
        return "bg-gradient-to-br from-[#E5E7EB] to-[#C4CBD5] text-[#374151]";
    }

    if (index === 2) {
        return "bg-gradient-to-br from-[#F5D0B0] to-[#E9A77B] text-[#754222]";
    }

    return "bg-[#E1F5E8] text-[#23794F]";
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
    tone?: PanelTone;
}

// =====================================================
// SKELETON PRIMITIVES
// =====================================================

const SkeletonBlock: React.FC<{
    className?: string;
    style?: React.CSSProperties;
}> = ({ className = "", style }) => (
    <div
        className={`animate-pulse rounded-md bg-[#E8EDF5] ${className}`}
        style={style}
    />
);

const SkeletonCircle: React.FC<{ className?: string }> = ({
    className = "",
}) => (
    <div className={`animate-pulse rounded-full bg-[#E8EDF5] ${className}`} />
);

// =====================================================
// SKELETON LOADER
// =====================================================

const SalesReportSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-white">
            <div className="min-h-screen bg-[radial-gradient(900px_420px_at_100%_-5%,rgba(250,204,21,0.08),transparent),radial-gradient(900px_480px_at_-5%_0%,rgba(79,127,232,0.08),transparent)] p-3 sm:p-4 lg:p-6">
                {/* HEADER */}
                <div
                    className="mb-6 flex flex-col justify-between gap-4 border-b pb-5 xl:flex-row xl:items-center"
                    style={{ borderColor: BORDER }}
                >
                    <div className="w-full max-w-xl">
                        <div className="mb-2 flex items-center gap-2">
                            <SkeletonCircle className="h-2 w-2" />
                            <SkeletonCircle className="h-2 w-2" />
                            <SkeletonCircle className="h-2 w-2" />
                            <SkeletonBlock className="ml-1 h-3 w-32" />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <SkeletonBlock className="h-7 w-44" />
                            <SkeletonBlock className="h-6 w-24 rounded-full" />
                        </div>

                        <SkeletonBlock className="mt-3 h-3 w-full max-w-md" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <SkeletonBlock className="h-11 w-28 rounded-xl" />
                        <SkeletonBlock className="h-11 w-32 rounded-xl" />
                    </div>
                </div>

                {/* DATE FILTER */}
                <div
                    className="mb-6 overflow-hidden rounded-[20px] border bg-white"
                    style={{ borderColor: PANEL_TONES.blue.border }}
                >
                    <div className="flex flex-col gap-3 border-b bg-gradient-to-r from-[#EAF1FF] via-[#F5F8FF] to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex items-center gap-3">
                            <SkeletonBlock className="h-10 w-10 rounded-xl" />
                            <div>
                                <SkeletonBlock className="h-4 w-40" />
                                <SkeletonBlock className="mt-1.5 h-3 w-56" />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <SkeletonBlock className="h-8 w-24 rounded-full" />
                            <SkeletonBlock className="h-8 w-24 rounded-full" />
                            <SkeletonBlock className="h-8 w-24 rounded-full" />
                        </div>
                    </div>

                    <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
                            <div>
                                <SkeletonBlock className="mb-1.5 h-3 w-20" />
                                <SkeletonBlock className="h-11 w-full rounded-xl" />
                            </div>
                            <div>
                                <SkeletonBlock className="mb-1.5 h-3 w-16" />
                                <SkeletonBlock className="h-11 w-full rounded-xl" />
                            </div>
                            <SkeletonBlock className="h-11 w-full rounded-xl xl:w-36" />
                        </div>

                        <SkeletonBlock className="mt-3 h-3 w-64" />
                    </div>
                </div>

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="relative min-w-0 overflow-hidden rounded-[18px] border bg-white p-4"
                            style={{
                                borderColor:
                                    index % 2 === 0
                                        ? PANEL_TONES.blue.border
                                        : "#F2DFBF",
                            }}
                        >
                            <div
                                className="absolute inset-y-0 left-0 w-0.5"
                                style={{
                                    background:
                                        index % 2 === 0
                                            ? BLUE
                                            : YELLOW,
                                }}
                            />

                            <div className="flex items-start justify-between gap-2 pl-1.5">
                                <div className="min-w-0 flex-1">
                                    <SkeletonBlock className="h-3 w-24" />
                                    <SkeletonBlock className="mt-2 h-6 w-28" />
                                </div>
                                <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                            </div>

                            <SkeletonBlock className="mt-3 h-3 w-32" />
                        </div>
                    ))}
                </div>

                {/* CHARTS */}
                <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
                    <div
                        className="min-w-0 overflow-hidden rounded-[20px] border bg-[#FBFCFF] xl:col-span-2"
                        style={{ borderColor: PANEL_TONES.blue.border }}
                    >
                        <div className="flex items-center gap-3 border-b bg-gradient-to-r from-[#EAF1FF] to-white px-4 py-4 sm:px-5">
                            <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                            <div>
                                <SkeletonBlock className="h-4 w-36" />
                                <SkeletonBlock className="mt-1.5 h-3 w-52" />
                            </div>
                        </div>

                        <div className="p-4 sm:p-5">
                            <div className="mb-4 flex flex-wrap gap-3">
                                <SkeletonBlock className="h-3 w-20" />
                                <SkeletonBlock className="h-3 w-16" />
                            </div>

                            <div className="flex h-[320px] items-end gap-3 rounded-2xl border border-[#DCE6FF] bg-[#F6F8FF] p-4">
                                {[40, 65, 52, 80, 60, 90, 72, 55, 84, 68].map(
                                    (height, index) => (
                                        <div
                                            key={index}
                                            className="flex-1 animate-pulse rounded-t-md bg-[#DCE6FF]"
                                            style={{ height: `${height}%` }}
                                        />
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div
                        className="min-w-0 overflow-hidden rounded-[20px] border bg-[#FDFCFF]"
                        style={{ borderColor: PANEL_TONES.purple.border }}
                    >
                        <div className="flex items-center gap-3 border-b bg-gradient-to-r from-[#F0EBFF] to-white px-4 py-4 sm:px-5">
                            <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                            <div>
                                <SkeletonBlock className="h-4 w-36" />
                                <SkeletonBlock className="mt-1.5 h-3 w-44" />
                            </div>
                        </div>

                        <div className="p-4 sm:p-5">
                            <div className="relative flex h-[260px] items-center justify-center">
                                <SkeletonCircle className="h-44 w-44 border-[26px] border-[#EAE3FF] bg-transparent" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                                    <SkeletonBlock className="h-3 w-12" />
                                    <SkeletonBlock className="h-5 w-24" />
                                    <SkeletonBlock className="h-3 w-16" />
                                </div>
                            </div>

                            <div
                                className="mt-3 space-y-4 border-t pt-4"
                                style={{ borderColor: PANEL_TONES.purple.border }}
                            >
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index}>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <SkeletonCircle className="h-3 w-3" />
                                                <SkeletonBlock className="h-3 w-28" />
                                            </div>
                                            <SkeletonBlock className="h-3 w-20" />
                                        </div>
                                        <SkeletonBlock className="mt-2 h-2 w-full rounded-full" />
                                        <div className="mt-1 flex items-center justify-between">
                                            <SkeletonBlock className="h-3 w-20" />
                                            <SkeletonBlock className="h-3 w-24" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PRODUCT + DISTRIBUTOR PANELS */}
                <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {(
                        [
                            {
                                key: "products",
                                tone: PANEL_TONES.green,
                            },
                            {
                                key: "distributors",
                                tone: PANEL_TONES.amber,
                            },
                        ] as const
                    ).map((panel) => (
                        <div
                            key={panel.key}
                            className="min-w-0 overflow-hidden rounded-[20px] border bg-white"
                            style={{ borderColor: panel.tone.border }}
                        >
                            <div
                                className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5"
                                style={{
                                    background: panel.tone.header,
                                    borderColor: panel.tone.border,
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                                    <div>
                                        <SkeletonBlock className="h-4 w-40" />
                                        <SkeletonBlock className="mt-1.5 h-3 w-56" />
                                    </div>
                                </div>
                                <SkeletonBlock className="h-7 w-24 rounded-full" />
                            </div>

                            <div
                                className="space-y-3 p-4 sm:p-5"
                                style={{ background: panel.tone.surface }}
                            >
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="rounded-2xl border bg-white p-3.5"
                                        style={{ borderColor: panel.tone.rowBorder }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <SkeletonCircle className="h-9 w-9" />
                                            <SkeletonBlock className="h-12 w-12 rounded-xl" />
                                            <div className="min-w-0 flex-1">
                                                <SkeletonBlock className="h-4 w-3/4" />
                                                <SkeletonBlock className="mt-2 h-3 w-1/2" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* FOOTER */}
                <div
                    className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4"
                    style={{ borderColor: BORDER }}
                >
                    <SkeletonBlock className="h-3 w-56" />
                    <SkeletonBlock className="h-3 w-40" />
                </div>
            </div>
        </div>
    );
};

// =====================================================
// SUMMARY STAT CARD
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

    const cardColor = isYellow ? YELLOW : BLUE;
    const iconClasses = isYellow
        ? "bg-[#FFF4D9] text-[#A86E14] ring-1 ring-[#F2D9A0]/80"
        : "bg-[#E8EFFF] text-[#426CD0] ring-1 ring-[#D2DEFF]";

    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -3 }}
            className="relative min-w-0 overflow-hidden rounded-[18px] border bg-white p-4 shadow-[0_4px_18px_rgba(45,70,110,0.05)] transition-shadow hover:shadow-[0_10px_24px_rgba(45,70,110,0.10)]"
            style={{
                borderColor: isYellow ? "#F2DFBF" : PANEL_TONES.blue.border,
            }}
        >
            <div
                className="absolute inset-y-0 left-0 w-1"
                style={{ background: cardColor }}
            />

            <div className="flex items-start justify-between gap-2 pl-1.5">
                <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[#4B5563]">
                        {title}
                    </p>

                    <motion.p
                        key={value}
                        initial={{ opacity: 0.5, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.035 }}
                        className="mt-2 break-words text-[21px] font-bold leading-tight tracking-[-0.03em] text-[#172033] sm:text-[22px]"
                    >
                        {value}
                    </motion.p>
                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClasses}`}
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
// REUSABLE COLOR-THEMED PANEL
// =====================================================

const Panel: React.FC<PanelProps> = ({
    title,
    subtitle,
    icon: Icon,
    children,
    className = "",
    badge,
    tone = "blue",
}) => {
    const palette = PANEL_TONES[tone];

    return (
        <motion.section
            variants={itemVariants}
            className={`min-w-0 overflow-hidden rounded-[20px] border ${className}`}
            style={{
                borderColor: palette.border,
                backgroundColor: palette.surface,
                boxShadow: `0 4px 20px ${palette.accent}0D`,
            }}
        >
            <header
                className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5"
                style={{
                    borderBottomColor: palette.border,
                    background: palette.header,
                }}
            >
                <div className="flex min-w-0 items-center gap-3">
                    {Icon && (
                        <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                            style={{
                                backgroundColor: palette.icon,
                                boxShadow: palette.iconShadow,
                            }}
                        >
                            <Icon size={19} />
                        </div>
                    )}

                    <div className="min-w-0">
                        <h2 className="truncate text-[16px] font-bold text-[#172033]">
                            {title}
                        </h2>

                        {subtitle && (
                            <p className="mt-0.5 truncate text-[12px] text-[#647084]">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {badge}
            </header>

            <div
                className="p-4 sm:p-5"
                style={{ backgroundColor: palette.surface }}
            >
                {children}
            </div>
        </motion.section>
    );
};

// =====================================================
// COUNT BADGE
// =====================================================

const CountBadge: React.FC<{
    count: number;
    label: string;
    tone?: PanelTone;
}> = ({ count, label, tone = "green" }) => {
    const palette = PANEL_TONES[tone];

    return (
        <div
            className="flex shrink-0 items-baseline gap-1.5 rounded-full px-3 py-1.5 ring-1"
            style={{
                backgroundColor: palette.badgeBg,
                color: palette.badgeText,
                borderColor: palette.border,
                ["--tw-ring-color" as string]: palette.border,
            }}
        >
            <span className="text-[11px] font-semibold leading-none">
                {count}
            </span>
            <span className="text-[11px] font-semibold">{label}</span>
        </div>
    );
};

// =====================================================
// EMPTY STATE
// =====================================================

const EmptyState: React.FC<{
    title: string;
    hint: string;
    tone?: PanelTone;
}> = ({ title, hint, tone = "blue" }) => {
    const palette = PANEL_TONES[tone];

    return (
        <div
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-10 text-center"
            style={{
                borderColor: palette.border,
                backgroundColor: palette.surface,
            }}
        >
            <div
                className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"
                style={{
                    color: palette.icon,
                    border: `1px solid ${palette.border}`,
                }}
            >
                <FiInbox size={20} />
            </div>

            <p className="text-[13px] font-bold text-[#172033]">{title}</p>
            <p className="mt-0.5 text-[12px] text-[#6B7280]">{hint}</p>
        </div>
    );
};

// =====================================================
// STATUS LIST
// =====================================================

const StatusList: React.FC<{
    items: SalesStatusItem[];
    labelKey: "delivery_status" | "return_status" | "cancel_state";
}> = ({ items, labelKey }) => {
    if (!items.length) {
        return (
            <p className="rounded-xl bg-[#F7F9FF] p-4 text-center text-[12px] text-[#6B7280]">
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
                        className="flex items-center justify-between gap-3 rounded-xl border px-3 py-3"
                        style={{
                            borderColor: PANEL_TONES.blue.rowBorder,
                            backgroundColor: PANEL_TONES.blue.rowBg,
                        }}
                    >
                        <div className="min-w-0">
                            <p className="truncate text-[13px] font-bold text-[#172033]">
                                {formatLabel(label)}
                            </p>

                            <p className="mt-1 text-[11px] text-[#6B7280]">
                                {formatNumber(item.line_count)} lines
                                {" · "}
                                {formatNumber(item.total_qty)} items
                            </p>
                        </div>

                        <div className="shrink-0 text-right">
                            <p className="text-[13px] font-bold text-[#172033]">
                                {formatCurrency(amount)}
                            </p>
                            <p className="mt-1 text-[11px] text-[#6B7280]">
                                Total amount
                            </p>
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

    const [appliedFromDate, setAppliedFromDate] =
        useState(getDefaultFromDate);

    const [appliedToDate, setAppliedToDate] =
        useState(getDefaultToDate);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // -------------------------------------------------
    // FETCH REPORT
    // -------------------------------------------------

    const fetchReport = useCallback(
        async (
            startDate: string,
            endDate: string,
            refreshing = false
        ) => {
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
                        response.data.message ||
                            "Unable to fetch sales report."
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

    // -------------------------------------------------
    // INITIAL FETCH
    // -------------------------------------------------

    useEffect(() => {
        void fetchReport(fromDate, toDate);

        // Load the initial date range once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // -------------------------------------------------
    // APPLY FILTERS
    // -------------------------------------------------

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

    // -------------------------------------------------
    // QUICK DATE PRESETS
    // -------------------------------------------------

    const applyPreset = (preset: "7d" | "30d" | "month") => {
        const end = new Date();
        const start = new Date();

        if (preset === "7d") {
            start.setDate(end.getDate() - 7);
        }

        if (preset === "30d") {
            start.setDate(end.getDate() - 30);
        }

        if (preset === "month") {
            start.setDate(1);
        }

        const from = localDate(start);
        const to = localDate(end);

        setFromDate(from);
        setToDate(to);

        void fetchReport(from, to);
    };

    // -------------------------------------------------
    // REFRESH
    // -------------------------------------------------

    const handleRefresh = () => {
        void fetchReport(appliedFromDate, appliedToDate, true);
    };

    // -------------------------------------------------
    // CSV EXPORT
    // -------------------------------------------------

    const handleExport = () => {
        if (!report || isExporting) {
            return;
        }

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

    // -------------------------------------------------
    // REPORT DATA
    // -------------------------------------------------

    const summary = report?.summary;
    const chartData: SalesChartItem[] = report?.chart || [];

    const paymentBreakdown = report?.payment_breakdown || [];

    const paymentTotal = paymentBreakdown.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
    );

    // Different but coordinated shades of lavender.
    const paymentColors = [
        "#8B68D9",
        "#A88BEA",
        "#C2AEF5",
        "#DED3FA",
    ];

    const radialData = paymentBreakdown.map((payment, index) => ({
        ...payment,
        name: formatLabel(payment.payment_gateway),
        fill: paymentColors[index % paymentColors.length],
    }));

    // -------------------------------------------------
    // LOADING STATE
    // -------------------------------------------------

    if (isLoading && !report) {
        return <SalesReportSkeleton />;
    }

    // -------------------------------------------------
    // ERROR STATE
    // -------------------------------------------------

    if (!report) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center bg-white p-4">
                <div className="w-full max-w-md rounded-[20px] border border-[#D5E2FF] bg-white p-8 text-center shadow-lg">
                    <FiAlertCircle
                        size={30}
                        className="mx-auto text-[#4F7FE8]"
                    />

                    <h2 className="mt-4 text-lg font-bold text-[#172033]">
                        Unable to load sales report
                    </h2>

                    <p className="mt-2 text-sm leading-5 text-[#6B7280]">
                        {errorMessage || "Please try again."}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            void fetchReport(fromDate, toDate)
                        }
                        className="mt-5 rounded-xl bg-[#4F7FE8] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#315FCA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7FE8] focus-visible:ring-offset-2"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const maxProductRevenue = Math.max(
        1,
        ...report.top_products.map((product) =>
            Number(product.total_revenue || 0)
        )
    );

    const maxDistributorRevenue = Math.max(
        1,
        ...report.top_distributors.map((distributor) =>
            Number(distributor.total_revenue || 0)
        )
    );

    // -------------------------------------------------
    // MAIN UI
    // -------------------------------------------------

    return (
        <div className="min-h-screen bg-white">
            <motion.div
                key={`${appliedFromDate}-${appliedToDate}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="min-h-screen bg-[radial-gradient(900px_420px_at_100%_-5%,rgba(250,204,21,0.08),transparent),radial-gradient(900px_480px_at_-5%_0%,rgba(79,127,232,0.07),transparent)] p-3 sm:p-4 lg:p-6"
            >
                {/* =========================================
                    HEADER
                ========================================= */}

                <motion.header
                    variants={itemVariants}
                    className="mb-6 flex flex-col justify-between gap-4 border-b pb-5 xl:flex-row xl:items-center"
                    style={{ borderColor: BORDER }}
                >
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#4F7FE8]" />
                            <span className="h-2 w-2 rounded-full bg-[#FACC15]" />
                            <span className="h-2 w-2 rounded-full bg-[#72C6A1]" />

                            <span className="ml-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#647084]">
                                Reports & Analytics
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-[22px] font-semibold tracking-[-0.035em] text-[#172033] sm:text-[24px]">
                                Sales Report
                            </h1>

                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F1DEAC] bg-[#FFF6DF] px-3 py-1 text-[11px] font-bold text-[#95651D]">
                                <span className="h-2 w-2 rounded-full bg-[#EAB308]" />
                                Live data
                            </span>
                        </div>

                        <p className="mt-0.5 max-w-2xl text-[13px] leading-5 text-[#647084]">
                            Track revenue, orders, product performance,
                            distributors and payments.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            disabled={isRefreshing || isLoading}
                            onClick={handleRefresh}
                            className="flex h-11 items-center gap-2 rounded-xl border border-[#D5E2FF] bg-[#F7F9FF] px-4 text-[12px] font-bold text-[#426CD0] shadow-sm transition hover:bg-[#ECF1FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7FE8] disabled:opacity-50"
                        >
                            <motion.span
                                animate={{
                                    rotate: isRefreshing ? 360 : 0,
                                }}
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
                            className="flex h-11 items-center gap-2 rounded-xl border border-[#F1DCA5] bg-gradient-to-br from-[#FFF3D2] to-[#FFE5A5] px-5 text-[12px] font-bold text-[#78520B] transition hover:border-[#EBCB79] hover:from-[#FFEDBF] hover:to-[#FFDEA0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D5A83D] disabled:opacity-50"
                        >
                            <FiDownload size={15} />
                            {isExporting ? "Exporting..." : "Export CSV"}
                        </button>
                    </div>
                </motion.header>

                {/* =========================================
                    DATE FILTERS — LIGHT BLUE
                ========================================= */}

                <motion.section
                    variants={itemVariants}
                    className="mb-6 overflow-hidden rounded-[20px] border bg-white shadow-[0_4px_22px_rgba(79,127,232,0.06)]"
                    style={{ borderColor: PANEL_TONES.blue.border }}
                >
                    <div
                        className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                        style={{
                            borderColor: PANEL_TONES.blue.border,
                            background: PANEL_TONES.blue.header,
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E1EAFE] text-[#426CD0] ring-1 ring-[#D3DFFF]">
                                <FiCalendar size={17} />
                            </div>

                            <div>
                                <h2 className="text-[15px] font-bold text-[#172033]">
                                    Filter sales report
                                </h2>

                                <p className="mt-0.5 text-[12px] text-[#647084]">
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
                                    onClick={() =>
                                        applyPreset(
                                            preset.key as "7d" | "30d" | "month"
                                        )
                                    }
                                    className="rounded-full border border-[#D5E2FF] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#426CD0] transition hover:border-[#B9CCFF] hover:bg-[#EAF0FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7FE8] disabled:opacity-50"
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
                                    onChange={(event) =>
                                        setFromDate(event.target.value)
                                    }
                                    className="h-11 w-full rounded-xl border border-[#D9E3F7] bg-[#F8FAFF] px-3 text-[13px] text-[#172033] outline-none transition focus:border-[#7C9AE8] focus:ring-2 focus:ring-[#7C9AE8]/20"
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
                                    onChange={(event) =>
                                        setToDate(event.target.value)
                                    }
                                    className="h-11 w-full rounded-xl border border-[#D9E3F7] bg-[#F8FAFF] px-3 text-[13px] text-[#172033] outline-none transition focus:border-[#7C9AE8] focus:ring-2 focus:ring-[#7C9AE8]/20"
                                />
                            </div>

                            <button
                                type="button"
                                disabled={isLoading || isRefreshing}
                                onClick={handleApplyFilters}
                                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4F7FE8] px-7 text-[12px] font-bold text-white transition hover:bg-[#315FCA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7FE8] focus-visible:ring-offset-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <FiRefreshCw
                                        className="animate-spin"
                                        size={14}
                                    />
                                ) : (
                                    <FiActivity size={14} />
                                )}

                                Apply filters
                            </button>
                        </div>

                        <p className="mt-3 text-[12px] text-[#647084]">
                            Report period:{" "}
                            <span className="rounded-md bg-[#EAF0FF] px-2 py-0.5 font-semibold text-[#315FCA]">
                                {report.from_date} to {report.to_date}
                            </span>
                        </p>
                    </div>
                </motion.section>

                {/* =========================================
                    SUMMARY CARDS
                ========================================= */}

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

                {/* =========================================
                    SALES ANALYTICS — LIGHT BLUE
                ========================================= */}

                <motion.div
                    variants={containerVariants}
                    className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3"
                >
                    <Panel
                        title="Sales analytics"
                        subtitle="Revenue, order count and daily performance"
                        icon={FiActivity}
                        tone="blue"
                        className="xl:col-span-2"
                    >
                        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-[#4F7FE8]" />
                                <span className="text-[12px] font-medium text-[#374151]">
                                    Revenue
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-[#F0BD55]" />
                                <span className="text-[12px] font-medium text-[#374151]">
                                    Orders
                                </span>
                            </div>
                        </div>

                        <div className="h-[320px] w-full rounded-2xl border border-[#DCE6FF] bg-[#F7F9FF] p-2">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <AreaChart
                                        data={chartData}
                                        margin={{
                                            top: 12,
                                            right: 6,
                                            left: -12,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="salesRevenueGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor={BLUE}
                                                    stopOpacity={0.32}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor={BLUE}
                                                    stopOpacity={0.02}
                                                />
                                            </linearGradient>

                                            <linearGradient
                                                id="salesOrdersGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#F0BD55"
                                                    stopOpacity={0.28}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="#F0BD55"
                                                    stopOpacity={0.02}
                                                />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            stroke="#DCE6FF"
                                            strokeDasharray="4 4"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="label"
                                            tick={{
                                                fontSize: 12,
                                                fill: "#647084",
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={8}
                                        />

                                        <YAxis
                                            yAxisId="revenue"
                                            tick={{
                                                fontSize: 11,
                                                fill: "#647084",
                                            }}
                                            tickFormatter={(value: number) =>
                                                value >= 1000
                                                    ? `₹${(
                                                          value / 1000
                                                      ).toFixed(1)}k`
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
                                            tick={{
                                                fontSize: 11,
                                                fill: "#647084",
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={32}
                                        />

                                        <Tooltip
                                            formatter={(
                                                value: any,
                                                name: any
                                            ) => [
                                                name === "Orders"
                                                    ? formatNumber(value)
                                                    : formatCurrency(value),
                                                name,
                                            ]}
                                            contentStyle={{
                                                border: "1px solid #D5E2FF",
                                                borderRadius: 12,
                                                fontSize: 12,
                                                backgroundColor: "#FFFFFF",
                                                boxShadow:
                                                    "0 8px 25px rgba(79,127,232,0.10)",
                                            }}
                                            labelStyle={{
                                                fontWeight: 700,
                                                color: "#172033",
                                            }}
                                        />

                                        <Legend
                                            wrapperStyle={{
                                                fontSize: 12,
                                                paddingTop: 8,
                                            }}
                                        />

                                        <Area
                                            yAxisId="revenue"
                                            dataKey="revenue"
                                            name="Revenue"
                                            type="monotone"
                                            stroke={BLUE}
                                            strokeWidth={3}
                                            fill="url(#salesRevenueGradient)"
                                            dot={{
                                                r: 4,
                                                fill: BLUE,
                                                stroke: "#FFFFFF",
                                                strokeWidth: 2,
                                            }}
                                            activeDot={{
                                                r: 6,
                                                fill: BLUE_DARK,
                                            }}
                                        />

                                        <Area
                                            yAxisId="orders"
                                            dataKey="orders"
                                            name="Orders"
                                            type="monotone"
                                            stroke="#D9A53F"
                                            strokeWidth={2.5}
                                            fill="url(#salesOrdersGradient)"
                                            dot={{
                                                r: 4,
                                                fill: "#F0BD55",
                                                stroke: "#FFFFFF",
                                                strokeWidth: 2,
                                            }}
                                            activeDot={{
                                                r: 6,
                                                fill: "#C18A24",
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center rounded-xl text-[13px] text-[#647084]">
                                    No sales chart data available.
                                </div>
                            )}
                        </div>
                    </Panel>

                    {/* =====================================
                        PAYMENT BREAKDOWN — LAVENDER
                    ===================================== */}

                    <Panel
                        title="Payment breakdown"
                        subtitle="Revenue by payment gateway"
                        icon={FiCreditCard}
                        tone="purple"
                    >
                        {paymentBreakdown.length > 0 ? (
                            <>
                                <div className="relative h-[260px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
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
                                                background={{
                                                    fill: "#EDE7FA",
                                                }}
                                                cornerRadius={10}
                                            />

                                            <Tooltip
                                                formatter={(
                                                    value: any,
                                                    name: any
                                                ) => [
                                                    formatCurrency(value),
                                                    name,
                                                ]}
                                                contentStyle={{
                                                    border: "1px solid #E1D7FF",
                                                    borderRadius: 10,
                                                    fontSize: 12,
                                                    backgroundColor: "#FFFFFF",
                                                }}
                                            />
                                        </RadialBarChart>
                                    </ResponsiveContainer>

                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-[11px] font-semibold text-[#75688D]">
                                            Total
                                        </span>

                                        <span className="mt-0.5 text-[18px] font-extrabold text-[#352B4A]">
                                            {formatCurrency(paymentTotal)}
                                        </span>

                                        <span className="text-[11px] text-[#827695]">
                                            Payments
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className="mt-3 space-y-4 border-t pt-4"
                                    style={{
                                        borderColor:
                                            PANEL_TONES.purple.border,
                                    }}
                                >
                                    {paymentBreakdown.map(
                                        (payment, index) => {
                                            const percentage =
                                                paymentTotal > 0
                                                    ? (Number(
                                                          payment.amount || 0
                                                      ) /
                                                          paymentTotal) *
                                                      100
                                                    : 0;

                                            const color =
                                                paymentColors[
                                                    index %
                                                        paymentColors.length
                                                ];

                                            return (
                                                <div
                                                    key={`${payment.payment_gateway}-${index}`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <span
                                                                className="h-3 w-3 shrink-0 rounded-full"
                                                                style={{
                                                                    background:
                                                                        color,
                                                                }}
                                                            />

                                                            <span className="truncate text-[13px] font-semibold text-[#352B4A]">
                                                                {formatLabel(
                                                                    payment.payment_gateway
                                                                )}
                                                            </span>
                                                        </div>

                                                        <span className="text-[13px] font-bold text-[#352B4A]">
                                                            {formatCurrency(
                                                                payment.amount
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEE9F8]">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-300"
                                                            style={{
                                                                width: `${percentage}%`,
                                                                background:
                                                                    color,
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[#827695]">
                                                        <span>
                                                            {percentage.toFixed(
                                                                1
                                                            )}
                                                            % of total
                                                        </span>

                                                        <span>
                                                            {formatNumber(
                                                                payment.count
                                                            )}{" "}
                                                            transactions
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </>
                        ) : (
                            <EmptyState
                                title="No payment data"
                                hint="Payments will appear here for this period."
                                tone="purple"
                            />
                        )}
                    </Panel>
                </motion.div>

                {/* =========================================
                    TOP PRODUCTS + DISTRIBUTORS
                ========================================= */}

                <motion.div
                    variants={containerVariants}
                    className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2"
                >
                    {/* =====================================
                        TOP PRODUCTS — LIGHT GREEN
                    ===================================== */}

                    <Panel
                        title="Top selling products"
                        subtitle="Products ranked by sales performance"
                        icon={FiPackage}
                        tone="green"
                        badge={
                            <CountBadge
                                count={report.top_products.length}
                                label="products"
                                tone="green"
                            />
                        }
                    >
                        {report.top_products.length > 0 ? (
                            <div className="space-y-3">
                                {report.top_products.map(
                                    (product, index) => {
                                        const pct = Math.round(
                                            (Number(
                                                product.total_revenue || 0
                                            ) /
                                                maxProductRevenue) *
                                                100
                                        );

                                        return (
                                            <div
                                                key={product.product_id}
                                                className="rounded-2xl border bg-white p-3.5 transition hover:shadow-[0_6px_18px_rgba(55,168,117,0.08)]"
                                                style={{
                                                    borderColor:
                                                        PANEL_TONES.green
                                                            .rowBorder,
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${rankStyle(
                                                            index
                                                        )}`}
                                                    >
                                                        {index + 1}
                                                    </span>

                                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-[#F7FCF8]"
                                                        style={{
                                                            borderColor:
                                                                PANEL_TONES
                                                                    .green
                                                                    .rowBorder,
                                                        }}
                                                    >
                                                        {product.image ? (
                                                            <img
                                                                src={
                                                                    product.image
                                                                }
                                                                alt={
                                                                    product.name
                                                                }
                                                                className="h-full w-full object-contain p-1"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <FiPackage
                                                                className="text-[#6B9280]"
                                                                size={22}
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-[14px] font-semibold text-[#21392C]">
                                                            {product.name}
                                                        </p>

                                                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                            <span className="rounded-md bg-[#EFF8F1] px-1.5 py-0.5 text-[11px] font-medium text-[#477256]">
                                                                {product.product_code ||
                                                                    "N/A"}
                                                            </span>

                                                            <span className="text-[12px] text-[#718477]">
                                                                {formatNumber(
                                                                    product.total_qty
                                                                )}{" "}
                                                                sold
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        ) : (
                            <EmptyState
                                title="No product data"
                                hint="Top products will show up once orders come in."
                                tone="green"
                            />
                        )}
                    </Panel>

                    {/* =====================================
                        TOP DISTRIBUTORS — LIGHT AMBER
                    ===================================== */}

                    <Panel
                        title="Top distributors"
                        subtitle="Distributors ranked by order revenue"
                        icon={FiUsers}
                        tone="amber"
                        badge={
                            <CountBadge
                                count={report.top_distributors.length}
                                label="distributors"
                                tone="amber"
                            />
                        }
                    >
                        {report.top_distributors.length > 0 ? (
                            <div className="space-y-3">
                                {report.top_distributors.map(
                                    (distributor, index) => {
                                        const pct = Math.round(
                                            (Number(
                                                distributor.total_revenue || 0
                                            ) /
                                                maxDistributorRevenue) *
                                                100
                                        );

                                        return (
                                            <div
                                                key={distributor.user_id}
                                                className="rounded-2xl border bg-white p-3.5 transition hover:shadow-[0_6px_18px_rgba(217,154,67,0.09)]"
                                                style={{
                                                    borderColor:
                                                        PANEL_TONES.amber
                                                            .rowBorder,
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#F0D8B3] bg-gradient-to-br from-[#FFF0D5] to-[#F8DDAA] text-[15px] font-extrabold text-[#93601E]">
                                                        {String(
                                                            distributor.name ||
                                                                "?"
                                                        )
                                                            .trim()
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-[14px] font-bold text-[#493723]">
                                                            {distributor.name}
                                                        </p>

                                                        <p className="mt-0.5 truncate text-[12px] text-[#8B7966]">
                                                            {distributor.email}
                                                        </p>

                                                        <span className="mt-1 inline-flex rounded-full border border-[#F2DFBF] bg-[#FFF5E5] px-2 py-0.5 text-[11px] font-semibold text-[#95651D]">
                                                            {formatNumber(
                                                                distributor.total_orders
                                                            )}{" "}
                                                            orders
                                                        </span>
                                                    </div>

                                                    <div className="shrink-0 text-right">
                                                        <p className="text-[14px] font-extrabold text-[#B7792D]">
                                                            {formatCurrency(
                                                                distributor.total_revenue
                                                            )}
                                                        </p>

                                                        <p className="mt-0.5 text-[11px] text-[#8B7966]">
                                                            Revenue
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        ) : (
                            <EmptyState
                                title="No distributor data"
                                hint="Top distributors will show up once orders come in."
                                tone="amber"
                            />
                        )}
                    </Panel>
                </motion.div>

                {/* =========================================
                    FOOTER
                ========================================= */}

                <div
                    className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4"
                    style={{ borderColor: BORDER }}
                >
                    <p className="text-[12px] text-[#647084]">
                        Sales report · {report.from_date} to {report.to_date}
                    </p>

                    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#388D69]">
                        <FiCheckCircle size={13} />
                        Data loaded successfully
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default SalesReport;