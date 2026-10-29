import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
    LineChart,
    Line,
} from "recharts";
import {
    FiActivity,
    FiAlertCircle,
    FiCalendar,
    FiCheckCircle,
    FiCreditCard,
    FiDownload,
    FiInbox,
    FiPackage,
    FiRefreshCw,
    FiShoppingCart,
    FiTruck,
    FiTrendingUp,
    FiUsers,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import salesReportApi, {
    type SalesCategorySeries,
    type SalesChartItem,
    type SalesReportData,
    type SalesReportPeriod,
    type SalesStatusItem,
} from "../../api/endpoints/salesReportApi";

const BLUE = "#4F7FE8";
const BLUE_DARK = "#315FCA";
const YELLOW = "#FACC15";
const BORDER = "#E2E8F0";

const PERIOD_OPTIONS: { value: SalesReportPeriod; label: string }[] = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "six_months", label: "Last 6 months" },
    { value: "yearly", label: "Yearly" },
];

const CATEGORY_COLORS = [
    "#4F7FE8",
    "#37A875",
    "#8B68D9",
    "#D99A43",
    "#E879A9",
    "#20A4A8",
    "#E07055",
    "#667085",
];

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
        header: "linear-gradient(110deg, #EAF1FF 0%, #F4F7FF 52%, #FFFFFF 100%)",
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
        header: "linear-gradient(110deg, #F0EBFF 0%, #F8F5FF 52%, #FFFFFF 100%)",
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
        header: "linear-gradient(110deg, #E9F8EE 0%, #F4FCF6 52%, #FFFFFF 100%)",
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
        header: "linear-gradient(110deg, #FFF2DF 0%, #FFFAF2 52%, #FFFFFF 100%)",
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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const localDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getPeriodDateRange = (
    period: SalesReportPeriod,
    baseDate = new Date(),
): { from: string; to: string } => {
    const end = new Date(baseDate);
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);

    switch (period) {
        case "weekly":
            start.setDate(start.getDate() - 6);
            break;
        case "monthly":
            start.setDate(1);
            break;
        case "six_months":
            start.setDate(1);
            start.setMonth(start.getMonth() - 5);
            break;
        case "yearly":
            start.setMonth(0, 1);
            break;
    }

    return { from: localDate(start), to: localDate(end) };
};

const formatCurrency = (value: number | string | null | undefined): string =>
    `₹${Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatNumber = (value: number | string | null | undefined): string =>
    Number(value ?? 0).toLocaleString("en-IN");

const formatLabel = (value: string): string =>
    String(value || "Unknown")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());

const formatDateLabel = (dateString: string): string => {
    const date = new Date(`${dateString}T00:00:00`);
    return Number.isNaN(date.getTime())
        ? dateString
        : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const formatMonthLabel = (monthString: string): string => {
    const date = new Date(`${monthString}-01T00:00:00`);
    return Number.isNaN(date.getTime())
        ? monthString
        : date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

const sortSalesChartData = (items: SalesChartItem[], period: SalesReportPeriod): SalesChartItem[] => {
    if (period !== "weekly") return items;
    const weekdayOrder: Record<string, number> = {
        mon: 0, monday: 0,
        tue: 1, tues: 1, tuesday: 1,
        wed: 2, wednesday: 2,
        thu: 3, thur: 3, thurs: 3, thursday: 3,
        fri: 4, friday: 4,
        sat: 5, saturday: 5,
        sun: 6, sunday: 6,
    };
    if (!items.every((item) => weekdayOrder[String(item.label || "").trim().toLowerCase()] !== undefined)) {
        return items;
    }
    return [...items].sort((a, b) =>
        weekdayOrder[String(a.label).trim().toLowerCase()] -
        weekdayOrder[String(b.label).trim().toLowerCase()],
    );
};

const getFilteredDates = (weeks: SalesCategorySeries["weeks"], fromDate: string, toDate: string) =>
    Object.keys(weeks || {})
        .filter((date) => date >= fromDate && date <= toDate)
        .sort((a, b) => a.localeCompare(b));

const getCategoryTotal = (
    category: SalesCategorySeries,
    fromDate: string,
    toDate: string,
): number =>
    getFilteredDates(category.weeks, fromDate, toDate).reduce(
        (total, date) => total + Number(category.weeks[date] ?? 0),
        0,
    );

/** Sum a date-keyed totals map within the applied range. */
const sumTotalsMap = (
    map: Record<string, number> | undefined,
    fromDate: string,
    toDate: string,
): number => {
    if (!map) return 0;
    return Object.keys(map)
        .filter((date) => date >= fromDate && date <= toDate)
        .reduce((total, date) => total + Number(map[date] ?? 0), 0);
};

const buildCategoryChartData = (
    categories: SalesCategorySeries[],
    fromDate: string,
    toDate: string,
    period: SalesReportPeriod,
): { data: Record<string, string | number>[]; labels: string[] } => {
    const allDates = Array.from(
        new Set(
            categories.flatMap((category) =>
                getFilteredDates(category.weeks, fromDate, toDate),
            ),
        ),
    ).sort((a, b) => a.localeCompare(b));

    if (!categories.length || !allDates.length) return { data: [], labels: [] };

    const groupByMonth = period === "six_months" || period === "yearly";
    const buckets = new Map<string, string[]>();

    allDates.forEach((date) => {
        const bucket = groupByMonth ? date.slice(0, 7) : date;
        buckets.set(bucket, [...(buckets.get(bucket) || []), date]);
    });

    const labels = categories.map((category, index) =>
        category.category_title?.trim() || `Category ${index + 1}`,
    );

    const data = Array.from(buckets.entries()).map(([bucket, dates]) => {
        const row: Record<string, string | number> = {
            key: bucket,
            label: groupByMonth ? formatMonthLabel(bucket) : formatDateLabel(bucket),
        };

        categories.forEach((category, index) => {
            const categoryName = labels[index];
            row[categoryName] = dates.reduce(
                (sum, date) => sum + Number(category.weeks?.[date] ?? 0),
                0,
            );
        });

        return row;
    });

    return { data, labels };
};

const escapeCsv = (value: unknown): string => {
    let textValue = String(value ?? "");
    if (/^[=+@]/.test(textValue)) textValue = `'${textValue}`;
    return `"${textValue.replace(/"/g, '""')}"`;
};

const getWeekNumber = (d: Date): number => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const getSpreadsheetColumns = (fromDate: string, toDate: string, period: SalesReportPeriod) => {
    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T00:00:00`);
    const dates: Date[] = [];

    if (period === "yearly") {
        let current = new Date(start);
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 7);
        }
    } else if (period === "six_months") {
        let current = new Date(start);
        while (current <= end) {
            dates.push(new Date(current));
            current.setMonth(current.getMonth() + 1);
        }
    } else {
        let current = new Date(start);
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
    }

    return dates.map(d => {
        let label = "";
        if (period === "weekly") {
            label = d.toLocaleDateString("en-US", { weekday: "short" });
        } else if (period === "monthly") {
            label = d.getDate().toString();
        } else if (period === "six_months") {
            label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        } else {
            label = `W${getWeekNumber(d)}`;
        }

        const dateStr = localDate(d);
        return { label, dateStr };
    });
};

const getBucketSum = (category: SalesCategorySeries, dateStr: string, period: SalesReportPeriod) => {
    if (!category.weeks) return 0;

    if (period === "weekly" || period === "monthly") {
        return Number(category.weeks[dateStr] ?? 0);
    }

    const d = new Date(`${dateStr}T00:00:00`);
    const year = d.getFullYear();
    const month = d.getMonth();

    return Object.keys(category.weeks).reduce((sum, key) => {
        const recordDate = new Date(`${key}T00:00:00`);
        if (recordDate.getFullYear() === year) {
            if (period === "six_months") {
                if (recordDate.getMonth() === month) {
                    return sum + Number(category.weeks[key] ?? 0);
                }
            } else if (period === "yearly") {
                const weekNum = getWeekNumber(recordDate);
                const targetWeekNum = getWeekNumber(d);
                if (weekNum === targetWeekNum) {
                    return sum + Number(category.weeks[key] ?? 0);
                }
            }
        }
        return sum;
    }, 0);
};

/** Sum a date-keyed totals map into the same bucket the column represents. */
const getTotalsBucketSum = (
    map: Record<string, number> | undefined,
    dateStr: string,
    period: SalesReportPeriod,
): number => {
    if (!map) return 0;
    if (period === "weekly" || period === "monthly") {
        return Number(map[dateStr] ?? 0);
    }
    const d = new Date(`${dateStr}T00:00:00`);
    const year = d.getFullYear();
    const month = d.getMonth();
    return Object.keys(map).reduce((sum, key) => {
        const recordDate = new Date(`${key}T00:00:00`);
        if (recordDate.getFullYear() === year) {
            if (period === "six_months") {
                if (recordDate.getMonth() === month) {
                    return sum + Number(map[key] ?? 0);
                }
            } else if (period === "yearly") {
                if (getWeekNumber(recordDate) === getWeekNumber(d)) {
                    return sum + Number(map[key] ?? 0);
                }
            }
        }
        return sum;
    }, 0);
};

const exportToCsv = (
    report: SalesReportData,
    period: SalesReportPeriod,
    fromDate: string,
    toDate: string,
) => {
    const columns = getSpreadsheetColumns(fromDate, toDate, period);
    const periodLabel = period === "six_months" ? "Month" : period === "yearly" ? "Week" : "Week";

    const rows: (string | number)[][] = [];

    rows.push(["SALES REPORT EXPORT"]);
    rows.push([`Period: ${formatLabel(period)} | From: ${fromDate} | To: ${toDate}`]);
    rows.push([]);

    rows.push(["", ...columns.map(c => c.label)]);
    rows.push([periodLabel, ...columns.map(c => c.dateStr)]);
    rows.push([]);

    const buildCategorySection = (title: string, categories: SalesCategorySeries[], isCV: boolean = false) => {
        if (!categories || !categories.length) return;

        rows.push([`*** ${title.toUpperCase()} ***`]);

        categories.forEach(cat => {
            rows.push([
                cat.category_title || "Uncategorized",
                ...columns.map(col => getBucketSum(cat, col.dateStr, period))
            ]);
        });

        rows.push([
            `TOTAL ${title.split(" ")[0].toUpperCase()}`,
            ...columns.map(col => categories.reduce((sum, cat) => sum + getBucketSum(cat, col.dateStr, period), 0))
        ]);

        if (isCV && report.category_weekly_sales?.totals?.total_cv) {
            rows.push([
                "TOTAL CV",
                ...columns.map(col => report.category_weekly_sales?.totals?.total_cv?.[col.dateStr] || 0)
            ]);
        }

        rows.push([]);
    };

    const categoryData = report.category_weekly_sales;

    if (categoryData) {
        buildCategorySection("Sales By Category", categoryData.sales_by_category || []);
        buildCategorySection("Sales Return By Category", categoryData.returns_by_category || []);
        buildCategorySection("CV By Category", categoryData.cv_by_category || [], true);
    }

    // ---- TOTALS SECTION (total_sales / total_returns / total_cv / net_sales) ----
    const totals = categoryData?.totals;
    if (totals) {
        rows.push(["*** TOTALS ***"]);
        rows.push([
            "TOTAL SALES",
            ...columns.map(col => getTotalsBucketSum(totals.total_sales, col.dateStr, period)),
        ]);
        rows.push([
            "TOTAL RETURNS",
            ...columns.map(col => getTotalsBucketSum(totals.total_returns, col.dateStr, period)),
        ]);
        rows.push([
            "TOTAL CV",
            ...columns.map(col => getTotalsBucketSum(totals.total_cv, col.dateStr, period)),
        ]);
        rows.push([
            "NET SALES",
            ...columns.map(col => getTotalsBucketSum(totals.net_sales, col.dateStr, period)),
        ]);
        // Grand total row (single number per metric summed across all columns)
        rows.push([
            "GRAND TOTAL SALES",
            columns.reduce((s, c) => s + getTotalsBucketSum(totals.total_sales, c.dateStr, period), 0),
        ]);
        rows.push([
            "GRAND TOTAL RETURNS",
            columns.reduce((s, c) => s + getTotalsBucketSum(totals.total_returns, c.dateStr, period), 0),
        ]);
        rows.push([
            "GRAND TOTAL CV",
            columns.reduce((s, c) => s + getTotalsBucketSum(totals.total_cv, c.dateStr, period), 0),
        ]);
        rows.push([
            "GRAND NET SALES",
            columns.reduce((s, c) => s + getTotalsBucketSum(totals.net_sales, c.dateStr, period), 0),
        ]);
        rows.push([]);
    }

    if ((report as any).outstanding_shipment) {
        buildCategorySection("Outstanding Shipment", (report as any).outstanding_shipment || []);
    }

    const csvContent = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-matrix-${period}-${fromDate}-to-${toDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

const rankStyle = (index: number) => {
    if (index === 0) return "bg-gradient-to-br from-[#FDE68A] to-[#F5C451] text-[#78520B]";
    if (index === 1) return "bg-gradient-to-br from-[#E5E7EB] to-[#C4CBD5] text-[#374151]";
    if (index === 2) return "bg-gradient-to-br from-[#F5D0B0] to-[#E9A77B] text-[#754222]";
    return "bg-[#E1F5E8] text-[#23794F]";
};

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

const SkeletonBlock: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
    className = "",
    style,
}) => <div className={`animate-pulse rounded-md bg-[#E8EDF5] ${className}`} style={style} />;

const SkeletonCircle: React.FC<{ className?: string }> = ({ className = "" }) =>
    <div className={`animate-pulse rounded-full bg-[#E8EDF5] ${className}`} />;

const SalesReportSkeleton: React.FC = () => (
    <div className="min-h-screen bg-[radial-gradient(900px_420px_at_100%_-5%,rgba(250,204,21,0.08),transparent),radial-gradient(900px_480px_at_-5%_0%,rgba(79,127,232,0.08),transparent)] p-3 sm:p-4 lg:p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b pb-5 xl:flex-row xl:items-center" style={{ borderColor: BORDER }}>
            <div className="w-full max-w-xl">
                <div className="mb-2 flex items-center gap-2"><SkeletonCircle className="h-2 w-2" /><SkeletonCircle className="h-2 w-2" /><SkeletonCircle className="h-2 w-2" /><SkeletonBlock className="ml-1 h-3 w-32" /></div>
                <SkeletonBlock className="h-7 w-44" />
                <SkeletonBlock className="mt-3 h-3 w-full max-w-md" />
            </div>
            <div className="flex flex-wrap gap-2"><SkeletonBlock className="h-11 w-28 rounded-xl" /><SkeletonBlock className="h-11 w-32 rounded-xl" /></div>
        </div>
        <div className="mb-6 rounded-[20px] border bg-white p-4 sm:p-5" style={{ borderColor: PANEL_TONES.blue.border }}>
            <SkeletonBlock className="mb-4 h-5 w-48" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
                {["period", "from", "to", "apply"].map((item) => <SkeletonBlock key={item} className="h-11 w-full rounded-xl" />)}
            </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="rounded-[18px] border bg-white p-4" style={{ borderColor: index % 2 ? "#F2DFBF" : PANEL_TONES.blue.border }}><SkeletonBlock className="h-3 w-24" /><SkeletonBlock className="mt-3 h-6 w-28" /><SkeletonBlock className="mt-4 h-3 w-32" /></div>)}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="rounded-[20px] border bg-white p-5 xl:col-span-2" style={{ borderColor: PANEL_TONES.blue.border }}><SkeletonBlock className="h-5 w-40" /><SkeletonBlock className="mt-5 h-[320px] w-full rounded-2xl" /></div>
            <div className="rounded-[20px] border bg-white p-5" style={{ borderColor: PANEL_TONES.purple.border }}><SkeletonBlock className="h-5 w-40" /><SkeletonCircle className="mx-auto mt-8 h-44 w-44" /><SkeletonBlock className="mt-8 h-3 w-full" /><SkeletonBlock className="mt-4 h-3 w-4/5" /></div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">{[0, 1].map((index) => <div key={index} className="rounded-[20px] border bg-white p-5" style={{ borderColor: index ? PANEL_TONES.amber.border : PANEL_TONES.green.border }}><SkeletonBlock className="h-5 w-44" />{[0, 1, 2, 3].map((row) => <SkeletonBlock key={row} className="mt-3 h-16 w-full rounded-2xl" />)}</div>)}</div>
    </div>
);

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon: Icon, theme, index }) => {
    const isYellow = theme === "yellow";
    return (
        <motion.div variants={itemVariants} whileHover={{ y: -3 }} className="relative min-w-0 overflow-hidden rounded-[18px] border bg-white p-4 shadow-[0_4px_18px_rgba(45,70,110,0.05)] transition-shadow hover:shadow-[0_10px_24px_rgba(45,70,110,0.10)]" style={{ borderColor: isYellow ? "#F2DFBF" : PANEL_TONES.blue.border }}>
            <div className="absolute inset-y-0 left-0 w-1" style={{ background: isYellow ? YELLOW : BLUE }} />
            <div className="flex items-start justify-between gap-2 pl-1.5">
                <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-[#4B5563]">{title}</p><motion.p key={value} initial={{ opacity: 0.5, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }} className="mt-2 break-words text-[21px] font-bold leading-tight tracking-[-0.03em] text-[#172033] sm:text-[22px]">{value}</motion.p></div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isYellow ? "bg-[#FFF4D9] text-[#A86E14] ring-1 ring-[#F2D9A0]/80" : "bg-[#E8EFFF] text-[#426CD0] ring-1 ring-[#D2DEFF]"}`}><Icon size={19} /></div>
            </div>
            <p className="mt-3 truncate pl-1.5 text-[11px] text-[#6B7280]">{description}</p>
        </motion.div>
    );
};

const Panel: React.FC<PanelProps> = ({ title, subtitle, icon: Icon, children, className = "", badge, tone = "blue" }) => {
    const palette = PANEL_TONES[tone];
    return (
        <motion.section variants={itemVariants} className={`min-w-0 overflow-hidden rounded-[20px] border ${className}`} style={{ borderColor: palette.border, backgroundColor: palette.surface, boxShadow: `0 4px 20px ${palette.accent}0D` }}>
            <header className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5" style={{ borderBottomColor: palette.border, background: palette.header }}>
                <div className="flex min-w-0 items-center gap-3">
                    {Icon && <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: palette.icon, boxShadow: palette.iconShadow }}><Icon size={19} /></div>}
                    <div className="min-w-0"><h2 className="text-[16px] font-bold text-[#172033]">{title}</h2>{subtitle && <p className="mt-0.5 text-[12px] leading-4 text-[#647084]">{subtitle}</p>}</div>
                </div>
                {badge}
            </header>
            <div className="p-4 sm:p-5" style={{ backgroundColor: palette.surface }}>{children}</div>
        </motion.section>
    );
};

const CountBadge: React.FC<{ count: number; label: string; tone?: PanelTone }> = ({ count, label, tone = "green" }) => {
    const palette = PANEL_TONES[tone];
    return <div className="flex shrink-0 items-baseline gap-1.5 rounded-full px-3 py-1.5 ring-1" style={{ backgroundColor: palette.badgeBg, color: palette.badgeText, borderColor: palette.border, ["--tw-ring-color" as string]: palette.border }}><span className="text-[11px] font-semibold leading-none">{count}</span><span className="text-[11px] font-semibold">{label}</span></div>;
};

const EmptyState: React.FC<{ title: string; hint: string; tone?: PanelTone }> = ({ title, hint, tone = "blue" }) => {
    const palette = PANEL_TONES[tone];
    return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-10 text-center" style={{ borderColor: palette.border, backgroundColor: palette.surface }}><div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm" style={{ color: palette.icon, border: `1px solid ${palette.border}` }}><FiInbox size={20} /></div><p className="text-[13px] font-bold text-[#172033]">{title}</p><p className="mt-0.5 text-[12px] text-[#6B7280]">{hint}</p></div>;
};

const StatusList: React.FC<{ items: SalesStatusItem[]; labelKey: "delivery_status" | "return_status" | "cancel_state" }> = ({ items, labelKey }) => {
    if (!items.length) return <p className="rounded-xl bg-[#F7F9FF] p-4 text-center text-[12px] text-[#6B7280]">No status data available.</p>;
    return <div className="space-y-2">{items.map((item, index) => {
        const label = item[labelKey] || "Unknown";
        return <div key={`${label}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-3" style={{ borderColor: PANEL_TONES.blue.rowBorder, backgroundColor: PANEL_TONES.blue.rowBg }}><div className="min-w-0"><p className="truncate text-[13px] font-bold text-[#172033]">{formatLabel(label)}</p><p className="mt-1 text-[11px] text-[#6B7280]">{formatNumber(item.line_count)} lines · {formatNumber(item.total_qty)} items</p></div><div className="shrink-0 text-right"><p className="text-[13px] font-bold text-[#172033]">{formatCurrency(item.total_amount)}</p><p className="mt-1 text-[11px] text-[#6B7280]">Total amount</p></div></div>;
    })}</div>;
};

/** Four metric cards for category_weekly_sales.totals */
const TotalsSummary: React.FC<{
    totalSales: number;
    totalReturns: number;
    totalCv: number;
    netSales: number;
}> = ({ totalSales, totalReturns, totalCv, netSales }) => {
    const cards: { label: string; value: string; hint: string; accent: string; bg: string; border: string }[] = [
        { label: "Total sales", value: formatCurrency(totalSales), hint: "Gross category sales", accent: "#4F7FE8", bg: "#F5F9FF", border: "#D5E2FF" },
        { label: "Total returns", value: formatCurrency(totalReturns), hint: "Returned sales value", accent: "#8B68D9", bg: "#FAF7FF", border: "#E1D7FF" },
        { label: "Total CV", value: formatCurrency(totalCv), hint: "Commissionable volume", accent: "#D99A43", bg: "#FFFBF3", border: "#F2DFBF" },
        { label: "Net sales", value: formatCurrency(netSales), hint: "Sales minus returns", accent: "#37A875", bg: "#F6FCF8", border: "#CDEBD8" },
    ];
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
                <div key={card.label} className="relative overflow-hidden rounded-[16px] border bg-white p-4" style={{ borderColor: card.border, backgroundColor: card.bg }}>
                    <div className="absolute inset-y-0 left-0 w-1" style={{ background: card.accent }} />
                    <p className="pl-2 text-[12px] font-semibold text-[#4B5563]">{card.label}</p>
                    <p className="mt-1.5 pl-2 text-[20px] font-bold tracking-[-0.02em] text-[#172033]">{card.value}</p>
                    <p className="mt-1 pl-2 text-[11px] text-[#6B7280]">{card.hint}</p>
                </div>
            ))}
        </div>
    );
};

const SalesReport: React.FC = () => {
    const [period, setPeriod] = useState<SalesReportPeriod>("weekly");
    const [initialRange] = useState(() => getPeriodDateRange("weekly"));
    const [fromDate, setFromDate] = useState(initialRange.from);
    const [toDate, setToDate] = useState(initialRange.to);
    const [appliedPeriod, setAppliedPeriod] = useState<SalesReportPeriod>("weekly");
    const [appliedFromDate, setAppliedFromDate] = useState(initialRange.from);
    const [appliedToDate, setAppliedToDate] = useState(initialRange.to);
    const [report, setReport] = useState<SalesReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const fetchReport = useCallback(async (
        requestedPeriod: SalesReportPeriod,
        startDate: string,
        endDate: string,
        refreshing = false,
    ) => {
        if (refreshing) setIsRefreshing(true);
        else setIsLoading(true);
        setErrorMessage("");

        try {
            const response = await salesReportApi.getSalesReport({
                period: requestedPeriod,
                from_date: startDate,
                to_date: endDate,
            });

            if (!response.data?.status || !response.data?.data) {
                throw new Error(response.data?.message || "Unable to fetch sales report.");
            }

            setReport(response.data.data);
            setAppliedPeriod(requestedPeriod);
            setAppliedFromDate(startDate);
            setAppliedToDate(endDate);
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || "Failed to fetch sales report.";
            setErrorMessage(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void fetchReport(period, fromDate, toDate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePeriodChange = (nextPeriod: SalesReportPeriod) => {
        setPeriod(nextPeriod);
        const range = getPeriodDateRange(nextPeriod);
        setFromDate(range.from);
        setToDate(range.to);
    };

    const handleApplyFilters = () => {
        if (!fromDate || !toDate) {
            toast.error("Please select both dates.");
            return;
        }
        if (fromDate > toDate) {
            toast.error("From date cannot be after the To date.");
            return;
        }
        void fetchReport(period, fromDate, toDate);
    };

    const applyPeriodPreset = (nextPeriod: SalesReportPeriod) => {
        const range = getPeriodDateRange(nextPeriod);
        setPeriod(nextPeriod);
        setFromDate(range.from);
        setToDate(range.to);
        void fetchReport(nextPeriod, range.from, range.to);
    };

    const handleRefresh = () => {
        void fetchReport(appliedPeriod, appliedFromDate, appliedToDate, true);
    };

    const handleExport = () => {
        if (!report || isExporting) return;
        try {
            setIsExporting(true);
            exportToCsv(report, appliedPeriod, appliedFromDate, appliedToDate);
            toast.success("Sales report exported successfully in matrix format.");
        } catch (error) {
            console.error("Sales report export failed:", error);
            toast.error("Unable to export sales report.");
        } finally {
            setIsExporting(false);
        }
    };

    const summary = report?.summary;
    const chartData: SalesChartItem[] = useMemo(
        () => sortSalesChartData(report?.chart || [], appliedPeriod),
        [report?.chart, appliedPeriod],
    );
    const topProducts = report?.top_products || [];
    const topDistributors = report?.top_distributors || [];
    const paymentBreakdown = report?.payment_breakdown || [];
    const categoryData = report?.category_weekly_sales;
    const salesByCategory = categoryData?.sales_by_category || [];
    const returnsByCategory = categoryData?.returns_by_category || [];
    const cvByCategory = categoryData?.cv_by_category || [];
    const paymentTotal = paymentBreakdown.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const paymentColors = ["#8B68D9", "#A88BEA", "#C2AEF5", "#DED3FA"];
    const radialData = paymentBreakdown.map((payment, index) => ({ ...payment, name: formatLabel(payment.payment_gateway), fill: paymentColors[index % paymentColors.length] }));

    const categoryChart = useMemo(
        () => buildCategoryChartData(salesByCategory, appliedFromDate, appliedToDate, appliedPeriod),
        [salesByCategory, appliedFromDate, appliedToDate, appliedPeriod],
    );

    const categoryTotals = useMemo(
        () => salesByCategory.map((category) => ({
            name: category.category_title || "Uncategorized",
            amount: getCategoryTotal(category, appliedFromDate, appliedToDate),
        })).sort((a, b) => b.amount - a.amount),
        [salesByCategory, appliedFromDate, appliedToDate],
    );

    // Aggregated totals from category_weekly_sales.totals
    const totals = categoryData?.totals;
    const totalSalesSum = useMemo(
        () => sumTotalsMap(totals?.total_sales, appliedFromDate, appliedToDate),
        [totals?.total_sales, appliedFromDate, appliedToDate],
    );
    const totalReturnsSum = useMemo(
        () => sumTotalsMap(totals?.total_returns, appliedFromDate, appliedToDate),
        [totals?.total_returns, appliedFromDate, appliedToDate],
    );
    const totalCvSum = useMemo(
        () => sumTotalsMap(totals?.total_cv, appliedFromDate, appliedToDate),
        [totals?.total_cv, appliedFromDate, appliedToDate],
    );
    const netSalesSum = useMemo(
        () => sumTotalsMap(totals?.net_sales, appliedFromDate, appliedToDate),
        [totals?.net_sales, appliedFromDate, appliedToDate],
    );

    const maxCategoryTotal = Math.max(1, ...categoryTotals.map((item) => item.amount));
    const maxProductRevenue = Math.max(1, ...topProducts.map((product) => Number(product.total_revenue || 0)));
    const maxDistributorRevenue = Math.max(1, ...topDistributors.map((distributor) => Number(distributor.total_revenue || 0)));

    if (isLoading && !report) return <SalesReportSkeleton />;

    if (!report) {
        return <div className="flex min-h-[60vh] items-center justify-center bg-white p-4"><div className="w-full max-w-md rounded-[20px] border border-[#D5E2FF] bg-white p-8 text-center shadow-lg"><FiAlertCircle size={30} className="mx-auto text-[#4F7FE8]" /><h2 className="mt-4 text-lg font-bold text-[#172033]">Unable to load sales report</h2><p className="mt-2 text-sm leading-5 text-[#6B7280]">{errorMessage || "Please try again."}</p><button type="button" onClick={() => void fetchReport(period, fromDate, toDate)} className="mt-5 rounded-xl bg-[#4F7FE8] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#315FCA]">Try Again</button></div></div>;
    }

    return (
        <div className="min-h-screen bg-white">
            <motion.div key={`${appliedPeriod}-${appliedFromDate}-${appliedToDate}`} variants={containerVariants} initial="hidden" animate="visible" className="min-h-screen bg-[radial-gradient(900px_420px_at_100%_-5%,rgba(250,204,21,0.08),transparent),radial-gradient(900px_480px_at_-5%_0%,rgba(79,127,232,0.07),transparent)] p-3 sm:p-4 lg:p-6">
                {/* HEADER */}
                <motion.header variants={itemVariants} className="mb-6 flex flex-col justify-between gap-4 border-b pb-5 xl:flex-row xl:items-center" style={{ borderColor: BORDER }}>
                    <div>
                        <div className="mb-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#4F7FE8]" /><span className="h-2 w-2 rounded-full bg-[#FACC15]" /><span className="h-2 w-2 rounded-full bg-[#72C6A1]" /><span className="ml-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#647084]">Reports & Analytics</span></div>
                        <div className="flex flex-wrap items-center gap-3"><h1 className="text-[22px] font-semibold tracking-[-0.035em] text-[#172033] sm:text-[24px]">Sales Report</h1><span className="inline-flex items-center gap-1.5 rounded-full border border-[#F1DEAC] bg-[#FFF6DF] px-3 py-1 text-[11px] font-bold text-[#95651D]"><span className="h-2 w-2 rounded-full bg-[#EAB308]" />Live data</span></div>
                        <p className="mt-0.5 max-w-2xl text-[13px] leading-5 text-[#647084]">Track revenue, orders, category performance, distributors and payments.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" disabled={isRefreshing || isLoading} onClick={handleRefresh} className="flex h-11 items-center gap-2 rounded-xl border border-[#D5E2FF] bg-[#F7F9FF] px-4 text-[12px] font-bold text-[#426CD0] shadow-sm transition hover:bg-[#ECF1FF] disabled:opacity-50"><motion.span animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ repeat: isRefreshing ? Infinity : 0, duration: 0.8, ease: "linear" }} className="flex"><FiRefreshCw size={15} /></motion.span>{isRefreshing ? "Refreshing..." : "Refresh"}</button>
                        <button type="button" disabled={isExporting || isLoading} onClick={handleExport} className="flex h-11 items-center gap-2 rounded-xl border border-[#F1DCA5] bg-gradient-to-br from-[#FFF3D2] to-[#FFE5A5] px-5 text-[12px] font-bold text-[#78520B] transition hover:border-[#EBCB79] hover:from-[#FFEDBF] hover:to-[#FFDEA0] disabled:opacity-50"><FiDownload size={15} />{isExporting ? "Exporting..." : "Export CSV"}</button>
                    </div>
                </motion.header>

                {/* PERIOD + DATE FILTERS */}
                <motion.section variants={itemVariants} className="mb-6 overflow-hidden rounded-[20px] border bg-white shadow-[0_4px_22px_rgba(79,127,232,0.06)]" style={{ borderColor: PANEL_TONES.blue.border }}>
                    <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5" style={{ borderColor: PANEL_TONES.blue.border, background: PANEL_TONES.blue.header }}>
                        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E1EAFE] text-[#426CD0] ring-1 ring-[#D3DFFF]"><FiCalendar size={17} /></div><div><h2 className="text-[15px] font-bold text-[#172033]">Filter sales report</h2><p className="mt-0.5 text-[12px] text-[#647084]">Choose a reporting period or customize the date range.</p></div></div>
                        <div className="flex flex-wrap gap-2">{PERIOD_OPTIONS.map((option) => <button key={option.value} type="button" disabled={isLoading || isRefreshing} onClick={() => applyPeriodPreset(option.value)} className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition disabled:opacity-50 ${appliedPeriod === option.value ? "border-[#4F7FE8] bg-[#4F7FE8] text-white" : "border-[#D5E2FF] bg-white text-[#426CD0] hover:border-[#B9CCFF] hover:bg-[#EAF0FF]"}`}>{option.label}</button>)}</div>
                    </div>
                    <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-[0.9fr_1fr_1fr_auto]">
                            <div><label htmlFor="sales-period" className="mb-1.5 block text-[12px] font-semibold text-[#374151]">Report period</label><select id="sales-period" value={period} disabled={isLoading || isRefreshing} onChange={(event) => handlePeriodChange(event.target.value as SalesReportPeriod)} className="h-11 w-full rounded-xl border border-[#D9E3F7] bg-[#F8FAFF] px-3 text-[13px] text-[#172033] outline-none transition focus:border-[#7C9AE8] focus:ring-2 focus:ring-[#7C9AE8]/20"><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="six_months">Last 6 months</option><option value="yearly">Yearly</option></select></div>
                            <div><label htmlFor="sales-from-date" className="mb-1.5 block text-[12px] font-semibold text-[#374151]">From date</label><input id="sales-from-date" type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} disabled={isLoading || isRefreshing} className="h-11 w-full rounded-xl border border-[#D9E3F7] bg-[#F8FAFF] px-3 text-[13px] text-[#172033] outline-none transition focus:border-[#7C9AE8] focus:ring-2 focus:ring-[#7C9AE8]/20" /></div>
                            <div><label htmlFor="sales-to-date" className="mb-1.5 block text-[12px] font-semibold text-[#374151]">To date</label><input id="sales-to-date" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} min={fromDate || undefined} disabled={isLoading || isRefreshing} className="h-11 w-full rounded-xl border border-[#D9E3F7] bg-[#F8FAFF] px-3 text-[13px] text-[#172033] outline-none transition focus:border-[#7C9AE8] focus:ring-2 focus:ring-[#7C9AE8]/20" /></div>
                            <button type="button" disabled={isLoading || isRefreshing} onClick={handleApplyFilters} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4F7FE8] px-7 text-[12px] font-bold text-white transition hover:bg-[#315FCA] disabled:opacity-50">{isLoading ? <FiRefreshCw className="animate-spin" size={14} /> : <FiActivity size={14} />}{isLoading ? "Loading..." : "Apply filters"}</button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[#647084]"><span>Applied report:</span><span className="rounded-md bg-[#EAF0FF] px-2 py-0.5 font-semibold text-[#315FCA]">{formatLabel(appliedPeriod)}</span><span className="rounded-md bg-[#EAF0FF] px-2 py-0.5 font-semibold text-[#315FCA]">{appliedFromDate} to {appliedToDate}</span>{(fromDate !== appliedFromDate || toDate !== appliedToDate || period !== appliedPeriod) && <span className="font-semibold text-[#B7792D]">Filters changed — click Apply filters.</span>}</div>
                    </div>
                </motion.section>

                {/* SUMMARY CARDS */}
                <motion.div variants={containerVariants} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <StatCard title="Total revenue" value={formatCurrency(summary?.total_revenue)} description="Revenue for selected period" icon={FaRupeeSign} theme="blue" index={0} />
                    <StatCard title="Total orders" value={formatNumber(summary?.total_orders)} description="Orders in selected period" icon={FiShoppingCart} theme="yellow" index={1} />
                    <StatCard title="Items sold" value={formatNumber(summary?.total_items_sold)} description="Total quantity sold" icon={FiPackage} theme="blue" index={2} />
                    <StatCard title="GST collected" value={formatCurrency(summary?.total_gst_collected)} description="Total GST collected" icon={FaRupeeSign} theme="yellow" index={3} />
                    <StatCard title="Shipping charges" value={formatCurrency(summary?.total_shipping_charge)} description="Total shipping charges" icon={FiTruck} theme="blue" index={4} />
                    <StatCard title="Average order" value={formatCurrency(summary?.average_order_value)} description="Average order value" icon={FiTrendingUp} theme="yellow" index={5} />
                </motion.div>

                {/* SALES + PAYMENT CHARTS */}
                <motion.div variants={containerVariants} className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
                    <Panel title="Sales analytics" subtitle={`${formatLabel(appliedPeriod)} orders and revenue · ${appliedFromDate} to ${appliedToDate}`} icon={FiActivity} tone="blue" className="xl:col-span-2">
                        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#4F7FE8]" /><span className="text-[12px] font-medium text-[#374151]">Revenue</span></div><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#F0BD55]" /><span className="text-[12px] font-medium text-[#374151]">Orders</span></div></div>
                        <div className="h-[320px] w-full rounded-2xl border border-[#DCE6FF] bg-[#F7F9FF] p-2">
                            {chartData.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 6, left: -12, bottom: 0 }}>
                                <defs><linearGradient id="salesRevenueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BLUE} stopOpacity={0.32} /><stop offset="100%" stopColor={BLUE} stopOpacity={0.02} /></linearGradient><linearGradient id="salesOrdersGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F0BD55" stopOpacity={0.28} /><stop offset="100%" stopColor="#F0BD55" stopOpacity={0.02} /></linearGradient></defs>
                                <CartesianGrid stroke="#DCE6FF" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 12, fill: "#647084" }} axisLine={false} tickLine={false} dy={8} interval={chartData.length > 12 ? "preserveStartEnd" : 0} /><YAxis yAxisId="revenue" tick={{ fontSize: 11, fill: "#647084" }} tickFormatter={(value: number) => value >= 1000 ? `₹${(value / 1000).toFixed(1)}k` : `₹${value}`} axisLine={false} tickLine={false} width={54} /><YAxis yAxisId="orders" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: "#647084" }} axisLine={false} tickLine={false} width={32} />
                                <Tooltip formatter={(value: any, name: any) => [name === "Orders" ? formatNumber(value) : formatCurrency(value), name]} contentStyle={{ border: "1px solid #D5E2FF", borderRadius: 12, fontSize: 12, backgroundColor: "#FFFFFF", boxShadow: "0 8px 25px rgba(79,127,232,0.10)" }} labelStyle={{ fontWeight: 700, color: "#172033" }} /><Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                                <Area yAxisId="revenue" dataKey="revenue" name="Revenue" type="monotone" stroke={BLUE} strokeWidth={3} fill="url(#salesRevenueGradient)" dot={{ r: 3, fill: BLUE, stroke: "#FFFFFF", strokeWidth: 2 }} activeDot={{ r: 6, fill: BLUE_DARK }} /><Area yAxisId="orders" dataKey="orders" name="Orders" type="monotone" stroke="#D9A53F" strokeWidth={2.5} fill="url(#salesOrdersGradient)" dot={{ r: 3, fill: "#F0BD55", stroke: "#FFFFFF", strokeWidth: 2 }} activeDot={{ r: 6, fill: "#C18A24" }} />
                            </AreaChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center rounded-xl text-[13px] text-[#647084]">No sales chart data available for this filter.</div>}
                        </div>
                        <p className="mt-3 text-[11px] leading-4 text-[#7B8494]">The chart series and labels are taken from the API response for the applied period and date range.</p>
                    </Panel>

                    <Panel title="Payment breakdown" subtitle="Revenue by payment gateway" icon={FiCreditCard} tone="purple">
                        {paymentBreakdown.length ? <>
                            <div className="relative h-[260px]"><ResponsiveContainer width="100%" height="100%"><RadialBarChart cx="50%" cy="50%" innerRadius="45%" outerRadius="105%" barSize={26} data={radialData} startAngle={90} endAngle={-270}><RadialBar dataKey="amount" background={{ fill: "#EDE7FA" }} cornerRadius={10} /><Tooltip formatter={(value: any, name: any) => [formatCurrency(value), name]} contentStyle={{ border: "1px solid #E1D7FF", borderRadius: 10, fontSize: 12, backgroundColor: "#FFFFFF" }} /></RadialBarChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-[11px] font-semibold text-[#75688D]">Total</span><span className="mt-0.5 text-[18px] font-extrabold text-[#352B4A]">{formatCurrency(paymentTotal)}</span><span className="text-[11px] text-[#827695]">Payments</span></div></div>
                            <div className="mt-3 space-y-4 border-t pt-4" style={{ borderColor: PANEL_TONES.purple.border }}>{paymentBreakdown.map((payment, index) => { const percentage = paymentTotal > 0 ? (Number(payment.amount || 0) / paymentTotal) * 100 : 0; const color = paymentColors[index % paymentColors.length]; return <div key={`${payment.payment_gateway}-${index}`}><div className="flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} /><span className="truncate text-[13px] font-semibold text-[#352B4A]">{formatLabel(payment.payment_gateway)}</span></div><span className="text-[13px] font-bold text-[#352B4A]">{formatCurrency(payment.amount)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EEE9F8]"><div className="h-full rounded-full transition-all duration-300" style={{ width: `${percentage}%`, background: color }} /></div><div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[#827695]"><span>{percentage.toFixed(1)}% of total</span><span>{formatNumber(payment.count)} transactions</span></div></div>; })}</div>
                        </> : <EmptyState title="No payment data" hint="Payments will appear here for this period." tone="purple" />}
                    </Panel>
                </motion.div>

                {/* CATEGORY SALES CHART AND TOTALS */}
                <motion.div variants={containerVariants} className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
                    <Panel title="Sales by category" subtitle={`Category revenue matching ${appliedFromDate} to ${appliedToDate}`} icon={FiActivity} tone="green" className="xl:col-span-2" badge={<CountBadge count={salesByCategory.length} label="categories" tone="green" />}>
                        {categoryChart.data.length && categoryChart.labels.length ? <>
                            <div className="h-[320px] w-full rounded-2xl border border-[#D3ECDD] bg-[#F7FCF8] p-2"><ResponsiveContainer width="100%" height="100%"><LineChart data={categoryChart.data} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}><CartesianGrid stroke="#D3ECDD" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11, fill: "#647084" }} axisLine={false} tickLine={false} interval={categoryChart.data.length > 12 ? "preserveStartEnd" : 0} /><YAxis tick={{ fontSize: 11, fill: "#647084" }} tickFormatter={(value: number) => value >= 1000 ? `₹${(value / 1000).toFixed(1)}k` : `₹${value}`} axisLine={false} tickLine={false} width={58} /><Tooltip formatter={(value: any, name: any) => [formatCurrency(value), name]} contentStyle={{ border: "1px solid #CDEBD8", borderRadius: 12, fontSize: 12, backgroundColor: "#FFFFFF" }} /><Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />{categoryChart.labels.map((label, index) => <Line key={label} dataKey={label} name={label} type="monotone" stroke={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} connectNulls />)}</LineChart></ResponsiveContainer></div>
                            <p className="mt-3 text-[11px] leading-4 text-[#718477]">Weekly/monthly views use date-wise sales. Six-month and yearly views combine daily category values by month.</p>
                        </> : <EmptyState title="No category sales data" hint="The API did not return category sales for the selected dates." tone="green" />}
                    </Panel>

                    <Panel title="Category totals" subtitle="Sales value in the applied date range" icon={FiPackage} tone="green">
                        {categoryTotals.length ? <div className="space-y-4">{categoryTotals.map((category, index) => { const percentage = (category.amount / maxCategoryTotal) * 100; const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length]; return <div key={`${category.name}-${index}`}><div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate text-[12px] font-semibold text-[#21392C]">{category.name}</span><span className="shrink-0 text-[12px] font-bold text-[#21392C]">{formatCurrency(category.amount)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8F4EC]"><div className="h-full rounded-full" style={{ width: `${percentage}%`, background: color }} /></div></div>; })}</div> : <EmptyState title="No category totals" hint="Category amounts will appear once returned by the API." tone="green" />}
                    </Panel>
                </motion.div>

                {/* NEW: TOTALS SUMMARY (total_sales / total_returns / total_cv / net_sales) */}
                {totals && (
                    <motion.section variants={itemVariants} className="mt-6 overflow-hidden rounded-[20px] border bg-white" style={{ borderColor: PANEL_TONES.blue.border }}>
                        <header className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5" style={{ borderColor: PANEL_TONES.blue.border, background: PANEL_TONES.blue.header }}>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: PANEL_TONES.blue.icon, boxShadow: PANEL_TONES.blue.iconShadow }}>
                                    <FiTrendingUp size={19} />
                                </div>
                                <div>
                                    <h2 className="text-[16px] font-bold text-[#172033]">Category totals overview</h2>
                                    <p className="mt-0.5 text-[12px] text-[#647084]">
                                        Aggregated sales, returns, CV and net sales · {appliedFromDate} to {appliedToDate}
                                    </p>
                                </div>
                            </div>
                        </header>
                        <div className="p-4 sm:p-5">
                            <TotalsSummary
                                totalSales={totalSalesSum}
                                totalReturns={totalReturnsSum}
                                totalCv={totalCvSum}
                                netSales={netSalesSum}
                            />
                        </div>
                    </motion.section>
                )}

                {/* TOP PRODUCTS AND DISTRIBUTORS */}
                <motion.div variants={containerVariants} className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <Panel title="Top selling products" subtitle="Products ranked by sales performance" icon={FiPackage} tone="green" badge={<CountBadge count={topProducts.length} label="products" tone="green" />}>
                        {topProducts.length ? <div className="space-y-3">{topProducts.map((product, index) => { const pct = Math.round((Number(product.total_revenue || 0) / maxProductRevenue) * 100); return <div key={product.product_id} className="rounded-2xl border bg-white p-3.5 transition hover:shadow-[0_6px_18px_rgba(55,168,117,0.08)]" style={{ borderColor: PANEL_TONES.green.rowBorder }}><div className="flex items-center gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${rankStyle(index)}`}>{index + 1}</span><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-[#F7FCF8]" style={{ borderColor: PANEL_TONES.green.rowBorder }}>{product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-contain p-1" loading="lazy" /> : <FiPackage className="text-[#6B9280]" size={22} />}</div><div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold text-[#21392C]">{product.name}</p><div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"><span className="rounded-md bg-[#EFF8F1] px-1.5 py-0.5 text-[11px] font-medium text-[#477256]">{product.product_code || "N/A"}</span><span className="text-[12px] text-[#718477]">{formatNumber(product.total_qty)} sold</span></div>{product.total_revenue !== undefined && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E8F4EC]"><div className="h-full rounded-full bg-[#37A875]" style={{ width: `${pct}%` }} /></div>}</div><div className="shrink-0 text-right"><p className="text-[12px] font-bold text-[#23794F]">{product.total_revenue === undefined ? "—" : formatCurrency(product.total_revenue)}</p><p className="text-[10px] text-[#718477]">Revenue</p></div></div></div>; })}</div> : <EmptyState title="No product data" hint="Top products will show up once orders come in." tone="green" />}
                    </Panel>

                    <Panel title="Top distributors" subtitle="Distributors ranked by order revenue" icon={FiUsers} tone="amber" badge={<CountBadge count={topDistributors.length} label="distributors" tone="amber" />}>
                        {topDistributors.length ? <div className="space-y-3">{topDistributors.map((distributor, index) => { const pct = Math.round((Number(distributor.total_revenue || 0) / maxDistributorRevenue) * 100); return <div key={distributor.user_id} className="rounded-2xl border bg-white p-3.5 transition hover:shadow-[0_6px_18px_rgba(217,154,67,0.09)]" style={{ borderColor: PANEL_TONES.amber.rowBorder }}><div className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#F0D8B3] bg-gradient-to-br from-[#FFF0D5] to-[#F8DDAA] text-[15px] font-extrabold text-[#93601E]">{String(distributor.name || "?").trim().charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-[14px] font-bold text-[#493723]">{distributor.name}</p><p className="mt-0.5 truncate text-[12px] text-[#8B7966]">{distributor.email}</p><span className="mt-1 inline-flex rounded-full border border-[#F2DFBF] bg-[#FFF5E5] px-2 py-0.5 text-[11px] font-semibold text-[#95651D]">{formatNumber(distributor.total_orders)} orders</span></div><div className="shrink-0 text-right"><p className="text-[14px] font-extrabold text-[#B7792D]">{formatCurrency(distributor.total_revenue)}</p><p className="mt-0.5 text-[11px] text-[#8B7966]">Revenue</p><div className="mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-[#FFF0D5]"><div className="h-full rounded-full bg-[#D99A43]" style={{ width: `${pct}%` }} /></div></div></div></div>; })}</div> : <EmptyState title="No distributor data" hint="Top distributors will show up once orders come in." tone="amber" />}
                    </Panel>
                </motion.div>

                {/* OPTIONAL STATUS BREAKDOWN */}
                {report.order_status_breakdown && <motion.div variants={containerVariants} className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
                    <Panel title="Delivery status" subtitle="Orders grouped by delivery state" icon={FiTruck} tone="blue"><StatusList items={report.order_status_breakdown.by_delivery_status || []} labelKey="delivery_status" /></Panel>
                    <Panel title="Return status" subtitle="Orders grouped by return state" icon={FiRefreshCw} tone="purple"><StatusList items={report.order_status_breakdown.by_return_status || []} labelKey="return_status" /></Panel>
                    <Panel title="Cancellation status" subtitle="Orders grouped by cancellation state" icon={FiAlertCircle} tone="amber"><StatusList items={report.order_status_breakdown.by_cancellation || []} labelKey="cancel_state" /></Panel>
                </motion.div>}

                {/* RETURN / REFUND SUMMARY */}
                {report.return_refund_summary && <motion.div variants={containerVariants} className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Return requests", value: formatNumber(report.return_refund_summary.total_return_requests) },
                { label: "Approved returns", value: formatNumber(report.return_refund_summary.approved_returns) },
                { label: "Refund amount", value: formatCurrency(report.return_refund_summary.total_refund_amount) },
                { label: "CV reversed", value: formatNumber(report.return_refund_summary.total_cv_reversed) },
                ].map((item) => <div key={item.label} className="rounded-[16px] border bg-white p-4 shadow-sm" style={{ borderColor: PANEL_TONES.purple.border }}><p className="text-[12px] font-semibold text-[#647084]">{item.label}</p><p className="mt-2 text-xl font-bold text-[#172033]">{item.value}</p></div>)}</motion.div>}

                {/* FOOTER */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4" style={{ borderColor: BORDER }}><p className="text-[12px] text-[#647084]">Sales report · {appliedPeriod} · {appliedFromDate} to {appliedToDate}</p><p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#388D69]"><FiCheckCircle size={13} />Data loaded successfully</p></div>
            </motion.div>
        </div>
    );
};

export default SalesReport;