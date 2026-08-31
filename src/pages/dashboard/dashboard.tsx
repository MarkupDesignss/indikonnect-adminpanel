import React, { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FiArrowUpRight,
  FiMoreHorizontal,
  FiClock,
  FiRefreshCw,
  FiDownload,
  FiCheckCircle,
  FiPackage,
  FiUsers as FiUsersIcon,
  FiChevronRight,
} from "react-icons/fi";

import {
  getDashboardMetrics,
  getChartDays,
  getRecentOrders,
  getKycReviews,
  getInventoryAlerts,
  getTickets,
} from "../../services/dashboardService";

// =====================================================
// ANIMATION
// =====================================================

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
  const IconComponent =
    iconMap[name || ""] || FaRupeeSign;

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
// BACKGROUND
// =====================================================

const BackgroundGlow = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute -left-24 -top-28 h-[420px] w-[420px] rounded-full bg-[#e7cd8c] opacity-[0.24] blur-[115px]" />

    <div className="absolute -right-28 top-[18%] h-[420px] w-[420px] rounded-full bg-[#b8902e] opacity-[0.10] blur-[125px]" />

    <div className="absolute bottom-[-120px] left-[32%] h-[360px] w-[360px] rounded-full bg-[#8a6c1f] opacity-[0.08] blur-[125px]" />

    <svg
      className="absolute inset-0 h-full w-full opacity-[0.028]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="dashboardGrid"
          width="36"
          height="36"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1.5" cy="1.5" r="1.2" fill="#8f6d1d" />
        </pattern>
      </defs>

      <rect width="100%" height="100%" fill="url(#dashboardGrid)" />
    </svg>
  </div>
);

// =====================================================
// GLASS STAT CIRCLE
// =====================================================

const GlassStatCircle = ({
  pct = 65,
  index = 0,
  isRefreshing = false,
}: {
  pct?: number;
  index?: number;
  isRefreshing?: boolean;
}) => {
  const size = 78;
  const stroke = 4;

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="pointer-events-none absolute -right-5 -top-5">
      <div className="absolute inset-0 h-[78px] w-[78px] rounded-full bg-[#d8bd72]/10 blur-xl" />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative opacity-[0.82]"
      >
        <defs>
          <linearGradient id={`glassCircle-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff8df" stopOpacity="0.85" />
            <stop offset="38%" stopColor="#dec477" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#9b741f" stopOpacity="0.78" />
          </linearGradient>

          <linearGradient id={`glassHighlight-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.72" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <filter id={`glassBlur-${index}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 2}
          fill="rgba(255,255,255,0.15)"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1"
          filter={`url(#glassBlur-${index})`}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 5}
          fill="rgba(184,144,46,0.045)"
          stroke="rgba(184,144,46,0.10)"
          strokeWidth="1"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(184,144,46,0.07)"
          strokeWidth={stroke}
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#glassCircle-${index})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{
            strokeDashoffset: circumference,
          }}
          animate={{
            strokeDashoffset: isRefreshing ? circumference : offset,
          }}
          transition={{
            duration: isRefreshing ? 0.6 : 1.2,
            ease: isRefreshing ? "easeInOut" : "easeOut",
            delay: isRefreshing ? 0 : index * 0.08,
          }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* Refresh spin animation */}
        <motion.g
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
                  duration: 1.5,
                  ease: "linear",
                }
              : {
                  duration: 0.3,
                }
          }
          transform-origin={`${size / 2}px ${size / 2}px`}
        >
          <path
            d={`M ${size / 2} 6 A 33 33 0 0 1 69 22`}
            fill="none"
            stroke={`url(#glassHighlight-${index})`}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />
        </motion.g>

        <circle cx="25" cy="18" r="2.2" fill="#ffffff" opacity="0.5" />
        <circle cx={size / 2} cy={size / 2} r={radius - 13} fill="rgba(255,255,255,0.045)" />
      </svg>
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#faf7ed] text-[#a67b20] ring-1 ring-[#b8902e]/10">
          {icon}
        </div>
      )}

      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-bold text-[#2d2923] sm:text-[16px]">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-0.5 truncate text-[10px] leading-5 text-[#9b917f] sm:text-[11px]">
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
      <circle cx={cx} cy={cy} r={9} fill="#b8902e" opacity={0.07} />
      <circle cx={cx} cy={cy} r={5.5} fill="#ffffff" stroke="#a67b20" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={2.6} fill="#8d691c" />
    </g>
  );
};

// =====================================================
// DASHBOARD
// =====================================================

const Dashboard = () => {
  const metrics = useMemo(() => getDashboardMetrics(), []);
  const chartDays = useMemo(() => getChartDays(), []);
  const recentOrders = useMemo(() => getRecentOrders(), []);
  const kycReviews = useMemo(() => getKycReviews(), []);
  const inventoryAlerts = useMemo(() => getInventoryAlerts(), []);
  const tickets = useMemo(() => getTickets(), []);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  // ===================================================
  // AUTO-REFRESH ON MOUNT
  // ===================================================

  useEffect(() => {
    // Trigger a gentle refresh animation on mount
    const timer = setTimeout(() => {
      handleRefresh();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    // Update refresh key to trigger re-animations
    setRefreshKey((prev) => prev + 1);

    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1200);
  }, [isRefreshing]);

  // ===================================================
  // EXPORT
  // ===================================================

  const handleExport = useCallback(() => {
    if (isExporting) return;

    setIsExporting(true);

    const rows = [
      ["Metric", "Value", "Change"],
      ...metrics.map((item: any) => [item.label, item.value, item.change]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
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
  }, [metrics, isExporting]);

  // ===================================================
  // PIE
  // ===================================================

  const pieData = recentOrders.slice(0, 3).map((order: any, index: number) => ({
    name: order.product || `Category ${index + 1}`,
    value: Number(order.amount) || [820, 690, 567][index] || 300,
    status: order.status || "completed",
  }));

  const pieTotal = pieData.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0);

  // ===================================================
  // SALES GRAPH DATA
  // ===================================================

  const barData = chartDays.map((day: any, index: number) => {
    const value = parseInt(day.height, 10) || 50;

    const pointPattern = [0.44, 0.62, 0.35, 0.58, 0.40, 0.66, 0.48];
    const factor = pointPattern[index % pointPattern.length];
    const lineValue = Math.max(12, Math.round(value * factor));

    return {
      name: day.day,
      value,
      lineValue,
      isCurrent: day.isCurrent,
    };
  });

  // ===================================================
  // COUNTS
  // ===================================================

  const totalPending = kycReviews.length;
  const totalAlerts = inventoryAlerts.length;
  const totalTickets = tickets.length;

  // ===================================================
  // METRIC SUBTEXT
  // ===================================================

  const metricSubText = [
    "Total business revenue",
    "Orders placed this period",
    "Registered customers",
    "Orders in delivery",
    "Available account balance",
  ];

  return (
    <div className="relative min-h-screen  bg-gradient-to-b from-[#faf9f5] via-[#f7f5ef] to-[#f1ecdf]">
      <BackgroundGlow />

      <motion.div
        className="min-h-screen p-4"
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
          className="mb-5 rounded-[22px] border border-[#b8902e]/10 bg-white/90 p-4 shadow-[0_10px_35px_rgba(70,55,20,0.045)] backdrop-blur sm:p-5"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex-1 min-w-0">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />
                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#9a741b] sm:text-[10px]">
                  Business Overview
                </span>
              </div>

              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#29251f] sm:text-[32px]">
                  Dashboard
                </h1>

                <span className="mb-1 hidden rounded-full border border-[#b8902e]/15 bg-[#faf8f2] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#9b741f] sm:inline-flex">
                  Admin Overview
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#978d7d] sm:text-xs">
                Monitor sales performance, customers, operations and important business activity
                from one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              {/* Live */}
              <div className="hidden items-center gap-2 rounded-xl border border-[#b8902e]/10 bg-[#faf9f5] px-3 py-2.5 sm:flex">
                <motion.span
                  className="h-2 w-2 rounded-full bg-[#b8902e]"
                  animate={{
                    opacity: isRefreshing ? [1, 0.3, 1] : 1,
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wide text-[#806f53]">
                    Live Data
                  </div>
                  <div className="text-[8px] text-[#aa9d88]">
                    Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="hidden items-center gap-2 rounded-xl border border-[#b8902e]/10 bg-white px-3 py-2.5 md:flex">
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
                  <FiTrendingUp size={14} className="text-[#b8902e]" />
                </motion.div>
                <span className="text-[10px] font-semibold text-[#766d5d]">Performance</span>
              </div>

              {/* Refresh */}
              <motion.button
                type="button"
                onClick={handleRefresh}
                whileTap={{ scale: 0.95 }}
                disabled={isRefreshing}
                className="flex h-10 items-center gap-2 rounded-xl border border-[#b8902e]/15 bg-white px-3.5 text-[10px] font-bold text-[#8b681b] shadow-sm transition-all hover:border-[#b8902e]/30 hover:bg-[#fbfaf6] disabled:opacity-60"
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
                <span className="hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </motion.button>

              {/* Export */}
              <motion.button
                type="button"
                onClick={handleExport}
                whileTap={{ scale: 0.95 }}
                disabled={isExporting}
                className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#d5b35b] via-[#bf9840] to-[#96701d] px-4 text-[10px] font-bold text-white shadow-[0_8px_20px_rgba(184,144,46,0.23)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(184,144,46,0.32)] disabled:opacity-70"
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
          {metrics.map((metric: any, index: number) => (
            <motion.div
              key={metric.label}
              variants={itemVariants}
              whileHover={{
                y: -4,
                scale: 1.008,
                transition: { duration: 0.18 },
              }}
              className="group relative min-h-[152px] overflow-hidden rounded-[19px] border border-[#b8902e]/10 bg-white px-4 py-3.5 shadow-[0_7px_22px_rgba(70,55,20,0.035)] transition-all duration-300 hover:border-[#b8902e]/24 hover:shadow-[0_16px_32px_rgba(70,55,20,0.08)]"
            >
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#e1c579] via-[#b8902e] to-[#806017]" />

              <GlassStatCircle
                pct={48 + ((index * 12) % 42)}
                index={index}
                isRefreshing={isRefreshing}
              />

              <div className="pointer-events-none absolute -right-8 bottom-[-30px] h-24 w-24 rounded-full bg-[#b8902e]/5 blur-2xl transition duration-300 group-hover:bg-[#b8902e]/10" />

              <div className="pointer-events-none absolute left-0 top-0 h-12 w-24 rounded-full bg-white/40 blur-2xl opacity-30" />

              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <motion.div
                    whileHover={{
                      scale: 1.06,
                      rotate: 2,
                    }}
                    animate={
                      isRefreshing
                        ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, 0],
                          }
                        : {
                            scale: 1,
                            rotate: 0,
                          }
                    }
                    transition={
                      isRefreshing
                        ? {
                            duration: 0.5,
                            ease: "easeInOut",
                          }
                        : {}
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#d9b865] via-[#bc9643] to-[#96701d] text-white shadow-[0_8px_16px_rgba(184,144,46,0.20)] ring-1 ring-[#ffffff]/30"
                  >
                    <MetricIcon name={metric.icon} className="h-[16px] w-[16px]" />
                  </motion.div>

                  <span className="max-w-[110px] truncate text-right text-[9px] font-bold uppercase tracking-[0.08em] text-[#8c826f]">
                    {metric.label}
                  </span>
                </div>

                <div className="mt-2.5 flex items-end justify-between gap-3">
                  <div className="min-w-0">
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
                      className="truncate text-[24px] font-extrabold leading-none tracking-[-0.03em] text-[#29251f]"
                    >
                      {metric.value}
                    </motion.div>

                    <div className="mt-1.5 truncate text-[10px] font-medium leading-4 text-[#aaa08e] sm:text-[10.5px]">
                      {metricSubText[index]}
                    </div>
                  </div>

                  <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#faf8f2] text-[#a07a20] opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <FiArrowUpRight size={13} />
                  </div>
                </div>

                <div
                  className={`mt-2 flex items-center text-[9px] font-bold ${
                    metric.toneClass || "text-[#8f6d1d]"
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#faf8f2]">
                    <TrendIcon name={metric.trendIcon} className="h-2.5 w-2.5" />
                  </span>
                  <span className="ml-1.5">{metric.change}</span>
                  {metric.note && (
                    <span className="ml-1.5 truncate font-normal text-[#a89d8b]">{metric.note}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* =================================================
            MAIN ANALYTICS
        ================================================= */}

        <motion.div
          variants={containerVariants}
          className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3"
        >
          {/* =================================================
              SALES
          ================================================= */}

          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-[20px] border border-[#b8902e]/10 bg-white p-4 shadow-[0_8px_28px_rgba(70,55,20,0.04)] sm:p-5 xl:col-span-2"
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ddc174] via-[#b8902e] to-[#806017]" />

            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[16px] font-bold text-[#2b2721] sm:text-[17px]">
                    Sales Analytics
                  </h2>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#faf7ed] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#9a741d] ring-1 ring-[#b8902e]/10">
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-[#b8902e]"
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

                <p className="mt-1 text-[10px] text-[#9b917f]">Daily sales activity and current week performance</p>
              </div>

              <select className="h-9 cursor-pointer rounded-lg border border-[#b8902e]/12 bg-[#faf9f5] px-3 text-[10px] font-semibold text-[#716858] outline-none transition focus:border-[#b8902e]/30 focus:ring-2 focus:ring-[#b8902e]/10">
                <option>This Week</option>
                <option>Last Week</option>
                <option>This Month</option>
              </select>
            </div>

            {/* =================================================
                SALES GRAPH
            ================================================= */}

            <div className="mt-2 h-[300px] w-full overflow-hidden rounded-[15px] border border-[#b8902e]/8 bg-[#fdfcf9]">
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
                      <stop offset="0%" stopColor="#dfc16f" />
                      <stop offset="100%" stopColor="#a3791f" />
                    </linearGradient>

                    <linearGradient id="salesToday" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ecd793" />
                      <stop offset="100%" stopColor="#8d691c" />
                    </linearGradient>

                    <linearGradient id="salesLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8d691c" />
                      <stop offset="45%" stopColor="#d0aa50" />
                      <stop offset="100%" stopColor="#8d691c" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={true}
                    horizontal={true}
                    stroke="#ebe6da"
                    strokeWidth={1}
                    strokeDasharray="0"
                    opacity={0.78}
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#a89d8c"
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />

                  <YAxis
                    stroke="#a89d8c"
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />

                  <Tooltip
                    cursor={{
                      fill: "rgba(184,144,46,0.045)",
                    }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(184,144,46,0.16)",
                      borderRadius: "12px",
                      fontSize: "10px",
                      boxShadow: "0 12px 30px rgba(50,40,20,0.09)",
                    }}
                    labelStyle={{
                      color: "#62594b",
                      fontWeight: 700,
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={7}
                    payload={[
                      {
                        value: "This week",
                        type: "circle",
                        color: "#b8902e",
                      },
                    ]}
                    wrapperStyle={{
                      fontSize: "9px",
                      color: "#716858",
                      paddingBottom: "16px",
                    }}
                  />

                  <Bar dataKey="value" name="This week" radius={[8, 8, 3, 3]} barSize={30}>
                    {barData.map((entry: any, index: number) => (
                      <Cell
                        key={`sales-${index}`}
                        fill={entry.isCurrent ? "url(#salesToday)" : "url(#salesGold)"}
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
                      stroke: "#8d691c",
                      strokeWidth: 2.5,
                    }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* =================================================
                GRAPH FOOTER
            ================================================= */}

            <div className="mt-1 flex flex-wrap items-center gap-3 border-t border-[#b8902e]/8 pt-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#b8902e]" />
                <span className="text-[9px] text-[#978d7d]">Current performance</span>
              </div>

              <div className="h-3 w-px bg-[#b8902e]/10" />

              <div className="flex items-center gap-1.5">
                <span className="h-px w-5 bg-[#a67b20]" />
                <span className="text-[9px] text-[#978d7d]">Sales trend</span>
              </div>

              <div className="h-3 w-px bg-[#b8902e]/10" />

              <div className="text-[9px] text-[#978d7d]">Updated automatically</div>
            </div>
          </motion.div>

          {/* =================================================
              TOP CATEGORIES
          ================================================= */}

          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-[20px] border border-[#b8902e]/10 bg-white p-4 shadow-[0_8px_28px_rgba(70,55,20,0.04)] sm:p-5"
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ddc174] to-[#806017]" />

            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-[#2b2721]">Top Categories</h3>
                <p className="mt-1 text-[10px] text-[#9b917f]">Distribution by order value</p>
              </div>

              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f2] text-[#8f6d1d] transition hover:bg-[#f3ecd9]"
              >
                <FiMoreHorizontal size={15} />
              </button>
            </div>

            <div className="relative mt-1 h-[250px] sm:h-[275px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="47%"
                    innerRadius={68}
                    outerRadius={99}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_item: any, index: number) => (
                      <Cell
                        key={`pie-${index}`}
                        fill={[
                          "#b8902e",
                          "#d5b35b",
                          "#8a6c1f",
                        ][index % 3]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(184,144,46,0.16)",
                      borderRadius: "12px",
                      fontSize: "10px",
                      boxShadow: "0 12px 30px rgba(50,40,20,0.08)",
                    }}
                  />

                  <Legend
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={6}
                    wrapperStyle={{
                      fontSize: "8px",
                      color: "#716858",
                      paddingTop: "6px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-7">
                <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#aaa08e]">
                  Total
                </span>
                <motion.span
                  animate={
                    isRefreshing
                      ? {
                          scale: [1, 1.05, 1],
                        }
                      : {
                          scale: 1,
                        }
                  }
                  transition={
                    isRefreshing
                      ? {
                          duration: 0.6,
                          ease: "easeInOut",
                        }
                      : {}
                  }
                  className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-[#2b2721]"
                >
                  ₹{pieTotal.toLocaleString("en-IN")}
                </motion.span>
                <span className="mt-0.5 text-[8px] text-[#a99d8a]">Order Value</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {pieData.map((item: any, index: number) => (
                <motion.div
                  key={`${item.name}-${index}`}
                  animate={
                    isRefreshing
                      ? {
                          opacity: [1, 0.5, 1],
                          y: [0, -2, 0],
                        }
                      : {
                          opacity: 1,
                          y: 0,
                        }
                  }
                  transition={
                    isRefreshing
                      ? {
                          duration: 0.5,
                          delay: index * 0.1,
                        }
                      : {}
                  }
                  className="rounded-xl bg-[#faf9f5] px-2.5 py-2"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background: [
                          "#b8902e",
                          "#d5b35b",
                          "#8a6c1f",
                        ][index % 3],
                      }}
                    />
                    <span className="truncate text-[8px] font-semibold text-[#766d5d]">{item.name}</span>
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-[#40392f]">
                    ₹{Number(item.value).toLocaleString("en-IN")}
                  </div>
                </motion.div>
              ))}
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

          <motion.div variants={itemVariants} className="space-y-5 xl:col-span-2">
            {/* KYC */}

            <div className="relative overflow-hidden rounded-[20px] border border-[#b8902e]/10 bg-white p-4 shadow-[0_8px_28px_rgba(70,55,20,0.04)] sm:p-5">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#ddc174] to-[#9a741b]" />

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
                    className="shrink-0 rounded-full border border-[#b8902e]/12 bg-[#fffaf0] px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-wide text-[#9a741b]"
                  >
                    {totalPending} Pending
                  </motion.span>
                }
              />

              <div className="space-y-2">
                {kycReviews.slice(0, 4).map(([name, time]: any, idx: number) => (
                  <motion.div
                    key={name}
                    whileHover={{ x: 3 }}
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
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#b8902e]/8 bg-[#fbfaf7] px-3 py-2.5 transition hover:border-[#b8902e]/18 hover:bg-[#fffdf8]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee3c7] text-[10px] font-extrabold text-[#8d681b]">
                        {String(name).charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-bold text-[#3d372e] sm:text-xs">
                          {name}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[8px] text-[#a39887] sm:text-[9px]">
                          <FiClock size={9} />
                          {time}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-[#b8902e]/18 bg-white px-3 py-1.5 text-[9px] font-bold text-[#8d691d] transition hover:bg-[#b8902e] hover:text-white"
                    >
                      Review
                    </button>
                  </motion.div>
                ))}

                {kycReviews.length === 0 && (
                  <div className="rounded-xl bg-[#fbfaf7] p-5 text-center text-[10px] text-[#9b917f]">
                    No pending KYC reviews.
                  </div>
                )}
              </div>
            </div>

            {/* INVENTORY */}

            <div className="relative overflow-hidden rounded-[20px] border border-[#b8902e]/10 bg-white p-4 shadow-[0_8px_28px_rgba(70,55,20,0.04)] sm:p-5">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#b8902e] to-[#7d5d16]" />

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
                    className="rounded-full bg-[#faf8f2] px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-wide text-[#8f6d1d]"
                  >
                    {totalAlerts} Alerts
                  </motion.span>
                }
              />

              <div className="divide-y divide-[#b8902e]/8">
                {inventoryAlerts.slice(0, 5).map(({ name, stock, toneClass }: any, idx: number) => (
                  <motion.div
                    key={name}
                    whileHover={{ x: 3 }}
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
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#faf8f2] text-[#a47b20]">
                        <FiAlertCircle size={15} />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-semibold text-[#4b4439]">{name}</div>
                        <div className="mt-0.5 text-[8px] text-[#a69b8a]">Stock level</div>
                      </div>
                    </div>

                    <span className={`shrink-0 rounded-full bg-[#faf8f2] px-2.5 py-1 text-[9px] font-bold ${toneClass}`}>
                      {stock}
                    </span>
                  </motion.div>
                ))}

                {inventoryAlerts.length === 0 && (
                  <div className="rounded-xl bg-[#fbfaf7] p-5 text-center text-[10px] text-[#9b917f]">
                    No inventory alerts.
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* SUPPORT */}

          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-[20px] border border-[#b8902e]/10 bg-white p-4 shadow-[0_8px_28px_rgba(70,55,20,0.04)] sm:p-5"
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#e2c77a] to-[#816118]" />

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
                  className="rounded-full bg-[#faf8f2] px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-wide text-[#8f6d1d]"
                >
                  {totalTickets} Open
                </motion.span>
              }
            />

            <div className="space-y-2">
              {tickets.slice(0, 5).map(({ title, source, time, status, badgeClass }: any, idx: number) => (
                <motion.div
                  key={title}
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
                  whileHover={{ x: 3 }}
                  className="rounded-xl border border-[#b8902e]/8 bg-[#fbfaf7] p-3 transition hover:border-[#b8902e]/18 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-bold text-[#3b352d] sm:text-[11px]">
                        {title}
                      </div>
                      <div className="mt-1 truncate text-[8px] text-[#9e9483] sm:text-[9px]">{source}</div>
                    </div>
                    <span className="shrink-0 text-[8px] text-[#aaa08e]">{time}</span>
                  </div>

                  <div className="mt-2">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[7px] font-bold uppercase tracking-[0.12em] ${badgeClass}`}>
                      {status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#b8902e]/12 bg-[#faf8f2] py-2.5 text-[9px] font-bold uppercase tracking-wide text-[#8f6d1d] transition hover:border-[#b8902e]/22 hover:bg-[#f4eddc]"
            >
              View All Tickets
              <FiChevronRight size={11} />
            </button>
          </motion.div>
        </motion.div>

        {/* =================================================
            BOTTOM SUMMARY
        ================================================= */}

        <motion.div variants={containerVariants} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                whileHover={{ y: -2 }}
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
                className="flex items-center justify-between rounded-[16px] border border-[#b8902e]/9 bg-white px-4 py-3 shadow-[0_6px_20px_rgba(70,55,20,0.03)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#faf8f2] text-[#a47b20]">
                    <Icon size={15} />
                  </div>

                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-[#8b806e]">
                      {item.title}
                    </div>
                    <div className="mt-0.5 text-[8px] text-[#aaa08e]">{item.subtitle}</div>
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
                  className="text-lg font-extrabold tracking-tight text-[#393229]"
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