import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  ComposedChart,
  Bar,
  Line,
  LineChart,
} from "recharts";

import {
  FaRupeeSign,
  FaShoppingCart,
  FaUsers,
  FaTruck,
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
} from "react-icons/fa";

import {
  FiActivity,
  FiTrendingUp,
  FiAlertCircle,
  FiMoreHorizontal,
  FiClock,
  FiRefreshCw,
  FiDownload,
  FiCheckCircle,
  FiPackage,
  FiUsers as FiUsersIcon,
  FiChevronRight,
} from "react-icons/fi";

import adminDashboardApi, {
  DashboardData,
  DailyBreakdown,
  WeeklyBreakdown,
} from "../../api/endpoints/adminDashboard";
import { Link, useNavigate } from "react-router-dom";

// =====================================================
// BRAND (matches MainLayout.tsx)
// =====================================================

// Palette used for chart series / mini sparklines / pie slices
const CHART_GREEN = "#163F20";
const CHART_GREEN_SOFT = "#4C8A57";
const CHART_GREEN_DARK = "#0F3219";
const CHART_AMBER = "#D9A900";
const CHART_RED = "#D1453B";
const CHART_BLUE = "#3B6FD1";

const containerVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
      when: "beforeChildren",
    },
  },

  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.02,
      when: "afterChildren",
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 14,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
    },
  },

  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

// =====================================================
// TYPES
// =====================================================

type SalesPeriodType = "this_week" | "last_week" | "this_month";

interface SalesChartItem {
  name: string;
  value: number;
  lineValue: number;
  isCurrent: boolean;
  orders: number;
  date: string;
}

interface InventoryAlertItem {
  id?: number;
  name?: string;
  product_name?: string;
  stock?: number | string;
  current_stock?: number | string;
  quantity?: number | string;
  status?: string;
}

// =====================================================
// ICON MAP
// =====================================================

const iconMap: Record<string, React.ElementType> = {
  attach_money: FaRupeeSign,
  shopping_cart: FaShoppingCart,
  groups: FaUsers,
  local_shipping: FaTruck,
  account_balance_wallet: FaWallet,
};

const trendIconMap: Record<string, React.ElementType> = {
  trending_up: FaArrowUp,
  trending_down: FaArrowDown,
  trending_flat: FaMinus,
};

// Each KPI card gets a soft icon-tile color + a sparkline color,
// matching the tinted squares in the screenshot (green / amber / blue / red).
const metricTheme: Record<
  string,
  { tile: string; iconColor: string; spark: string }
> = {
  attach_money: {
    tile: "bg-[#EAF3EA]",
    iconColor: "text-[#163F20]",
    spark: CHART_GREEN,
  },
  shopping_cart: {
    tile: "bg-[#FBF3DC]",
    iconColor: "text-[#8A6D16]",
    spark: CHART_AMBER,
  },
  groups: {
    tile: "bg-[#E9EEFB]",
    iconColor: "text-[#3B57A6]",
    spark: CHART_BLUE,
  },
  local_shipping: {
    tile: "bg-[#EAF3EA]",
    iconColor: "text-[#163F20]",
    spark: CHART_GREEN_SOFT,
  },
  account_balance_wallet: {
    tile: "bg-[#FBEAEA]",
    iconColor: "text-[#B23A32]",
    spark: CHART_RED,
  },
};

// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (value: string | number | null | undefined) => {
  const numericValue = Number(value || 0);

  return `₹${numericValue.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const formatNumber = (value: string | number | null | undefined) => {
  return Number(value || 0).toLocaleString("en-IN");
};

const getPercentageData = (
  value: number,
  positiveLabel = "Up",
): {
  change: string;
  toneClass: string;
  trendIcon: string;
  note: string;
} => {
  if (value > 0) {
    return {
      change: `${value.toFixed(2)}%`,
      toneClass: "text-[#1F7A3D]",
      trendIcon: "trending_up",
      note: positiveLabel,
    };
  }

  if (value < 0) {
    return {
      change: `${Math.abs(value).toFixed(2)}%`,
      toneClass: "text-[#C23B32]",
      trendIcon: "trending_down",
      note: "vs previous period",
    };
  }

  return {
    change: "0%",
    toneClass: "text-[#8C917F]",
    trendIcon: "trending_flat",
    note: "No change",
  };
};

const getRelativeTime = (date: string | null | undefined) => {
  if (!date) return "Not submitted";

  const created = new Date(date).getTime();

  if (Number.isNaN(created)) {
    return date;
  }

  const diff = Date.now() - created;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInventoryName = (item: InventoryAlertItem) => {
  return (
    item.name ||
    item.product_name ||
    `Product ${item.id ?? ""}`.trim() ||
    "Unknown Product"
  );
};

// A tiny deterministic "sparkline shape" seeded off the metric's own
// value, so each card's squiggle looks distinct but stays stable
// between renders (no fake random re-shuffling on refresh).
const buildSparklineData = (seed: number, trendUp: boolean) => {
  const points = 8;
  const data: { i: number; v: number }[] = [];
  let v = 50;

  for (let i = 0; i < points; i++) {
    const wiggle = Math.sin(seed + i * 1.35) * 14;
    const drift = trendUp ? i * 2.2 : -i * 1.4;
    v = 50 + wiggle + drift;
    data.push({ i, v });
  }

  return data;
};

// =====================================================
// ICON HELPERS
// =====================================================

const MetricIcon = ({
  name,
  className = "",
}: {
  name?: string;
  className?: string;
}) => {
  const IconComponent = iconMap[name || ""] || FaRupeeSign;

  return <IconComponent className={className} />;
};

const TrendIcon = ({
  name,
  className = "",
}: {
  name?: string;
  className?: string;
}) => {
  const IconComponent = trendIconMap[name || ""] || FaMinus;

  return <IconComponent className={className} />;
};

// =====================================================
// MINI SPARKLINE (replaces the gold glass circle decoration)
// =====================================================

const MiniSparkline = ({
  color = CHART_GREEN,
  seed = 0,
  trendUp = true,
}: {
  color?: string;
  seed?: number;
  trendUp?: boolean;
}) => {
  const data = useMemo(
    () => buildSparklineData(seed, trendUp),
    [seed, trendUp],
  );

  return (
    <div className="pointer-events-none h-8 w-[72px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// =====================================================
// SECTION HEADER
// =====================================================

const SectionHeader = ({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) => (
  <div className="mb-5 flex items-start justify-between gap-4">
    <div className="flex min-w-0 items-center gap-3">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#EAF3EA] text-[#163F20] ring-1 ring-[#163F20]/10">
          {icon}
        </div>
      )}

      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-bold text-[#202721] sm:text-[16px]">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-0.5 truncate text-[10px] leading-5 text-[#89918B] sm:text-[11px]">
            {subtitle}
          </p>
        )}
      </div>
    </div>

    {action}
  </div>
);

// =====================================================
// SALES LINE DOT
// =====================================================

const SalesLineDot = (props: any) => {
  const { cx, cy } = props;

  if (cx === undefined || cy === undefined) {
    return null;
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={9} fill={CHART_GREEN} opacity={0.08} />

      <circle
        cx={cx}
        cy={cy}
        r={5.5}
        fill="#ffffff"
        stroke={CHART_GREEN}
        strokeWidth={2}
      />

      <circle cx={cx} cy={cy} r={2.6} fill={CHART_GREEN_DARK} />
    </g>
  );
};

// =====================================================
// DASHBOARD
// =====================================================

const Dashboard = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriodType>("this_week");

  const navigate = useNavigate();

  // ✅ Updated to send user_name instead of id
  const handleReview = (review: any) => {
    navigate("/UserManagement", {
      state: {
        kycUserName: review.user_name, // Send name instead of ID
      },
    });
  };

  const fetchDashboard = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await adminDashboardApi.getDashboard();

      if (response.data.success && response.data.data) {
        setDashboard(response.data.data);
        setLastUpdated(new Date());
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setIsLoading(false);

      if (showRefreshing) {
        setTimeout(() => {
          setIsRefreshing(false);
        }, 700);
      }
    }
  }, []);

  // ===================================================
  // INITIAL API CALL
  // ===================================================

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;

    fetchDashboard(true);
  }, [fetchDashboard, isRefreshing]);

  // ===================================================
  // DASHBOARD METRICS
  // ===================================================

  const metrics = useMemo(() => {
    if (!dashboard) return [];

    const weekChange =
      dashboard.sales_analysis?.percentage_change?.week_over_week ?? 0;

    const weekTrend = getPercentageData(weekChange);

    return [
      {
        label: "Total Revenue",
        value: formatCurrency(dashboard.total_revenue),
        icon: "attach_money",
        change: weekTrend.change,
        trendIcon: weekTrend.trendIcon,
        toneClass: weekTrend.toneClass,
        note: "vs last week",
      },
      {
        label: "Total Orders",
        value: formatNumber(dashboard.total_orders),
        icon: "shopping_cart",
        change: `${formatNumber(
          dashboard.sales_analysis?.this_week?.summary?.orders ?? 0,
        )}`,
        trendIcon: "trending_up",
        toneClass: "text-[#1F7A3D]",
        note: "this week",
      },
      {
        label: "Customers",
        value: formatNumber(dashboard.total_customers),
        icon: "groups",
        change: "Registered",
        trendIcon: "trending_flat",
        toneClass: "text-[#8C917F]",
        note: "customers",
      },
      {
        label: "Distributors",
        value: formatNumber(dashboard.total_distributors),
        icon: "local_shipping",
        change: "Active",
        trendIcon: "trending_flat",
        toneClass: "text-[#8C917F]",
        note: "distributors",
      },
      {
        label: "Products",
        value: formatNumber(dashboard.total_products),
        icon: "account_balance_wallet",
        change: `${dashboard.stock_status?.summary?.in_stock_count ?? 0}`,
        trendIcon: "trending_up",
        toneClass: "text-[#1F7A3D]",
        note: "in stock",
      },
    ];
  }, [dashboard]);

  // ===================================================
  // SALES DATA
  // ===================================================

  const selectedSalesData = useMemo(() => {
    if (!dashboard) return [];

    const salesAnalysis = dashboard.sales_analysis;

    if (salesPeriod === "this_month") {
      return salesAnalysis.this_month?.weekly_breakdown || [];
    }

    if (salesPeriod === "last_week") {
      return salesAnalysis.last_week?.daily_breakdown || [];
    }

    return salesAnalysis.this_week?.daily_breakdown || [];
  }, [dashboard, salesPeriod]);

  const barData: SalesChartItem[] = useMemo(() => {
    return selectedSalesData.map(
      (item: DailyBreakdown | WeeklyBreakdown, index: number) => {
        const isWeekly = "week_number" in item;

        const revenue = Number(item.revenue || 0);
        const orders = Number(item.orders || 0);

        return {
          name: isWeekly
            ? `Week ${item.week_number}`
            : item.day.substring(0, 3),
          value: revenue,
          lineValue: revenue,
          isCurrent:
            salesPeriod === "this_week"
              ? index === new Date().getDay() - 1
              : false,
          orders,
          date: `${item.start_date}${
            item.end_date && item.end_date !== item.start_date
              ? ` - ${item.end_date}`
              : ""
          }`,
        };
      },
    );
  }, [selectedSalesData, salesPeriod]);

  // ===================================================
  // SALES SUMMARY
  // ===================================================

  const currentSalesSummary = useMemo(() => {
    if (!dashboard) {
      return {
        revenue: 0,
        orders: 0,
        startDate: "",
        endDate: "",
      };
    }

    const summary = dashboard.sales_analysis?.[salesPeriod]?.summary;

    return {
      revenue: Number(summary?.revenue || 0),
      orders: Number(summary?.orders || 0),
      startDate: summary?.start_date || "",
      endDate: summary?.end_date || "",
    };
  }, [dashboard, salesPeriod]);

  // ===================================================
  // TOP CATEGORIES
  // ===================================================

  const pieData = useMemo(() => {
    if (!dashboard) return [];

    return dashboard.top_categories.slice(0, 3).map((category) => ({
      name: category.name,
      value: Number(category.product_count || 0),
      maxPrice: Number(category.max_price || 0),
    }));
  }, [dashboard]);

  const pieTotal = useMemo(() => {
    return pieData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  }, [pieData]);

  // ===================================================
  // KYC
  // ===================================================

  const kycReviews = dashboard?.pending_kyc_reviews || [];
  const totalPending = kycReviews.length;

  // ===================================================
  // INVENTORY
  // ===================================================

  const lowStockProducts = (dashboard?.stock_status?.low_stock_products ||
    []) as InventoryAlertItem[];

  const outOfStockProducts = (dashboard?.stock_status?.out_of_stock_products ||
    []) as InventoryAlertItem[];

  const inventoryAlerts = useMemo(() => {
    return [
      ...lowStockProducts.map((item) => ({
        ...item,
        alertType: "Low Stock",
        toneClass: "text-[#B8850E]",
      })),
      ...outOfStockProducts.map((item) => ({
        ...item,
        alertType: "Out of Stock",
        toneClass: "text-[#C23B32]",
      })),
    ];
  }, [lowStockProducts, outOfStockProducts]);

  const totalAlerts =
    (dashboard?.stock_status?.summary?.low_stock_count || 0) +
    (dashboard?.stock_status?.summary?.out_of_stock_count || 0);

  // ===================================================
  // SUPPORT CONTACTS
  // ===================================================

  const tickets = dashboard?.top_contacts || [];
  const totalTickets = tickets.length;

  // ===================================================
  // EXPORT
  // ===================================================

  const handleExport = useCallback(() => {
    if (isExporting || !dashboard) return;

    setIsExporting(true);

    const rows = [
      ["Metric", "Value"],
      ["Total Revenue", dashboard.total_revenue],
      ["Total Orders", dashboard.total_orders],
      ["Total Customers", dashboard.total_customers],
      ["Total Distributors", dashboard.total_distributors],
      ["Total Products", dashboard.total_products],
      ["This Week Revenue", dashboard.sales_analysis.this_week.summary.revenue],
      ["This Week Orders", dashboard.sales_analysis.this_week.summary.orders],
      ["Last Week Revenue", dashboard.sales_analysis.last_week.summary.revenue],
      ["Last Week Orders", dashboard.sales_analysis.last_week.summary.orders],
      [
        "Week over Week",
        `${dashboard.sales_analysis.percentage_change.week_over_week}%`,
      ],
      [
        "Month over Month",
        `${dashboard.sales_analysis.percentage_change.month_over_month}%`,
      ],
      ["Pending KYC", dashboard.pending_kyc_reviews.length],
      ["Low Stock", dashboard.stock_status.summary.low_stock_count],
      ["Out of Stock", dashboard.stock_status.summary.out_of_stock_count],
      ["In Stock", dashboard.stock_status.summary.in_stock_count],
      ["Support Contacts", dashboard.top_contacts.length],
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `dashboard-export-${Date.now()}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setTimeout(() => {
      setIsExporting(false);
    }, 700);
  }, [dashboard, isExporting]);

  // ===================================================
  // METRIC SUBTEXT
  // ===================================================

  const metricSubText = [
    "Total business revenue",
    "Total orders placed",
    "Registered customers",
    "Registered distributors",
    "Available products",
  ];

  // ===================================================
  // LOADING
  // ===================================================

  if (isLoading && !dashboard) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#F5F7F5]">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              repeat: Infinity,
              duration: 1,
              ease: "linear",
            }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#163F20] text-white shadow-lg"
          >
            <FiRefreshCw size={22} />
          </motion.div>

          <div className="text-sm font-semibold text-[#69746C]">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#F5F7F5]">
        <div className="rounded-[20px] border border-[#E5EAE5] bg-white p-8 text-center shadow-xl">
          <FiAlertCircle size={28} className="mx-auto text-[#163F20]" />

          <h2 className="mt-3 text-lg font-bold text-[#202721]">
            Unable to load dashboard
          </h2>

          <button
            type="button"
            onClick={() => fetchDashboard()}
            className="mt-4 rounded-xl bg-[#163F20] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0F3219]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F7F9F6]">
      <motion.div
        className="min-h-screen p-3 sm:p-4 lg:p-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={refreshKey}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="mb-5 border-b border-[#E3E8E2] pb-4 sm:pb-5"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />

                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#5F745F] sm:text-[10px]">
                  Business Overview
                </span>
              </div>

              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <h1 className="text-[24px] font-extrabold tracking-[-0.035em] text-[#202721] sm:text-[28px]">
                  Dashboard
                </h1>

                <span className="mb-1 hidden rounded-full border border-[#163F20]/15 bg-[#EAF3EA] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#163F20] sm:inline-flex">
                  Admin Overview
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#89918B] sm:text-xs">
                Monitor sales performance, customers, operations and important
                business activity from one place.
              </p>
            </div>

            <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
              {/* Live */}
              <div className="hidden items-center gap-2 rounded-xl border border-[#E5EAE5] bg-[#FAFBFA] px-3 py-2.5 sm:flex">
                <motion.span
                  className="h-2 w-2 rounded-full bg-[#163F20]"
                  animate={{
                    opacity: isRefreshing ? [1, 0.3, 1] : 1,
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />

                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wide text-[#59645C]">
                    Live Data
                  </div>

                  <div className="text-[8px] text-[#9AA29C]">
                    {lastUpdated
                      ? `Updated ${lastUpdated.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "Fetching data..."}
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="hidden items-center gap-2 rounded-xl border border-[#E5EAE5] bg-white px-3 py-2.5 md:flex">
                <motion.div
                  animate={
                    isRefreshing
                      ? {
                          rotate: 360,
                          scale: [1, 1.2, 1],
                        }
                      : {
                          rotate: 0,
                          scale: 1,
                        }
                  }
                  transition={
                    isRefreshing
                      ? {
                          rotate: {
                            repeat: Infinity,
                            duration: 2,
                            ease: "linear",
                          },
                          scale: {
                            repeat: Infinity,
                            duration: 1,
                            ease: "easeInOut",
                          },
                        }
                      : {
                          duration: 0.3,
                        }
                  }
                >
                  <FiTrendingUp size={14} className="text-[#163F20]" />
                </motion.div>

                <span className="text-[10px] font-semibold text-[#59645C]">
                  Performance
                </span>
              </div>

              {/* Refresh */}
              <motion.button
                type="button"
                onClick={handleRefresh}
                whileTap={{
                  scale: 0.95,
                }}
                disabled={isRefreshing}
                className="flex h-10 items-center gap-2 rounded-xl border border-[#E5EAE5] bg-white px-3.5 text-[10px] font-bold text-[#163F20] shadow-sm transition-all hover:border-[#163F20]/30 hover:bg-[#F3F7F3] disabled:opacity-60"
              >
                <motion.span
                  animate={
                    isRefreshing
                      ? {
                          rotate: 360,
                        }
                      : {
                          rotate: 0,
                        }
                  }
                  transition={
                    isRefreshing
                      ? {
                          repeat: Infinity,
                          duration: 0.75,
                          ease: "linear",
                        }
                      : {
                          duration: 0.2,
                        }
                  }
                  className="flex"
                >
                  <FiRefreshCw size={14} />
                </motion.span>

                <span className="hidden sm:inline">
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </span>
              </motion.button>

              {/* Export */}
              <motion.button
                type="button"
                onClick={handleExport}
                whileTap={{
                  scale: 0.95,
                }}
                disabled={isExporting}
                className="flex h-10 items-center gap-2 rounded-xl bg-[#163F20] px-4 text-[10px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(22,63,32,0.55)] transition-all hover:-translate-y-0.5 hover:bg-[#0F3219]"
              >
                <motion.div
                  animate={
                    isExporting
                      ? {
                          scale: [1, 1.2, 1],
                          opacity: [1, 0.5, 1],
                        }
                      : {
                          scale: 1,
                          opacity: 1,
                        }
                  }
                  transition={
                    isExporting
                      ? {
                          repeat: Infinity,
                          duration: 0.8,
                        }
                      : {}
                  }
                >
                  <FiDownload size={14} />
                </motion.div>

                <span>{isExporting ? "Exporting..." : "Export"}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* =================================================
            KPI CARDS
        ================================================= */}

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {metrics.map((metric: any, index: number) => {
            const theme = metricTheme[metric.icon] || metricTheme.attach_money;
            const trendUp = metric.trendIcon !== "trending_down";

            return (
              <motion.div
                key={metric.label}
                variants={itemVariants}
                whileHover={{
                  y: -3,
                  transition: {
                    duration: 0.18,
                  },
                }}
                className="group relative overflow-hidden rounded-[17px] border border-[#E5EAE5] bg-white px-4 py-4 shadow-[0_3px_14px_rgba(16,39,20,0.035)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#163F20]/15 hover:shadow-[0_10px_24px_rgba(16,39,20,0.07)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${theme.tile} ${theme.iconColor}`}
                  >
                    <MetricIcon
                      name={metric.icon}
                      className="h-[16px] w-[16px]"
                    />
                  </div>

                  <MiniSparkline
                    color={theme.spark}
                    seed={index * 1.7}
                    trendUp={trendUp}
                  />
                </div>

                <div className="mt-3">
                  <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#89918B]">
                    {metric.label}
                  </div>

                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 5,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.4,
                    }}
                    className="mt-1 truncate text-[24px] font-extrabold leading-none tracking-[-0.03em] text-[#202721]"
                  >
                    {metric.value}
                  </motion.div>
                </div>

                <div
                  className={`mt-2.5 flex items-center text-[10px] font-bold ${
                    metric.toneClass || "text-[#163F20]"
                  }`}
                >
                  <TrendIcon name={metric.trendIcon} className="h-2.5 w-2.5" />

                  <span className="ml-1.5">{metric.change}</span>

                  {metric.note && (
                    <span className="ml-1.5 truncate font-normal text-[#9AA29C]">
                      {metric.note}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* =================================================
            MAIN ANALYTICS
        ================================================= */}

        <motion.div
          variants={containerVariants}
          className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3"
        >
          {/* SALES */}

          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-[18px] border border-[#E5EAE5] bg-white p-4 shadow-[0_3px_16px_rgba(16,39,20,0.035)] sm:p-5 xl:col-span-2"
          >
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[16px] font-bold text-[#202721] sm:text-[17px]">
                    Sales Analytics
                  </h2>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3EA] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#163F20] ring-1 ring-[#163F20]/10">
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-[#163F20]"
                      animate={{
                        opacity: isRefreshing ? [1, 0.3, 1] : 1,
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                    />
                    Live
                  </span>
                </div>

                <p className="mt-1 text-[10px] text-[#89918B]">
                  {salesPeriod === "this_month"
                    ? "Weekly sales activity and monthly performance"
                    : "Daily sales activity and period performance"}
                </p>
              </div>

              <select
                value={salesPeriod}
                onChange={(e) =>
                  setSalesPeriod(e.target.value as SalesPeriodType)
                }
                className="h-9 cursor-pointer rounded-lg border border-[#E5EAE5] bg-[#FAFBFA] px-3 text-[10px] font-semibold text-[#59645C] outline-none transition focus:border-[#163F20]/30 focus:ring-2 focus:ring-[#163F20]/10"
              >
                <option value="this_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="this_month">This Month</option>
              </select>
            </div>

            {/* GRAPH */}

            <div className="mt-2 h-[300px] w-full overflow-hidden rounded-[15px] border border-[#E5EAE5] bg-[#FAFBFA]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={barData}
                  barCategoryGap="24%"
                  margin={{
                    top: 18,
                    right: 8,
                    left: -20,
                    bottom: 2,
                  }}
                >
                  <defs>
                    <linearGradient id="salesGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4C8A57" />
                      <stop offset="100%" stopColor="#163F20" />
                    </linearGradient>

                    <linearGradient id="salesToday" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8FC199" />
                      <stop offset="100%" stopColor="#0F3219" />
                    </linearGradient>

                    <linearGradient
                      id="salesLineGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#0F3219" />
                      <stop offset="45%" stopColor="#4C8A57" />
                      <stop offset="100%" stopColor="#0F3219" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={true}
                    horizontal={true}
                    stroke="#EDF1ED"
                    strokeWidth={1}
                    strokeDasharray="0"
                    opacity={0.9}
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#9AA29C"
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />

                  <YAxis
                    stroke="#9AA29C"
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                    tickFormatter={(value) =>
                      `₹${
                        Number(value) >= 1000
                          ? `${(Number(value) / 1000).toFixed(0)}k`
                          : value
                      }`
                    }
                  />

                  <Tooltip
                    cursor={{
                      fill: "rgba(22,63,32,0.05)",
                    }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(22,63,32,0.14)",
                      borderRadius: "12px",
                      fontSize: "10px",
                      boxShadow: "0 12px 30px rgba(16,39,20,0.09)",
                    }}
                    labelStyle={{
                      color: "#3F4A41",
                      fontWeight: 700,
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === "Orders") {
                        return [Number(value || 0), "Orders"];
                      }

                      return [formatCurrency(value), name];
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={7}
                    payload={[
                      {
                        value:
                          salesPeriod === "this_month"
                            ? "This month"
                            : salesPeriod === "last_week"
                              ? "Last week"
                              : "This week",
                        type: "circle",
                        color: CHART_GREEN,
                      },
                    ]}
                    wrapperStyle={{
                      fontSize: "9px",
                      color: "#59645C",
                      paddingBottom: "16px",
                    }}
                  />

                  <Bar
                    dataKey="value"
                    name="Revenue"
                    radius={[8, 8, 3, 3]}
                    barSize={30}
                  >
                    {barData.map((entry, index) => (
                      <Cell
                        key={`sales-${index}`}
                        fill={
                          entry.isCurrent
                            ? "url(#salesToday)"
                            : "url(#salesGold)"
                        }
                      />
                    ))}
                  </Bar>

                  <Line
                    type="monotone"
                    dataKey="lineValue"
                    name="Sales trend"
                    stroke="url(#salesLineGradient)"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={<SalesLineDot />}
                    activeDot={{
                      r: 7,
                      fill: "#ffffff",
                      stroke: CHART_GREEN_DARK,
                      strokeWidth: 2.5,
                    }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* GRAPH FOOTER */}

            <div className="mt-1 flex flex-wrap items-center gap-3 border-t border-[#E5EAE5] pt-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#163F20]" />

                <span className="text-[9px] text-[#89918B]">
                  Revenue: {formatCurrency(currentSalesSummary.revenue)}
                </span>
              </div>

              <div className="h-3 w-px bg-[#E5EAE5]" />

              <div className="flex items-center gap-1.5">
                <span className="h-px w-5 bg-[#163F20]" />

                <span className="text-[9px] text-[#89918B]">
                  Orders: {formatNumber(currentSalesSummary.orders)}
                </span>
              </div>

              <div className="h-3 w-px bg-[#E5EAE5]" />

              <div className="text-[9px] text-[#89918B]">
                Updated automatically
              </div>
            </div>
          </motion.div>

          {/* TOP CATEGORIES / PIE CHART */}

          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-[18px] border border-[#E5EAE5] bg-white p-4 shadow-[0_3px_16px_rgba(16,39,20,0.035)] sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-extrabold tracking-[-0.01em] text-[#202721] sm:text-[16px]">
                    Top Categories
                  </h3>

                  <span className="rounded-full bg-[#EAF3EA] px-2 py-1 text-[7px] font-bold uppercase tracking-[0.1em] text-[#163F20]">
                    Live
                  </span>
                </div>

                <p className="mt-1 text-[10px] leading-4 text-[#89918B]">
                  Product distribution by category
                </p>
              </div>

              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E5EAE5] bg-[#FAFBFA] text-[#59645C] transition hover:border-[#163F20]/20 hover:bg-[#F3F7F3] hover:text-[#163F20]"
              >
                <FiMoreHorizontal size={15} />
              </button>
            </div>

            <div className="relative mt-1 h-[255px] sm:h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="47%"
                    innerRadius={61}
                    outerRadius={91}
                    paddingAngle={3}
                    cornerRadius={5}
                    dataKey="value"
                    stroke="#FFFFFF"
                    strokeWidth={3}
                    isAnimationActive
                  >
                    {pieData.map((_item, index) => (
                      <Cell
                        key={`pie-${index}`}
                        fill={
                          [CHART_GREEN, CHART_GREEN_SOFT, "#9BC5A1"][index % 3]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #E2E8E1",
                      borderRadius: "12px",
                      fontSize: "10px",
                      boxShadow: "0 12px 30px rgba(16,39,20,0.10)",
                    }}
                    labelStyle={{
                      color: "#202721",
                      fontWeight: 700,
                    }}
                    formatter={(value: any) => [
                      `${Number(value || 0)} Products`,
                      "Count",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-2">
                <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#9AA29C]">
                  Total
                </span>

                <motion.span
                  animate={
                    isRefreshing ? { scale: [1, 1.05, 1] } : { scale: 1 }
                  }
                  transition={
                    isRefreshing ? { duration: 0.6, ease: "easeInOut" } : {}
                  }
                  className="mt-1 text-[25px] font-extrabold leading-none tracking-[-0.04em] text-[#202721]"
                >
                  {formatNumber(dashboard.total_products)}
                </motion.span>

                <span className="mt-1 text-[8px] font-medium text-[#9AA29C]">
                  Products
                </span>
              </div>
            </div>

            {/* Reference-style category legend */}
            <div className="space-y-2 border-t border-[#E8ECE7] pt-3">
              {pieData.map((item, index) => {
                const percentage =
                  pieTotal > 0
                    ? Math.round((Number(item.value || 0) / pieTotal) * 100)
                    : 0;

                const dotColor = [CHART_GREEN, CHART_GREEN_SOFT, "#9BC5A1"][
                  index % 3
                ];

                return (
                  <motion.div
                    key={`${item.name}-${index}`}
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: dotColor }}
                      />

                      <span className="truncate text-[10px] font-semibold text-[#4D574F]">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[10px] font-bold text-[#202721]">
                        {formatNumber(item.value)}
                      </span>

                      <span className="min-w-[34px] text-right text-[9px] font-medium text-[#9AA29C]">
                        {percentage}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {pieData.length === 0 && (
                <div className="rounded-xl bg-[#FAFBFA] p-4 text-center text-[10px] text-[#89918B]">
                  No category data available.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* =================================================
            LOWER CONTENT
        ================================================= */}

        <motion.div
          variants={containerVariants}
          className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3"
        >
          {/* KYC + INVENTORY */}

          <motion.div
            variants={itemVariants}
            className="space-y-5 xl:col-span-2"
          >
            {/* KYC */}

            <div className="relative overflow-hidden rounded-[18px] border border-[#E5EAE5] bg-white p-4 shadow-[0_3px_16px_rgba(16,39,20,0.035)] sm:p-5">
              <SectionHeader
                icon={<FiCheckCircle size={17} />}
                title="Pending KYC Reviews"
                subtitle="Applications waiting for review"
                action={
                  <motion.span
                    animate={
                      isRefreshing
                        ? {
                            scale: [1, 1.1, 1],
                          }
                        : {
                            scale: 1,
                          }
                    }
                    transition={
                      isRefreshing
                        ? {
                            duration: 0.4,
                            ease: "easeInOut",
                          }
                        : {}
                    }
                    className="shrink-0 rounded-full border border-[#163F20]/15 bg-[#EAF3EA] px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-wide text-[#163F20]"
                  >
                    {totalPending} Pending
                  </motion.span>
                }
              />

              <div className="space-y-2">
                {kycReviews.slice(0, 4).map((review, idx) => (
                  <motion.div
                    key={review.id}
                    whileHover={{
                      x: 3,
                    }}
                    animate={
                      isRefreshing
                        ? {
                            opacity: [1, 0.6, 1],
                            x: [0, 2, 0],
                          }
                        : {
                            opacity: 1,
                            x: 0,
                          }
                    }
                    transition={
                      isRefreshing
                        ? {
                            duration: 0.4,
                            delay: idx * 0.06,
                          }
                        : {}
                    }
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#E5EAE5] bg-[#FAFBFA] px-3 py-2.5 transition hover:border-[#163F20]/20 hover:bg-white"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF3EA] text-[10px] font-extrabold text-[#163F20]">
                        {String(review.user_name || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-bold text-[#202721] sm:text-xs">
                          {review.user_name}
                        </div>

                        <div className="mt-0.5 flex items-center gap-1 text-[8px] text-[#9AA29C] sm:text-[9px]">
                          <FiClock size={9} />
                          {getRelativeTime(review.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* ✅ Updated onClick to pass entire review object */}
                    <button
                      type="button"
                      onClick={() => handleReview(review)}
                      className="shrink-0 rounded-lg border border-[#163F20]/20 bg-white px-3 py-1.5 text-[9px] font-bold text-[#163F20] transition hover:bg-[#163F20] hover:text-white"
                    >
                      Review
                    </button>
                  </motion.div>
                ))}

                {kycReviews.length === 0 && (
                  <div className="rounded-xl bg-[#FAFBFA] p-5 text-center text-[10px] text-[#89918B]">
                    No pending KYC reviews.
                  </div>
                )}
              </div>
            </div>

            {/* INVENTORY */}

            <div className="relative overflow-hidden rounded-[18px] border border-[#E5EAE5] bg-white p-4 shadow-[0_3px_16px_rgba(16,39,20,0.035)] sm:p-5">
              <SectionHeader
                icon={<FiPackage size={17} />}
                title="Inventory Alerts"
                subtitle="Products requiring attention"
                action={
                  <motion.span
                    animate={
                      isRefreshing
                        ? {
                            scale: [1, 1.1, 1],
                          }
                        : {
                            scale: 1,
                          }
                    }
                    transition={
                      isRefreshing
                        ? {
                            duration: 0.4,
                            ease: "easeInOut",
                          }
                        : {}
                    }
                    className="rounded-full bg-[#FBEAEA] px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-wide text-[#C23B32]"
                  >
                    {totalAlerts} Alerts
                  </motion.span>
                }
              />

              <div className="divide-y divide-[#E5EAE5]">
                {inventoryAlerts.slice(0, 5).map((item: any, idx: number) => {
                  return (
                    <motion.div
                      key={`${getInventoryName(item)}-${idx}`}
                      whileHover={{
                        x: 3,
                      }}
                      animate={
                        isRefreshing
                          ? {
                              opacity: [1, 0.6, 1],
                              x: [0, 2, 0],
                            }
                          : {
                              opacity: 1,
                              x: 0,
                            }
                      }
                      transition={
                        isRefreshing
                          ? {
                              duration: 0.4,
                              delay: idx * 0.05,
                            }
                          : {}
                      }
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FBEAEA] text-[#C23B32]">
                          <FiAlertCircle size={15} />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-[11px] font-semibold text-[#202721]">
                            {getInventoryName(item)}
                          </div>

                          <div className="mt-0.5 text-[8px] text-[#9AA29C]">
                            {item.stock_quantity || "Stock level"}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full bg-[#FAFBFA] px-2.5 py-1 text-[9px] font-bold ${
                          item.toneClass || "text-[#163F20]"
                        }`}
                      >
                        {item.stock_quantity || "Stock level"}
                      </span>
                    </motion.div>
                  );
                })}

                {inventoryAlerts.length === 0 && (
                  <div className="rounded-xl bg-[#FAFBFA] p-5 text-center text-[10px] text-[#89918B]">
                    No inventory alerts.
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* SUPPORT */}

          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-[18px] border border-[#E5EAE5] bg-white p-4 shadow-[0_3px_16px_rgba(16,39,20,0.035)] sm:p-5"
          >
            <SectionHeader
              icon={<FiActivity size={17} />}
              title="Support Tickets"
              subtitle="Latest customer support activity"
              action={
                <motion.span
                  animate={
                    isRefreshing
                      ? {
                          scale: [1, 1.1, 1],
                        }
                      : {
                          scale: 1,
                        }
                  }
                  transition={
                    isRefreshing
                      ? {
                          duration: 0.4,
                          ease: "easeInOut",
                        }
                      : {}
                  }
                  className="rounded-full bg-[#F3F7F3] px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-wide text-[#163F20]"
                >
                  {totalTickets} Open
                </motion.span>
              }
            />

            <div className="space-y-2">
              {tickets.slice(0, 5).map((ticket, idx) => {
                const status = ticket.is_read ? "Read" : "Unread";

                const badgeClass = ticket.is_read
                  ? "bg-[#F0F2F0] text-[#89918B]"
                  : "bg-[#FBF3DC] text-[#8A6D16]";

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{
                      opacity: 0,
                      y: 6,
                    }}
                    animate={{
                      opacity: isRefreshing ? 0.8 : 1,
                      y: isRefreshing ? 2 : 0,
                    }}
                    transition={{
                      delay: idx * 0.045,
                      duration: isRefreshing ? 0.3 : 0.4,
                    }}
                    whileHover={{
                      x: 3,
                    }}
                    className="rounded-xl border border-[#E5EAE5] bg-[#FAFBFA] p-3 transition hover:border-[#163F20]/20 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[10px] font-bold text-[#202721] sm:text-[11px]">
                          {ticket.name}
                        </div>

                        <div className="mt-1 truncate text-[8px] text-[#9AA29C] sm:text-[9px]">
                          {ticket.message}
                        </div>
                      </div>

                      <span className="shrink-0 text-[8px] text-[#9AA29C]">
                        {getRelativeTime(ticket.created_at)}
                      </span>
                    </div>

                    <div className="mt-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[7px] font-bold uppercase tracking-[0.12em] ${badgeClass}`}
                      >
                        {status}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {tickets.length === 0 && (
                <div className="rounded-xl bg-[#FAFBFA] p-5 text-center text-[10px] text-[#89918B]">
                  No support tickets found.
                </div>
              )}
            </div>

            <Link to="/contact">
              <button
                type="button"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#163F20]/20 bg-[#F3F7F3] py-2.5 text-[9px] font-bold uppercase tracking-wide text-[#163F20] transition hover:border-[#163F20]/30 hover:bg-[#EAF3EA]"
              >
                View All Tickets
                <FiChevronRight size={11} />
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* =================================================
            BOTTOM SUMMARY
        ================================================= */}

        <motion.div
          variants={containerVariants}
          className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {[
            {
              title: "KYC Queue",
              value: totalPending,
              subtitle: "Applications pending",
              icon: FiUsersIcon,
            },
            {
              title: "Inventory",
              value: totalAlerts,
              subtitle: "Items need attention",
              icon: FiPackage,
            },
            {
              title: "Support",
              value: totalTickets,
              subtitle: "Latest tickets",
              icon: FiActivity,
            },
          ].map((item, idx) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                variants={itemVariants}
                whileHover={{
                  y: -2,
                }}
                animate={
                  isRefreshing
                    ? {
                        opacity: [1, 0.5, 1],
                      }
                    : {
                        opacity: 1,
                      }
                }
                transition={
                  isRefreshing
                    ? {
                        duration: 0.4,
                        delay: idx * 0.08,
                      }
                    : {}
                }
                className="flex items-center justify-between rounded-[16px] border border-[#E5EAE5] bg-white px-4 py-3 shadow-[0_4px_14px_rgba(16,39,20,0.03)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3F7F3] text-[#163F20]">
                    <Icon size={15} />
                  </div>

                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-[#59645C]">
                      {item.title}
                    </div>

                    <div className="mt-0.5 text-[8px] text-[#9AA29C]">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <motion.div
                  animate={
                    isRefreshing
                      ? {
                          scale: [1, 1.15, 1],
                        }
                      : {
                          scale: 1,
                        }
                  }
                  transition={
                    isRefreshing
                      ? {
                          duration: 0.4,
                          delay: idx * 0.08,
                        }
                      : {}
                  }
                  className="text-lg font-extrabold tracking-tight text-[#202721]"
                >
                  {item.value}
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="h-3" />
      </motion.div>
    </div>
  );
};

export default Dashboard;
