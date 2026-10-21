import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  FiClock,
  FiRefreshCw,
  FiDownload,
  FiCheckCircle,
  FiPackage,
  FiUsers as FiUsersIcon,
  FiChevronRight,
  FiInbox,
  FiMail,
  FiTruck as FiTruckIcon,
} from "react-icons/fi";

import adminDashboardApi from "../../api/endpoints/adminDashboard";

import { Link, useNavigate } from "react-router-dom";

import { usePortalInfo } from "../../pages/permissions/usePortalInfo";
import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// DASHBOARD ROLE
// =====================================================

type DashboardRole = "admin" | "sales" | "warehouse" | "finance" | "support" | "default";

// =====================================================
// THEME DEFINITIONS
// =====================================================

interface DashboardTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primarySoft: string;
  primaryPale: string;

  accent: string;
  accentSoft: string;
  accentDark: string;
  accentLight: string;

  danger: string;

  classes: {
    pageBg: string;
    surface: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    primaryTile: string;
    primaryText: string;
    accentTile: string;
    accentText: string;
    primaryBar: string;
    accentBar: string;
    primaryChip: string;
    accentChip: string;
    pageGradient: string;
    primaryButton: string;
    accentButton: string;
  };

  gradients: {
    barPrimaryFrom: string;
    barPrimaryTo: string;
    barAccentFrom: string;
    barAccentTo: string;
    barSoftFrom: string;
    barSoftTo: string;
    lineFrom: string;
    lineMid: string;
    lineTo: string;
  };

  avatarTones: string[];
  pieColors: string[];
}

const ADMIN_THEME: DashboardTheme = {
  primary: "#2D6FE8",
  primaryLight: "#4F8FF7",
  primaryDark: "#1E40AF",
  primarySoft: "#60A5FA",
  primaryPale: "#BFDBFE",

  accent: "#FACC15",
  accentSoft: "#FDE047",
  accentDark: "#EAB308",
  accentLight: "#FEF9C3",

  danger: "#C23B32",

  classes: {
    pageBg: "bg-white",
    surface: "bg-white",
    border: "border-[#DCE6F2]",
    textPrimary: "text-[#111827]",
    textMuted: "text-[#6B7280]",
    primaryTile: "bg-[#EAF3FF]",
    primaryText: "text-[#2D6FE8]",
    accentTile: "bg-[#FEF9C3]",
    accentText: "text-[#A16207]",
    primaryBar: "bg-[#2D6FE8]",
    accentBar: "bg-[#FACC15]",
    primaryChip: "bg-[#EAF3FF] text-[#1E40AF] ring-[#2D6FE8]/20",
    accentChip: "bg-[#FEF9C3] text-[#854D0E] ring-[#FACC15]/50",
    pageGradient:
      "bg-[radial-gradient(900px_420px_at_100%_-5%,rgba(250,204,21,0.10),transparent),radial-gradient(900px_480px_at_-5%_0%,rgba(45,111,232,0.04),transparent)]",
    primaryButton:
      "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white",
    accentButton:
      "bg-gradient-to-br from-[#FDE047] to-[#FACC15] text-[#111827] shadow-[0_8px_20px_-8px_rgba(250,204,21,0.65)] hover:from-[#FACC15] hover:to-[#EAB308]",
  },

  gradients: {
    barPrimaryFrom: "#4F8FF7",
    barPrimaryTo: "#2D6FE8",
    barAccentFrom: "#FDE047",
    barAccentTo: "#FACC15",
    barSoftFrom: "#60A5FA",
    barSoftTo: "#4F8FF7",
    lineFrom: "#1E40AF",
    lineMid: "#2D6FE8",
    lineTo: "#4F8FF7",
  },

  avatarTones: [
    "from-[#4F8FF7] to-[#2D6FE8] text-white",
    "from-[#FDE047] to-[#FACC15] text-[#713F12]",
    "from-[#60A5FA] to-[#1E40AF] text-white",
    "from-[#FEF08A] to-[#EAB308] text-[#713F12]",
  ],

  pieColors: ["#2D6FE8", "#FACC15", "#4F8FF7"],
};

const WAREHOUSE_THEME: DashboardTheme = {
  primary: "#0FA3A3",
  primaryLight: "#2CC2B8",
  primaryDark: "#0B7C7C",
  primarySoft: "#6FE0D6",
  primaryPale: "#CFF7F2",

  accent: "#F5B841",
  accentSoft: "#FBD07A",
  accentDark: "#D99A22",
  accentLight: "#FEF3D6",

  danger: "#C23B32",

  classes: {
    pageBg: "bg-white",
    surface: "bg-white",
    border: "border-[#D6EFEC]",
    textPrimary: "text-[#0F172A]",
    textMuted: "text-[#64748B]",
    primaryTile: "bg-[#E6FBFA]",
    primaryText: "text-[#0FA3A3]",
    accentTile: "bg-[#FEF3D6]",
    accentText: "text-[#B57A0F]",
    primaryBar: "bg-[#0FA3A3]",
    accentBar: "bg-[#F5B841]",
    primaryChip: "bg-[#E6FBFA] text-[#0B7C7C] ring-[#0FA3A3]/20",
    accentChip: "bg-[#FEF3D6] text-[#B57A0F] ring-[#F5B841]/50",
    pageGradient:
      "bg-[radial-gradient(900px_420px_at_100%_-5%,rgba(245,184,65,0.10),transparent),radial-gradient(900px_480px_at_-5%_0%,rgba(15,163,163,0.05),transparent)]",
    primaryButton:
      "bg-gradient-to-br from-[#2CC2B8] to-[#0FA3A3] text-white",
    accentButton:
      "bg-gradient-to-br from-[#FBD07A] to-[#F5B841] text-[#3B2A00] shadow-[0_8px_20px_-8px_rgba(245,184,65,0.65)] hover:from-[#F5B841] hover:to-[#D99A22]",
  },

  gradients: {
    barPrimaryFrom: "#2CC2B8",
    barPrimaryTo: "#0FA3A3",
    barAccentFrom: "#FBD07A",
    barAccentTo: "#F5B841",
    barSoftFrom: "#6FE0D6",
    barSoftTo: "#2CC2B8",
    lineFrom: "#0B7C7C",
    lineMid: "#0FA3A3",
    lineTo: "#2CC2B8",
  },

  avatarTones: [
    "from-[#2CC2B8] to-[#0FA3A3] text-white",
    "from-[#FBD07A] to-[#F5B841] text-[#3B2A00]",
    "from-[#6FE0D6] to-[#0B7C7C] text-white",
    "from-[#FEF3D6] to-[#D99A22] text-[#3B2A00]",
  ],

  pieColors: ["#0FA3A3", "#F5B841", "#2CC2B8"],
};

const DEFAULT_THEME: DashboardTheme = {
  primary: "#6366F1",
  primaryLight: "#818CF8",
  primaryDark: "#4338CA",
  primarySoft: "#A5B4FC",
  primaryPale: "#E0E7FF",

  accent: "#FB7185",
  accentSoft: "#FDA4AF",
  accentDark: "#E11D48",
  accentLight: "#FFE4E6",

  danger: "#C23B32",

  classes: {
    pageBg: "bg-white",
    surface: "bg-white",
    border: "border-[#E4E7F5]",
    textPrimary: "text-[#111827]",
    textMuted: "text-[#6B7280]",
    primaryTile: "bg-[#EEF0FF]",
    primaryText: "text-[#6366F1]",
    accentTile: "bg-[#FFE4E6]",
    accentText: "text-[#BE123C]",
    primaryBar: "bg-[#6366F1]",
    accentBar: "bg-[#FB7185]",
    primaryChip: "bg-[#EEF0FF] text-[#4338CA] ring-[#6366F1]/20",
    accentChip: "bg-[#FFE4E6] text-[#BE123C] ring-[#FB7185]/40",
    pageGradient:
      "bg-[radial-gradient(900px_420px_at_100%_-5%,rgba(251,113,133,0.10),transparent),radial-gradient(900px_480px_at_-5%_0%,rgba(99,102,241,0.05),transparent)]",
    primaryButton:
      "bg-gradient-to-br from-[#818CF8] to-[#6366F1] text-white",
    accentButton:
      "bg-gradient-to-br from-[#FDA4AF] to-[#FB7185] text-[#4A0B16] shadow-[0_8px_20px_-8px_rgba(251,113,133,0.65)] hover:from-[#FB7185] hover:to-[#E11D48]",
  },

  gradients: {
    barPrimaryFrom: "#818CF8",
    barPrimaryTo: "#6366F1",
    barAccentFrom: "#FDA4AF",
    barAccentTo: "#FB7185",
    barSoftFrom: "#A5B4FC",
    barSoftTo: "#818CF8",
    lineFrom: "#4338CA",
    lineMid: "#6366F1",
    lineTo: "#818CF8",
  },

  avatarTones: [
    "from-[#818CF8] to-[#6366F1] text-white",
    "from-[#FDA4AF] to-[#FB7185] text-[#4A0B16]",
    "from-[#A5B4FC] to-[#4338CA] text-white",
    "from-[#FFE4E6] to-[#E11D48] text-[#4A0B16]",
  ],

  pieColors: ["#6366F1", "#FB7185", "#818CF8"],
};

const SALES_THEME: DashboardTheme = {
  ...DEFAULT_THEME,
  primary: "#7C3AED",
  primaryLight: "#A78BFA",
  primaryDark: "#5B21B6",
  primarySoft: "#C4B5FD",
  primaryPale: "#EDE9FE",
  accent: "#F97316",
  accentSoft: "#FDBA74",
  accentDark: "#EA580C",
  accentLight: "#FFEDD5",
  classes: {
    ...DEFAULT_THEME.classes,
    border: "border-[#E9DDFB]",
    primaryTile: "bg-[#F3E8FF]",
    primaryText: "text-[#7C3AED]",
    accentTile: "bg-[#FFF0E5]",
    accentText: "text-[#C2410C]",
    primaryBar: "bg-[#7C3AED]",
    accentBar: "bg-[#F97316]",
    primaryChip: "bg-[#F3E8FF] text-[#5B21B6] ring-[#7C3AED]/20",
    accentChip: "bg-[#FFF0E5] text-[#C2410C] ring-[#F97316]/30",
    pageGradient: "bg-[radial-gradient(900px_420px_at_100%_-5%,rgba(249,115,22,0.10),transparent),radial-gradient(900px_480px_at_-5%_0%,rgba(124,58,237,0.07),transparent)]",
    primaryButton: "bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white",
    accentButton: "bg-gradient-to-br from-[#FDBA74] to-[#F97316] text-white shadow-[0_8px_20px_-8px_rgba(249,115,22,0.45)] hover:from-[#F97316] hover:to-[#EA580C]",
  },
  gradients: {
    barPrimaryFrom: "#A78BFA",
    barPrimaryTo: "#7C3AED",
    barAccentFrom: "#FDBA74",
    barAccentTo: "#F97316",
    barSoftFrom: "#C4B5FD",
    barSoftTo: "#A78BFA",
    lineFrom: "#5B21B6",
    lineMid: "#7C3AED",
    lineTo: "#A78BFA",
  },
  avatarTones: [
    "from-[#A78BFA] to-[#7C3AED] text-white",
    "from-[#FDBA74] to-[#F97316] text-white",
    "from-[#C4B5FD] to-[#5B21B6] text-white",
    "from-[#FFEDD5] to-[#EA580C] text-[#7C2D12]",
  ],
  pieColors: ["#7C3AED", "#F97316", "#A78BFA"],
};


const FINANCE_THEME: DashboardTheme = {
  ...DEFAULT_THEME,
  primary: "#15803D",
  primaryLight: "#4ADE80",
  primaryDark: "#166534",
  primarySoft: "#86EFAC",
  primaryPale: "#DCFCE7",
  accent: "#EA580C",
  accentSoft: "#FDBA74",
  accentDark: "#C2410C",
  accentLight: "#FFEDD5",
  classes: {
    ...DEFAULT_THEME.classes,
    border: "border-[#CDEBD5]",
    primaryTile: "bg-[#DCFCE7]",
    primaryText: "text-[#15803D]",
    accentTile: "bg-[#FFEDD5]",
    accentText: "text-[#C2410C]",
    primaryBar: "bg-[#15803D]",
    accentBar: "bg-[#EA580C]",
    primaryChip: "bg-[#DCFCE7] text-[#166534] ring-[#15803D]/20",
    accentChip: "bg-[#FFEDD5] text-[#9A3412] ring-[#EA580C]/30",
    pageGradient: "bg-[radial-gradient(900px_420px_at_100%_-5%,rgba(234,88,12,0.09),transparent),radial-gradient(900px_480px_at_-5%_0%,rgba(21,128,61,0.06),transparent)]",
    primaryButton: "bg-gradient-to-br from-[#4ADE80] to-[#15803D] text-white",
    accentButton: "bg-gradient-to-br from-[#FDBA74] to-[#EA580C] text-white shadow-[0_8px_20px_-8px_rgba(234,88,12,0.45)] hover:from-[#EA580C] hover:to-[#C2410C]",
  },
  gradients: {
    barPrimaryFrom: "#4ADE80",
    barPrimaryTo: "#15803D",
    barAccentFrom: "#FDBA74",
    barAccentTo: "#EA580C",
    barSoftFrom: "#86EFAC",
    barSoftTo: "#4ADE80",
    lineFrom: "#166534",
    lineMid: "#15803D",
    lineTo: "#4ADE80",
  },
  avatarTones: [
    "from-[#4ADE80] to-[#15803D] text-white",
    "from-[#FDBA74] to-[#EA580C] text-white",
    "from-[#86EFAC] to-[#166534] text-white",
    "from-[#FFEDD5] to-[#C2410C] text-white",
  ],
  pieColors: ["#15803D", "#EA580C", "#4ADE80"],
};

const SUPPORT_THEME: DashboardTheme = {
  ...DEFAULT_THEME,
  primary: "#0891B2",
  primaryLight: "#22D3EE",
  primaryDark: "#0E7490",
  primarySoft: "#67E8F9",
  primaryPale: "#CFFAFE",
  accent: "#F43F5E",
  accentSoft: "#FDA4AF",
  accentDark: "#BE123C",
  accentLight: "#FFE4E6",
  classes: {
    ...DEFAULT_THEME.classes,
    border: "border-[#CBEFF5]",
    primaryTile: "bg-[#CFFAFE]",
    primaryText: "text-[#0E7490]",
    accentTile: "bg-[#FFE4E6]",
    accentText: "text-[#BE123C]",
    primaryBar: "bg-[#0891B2]",
    accentBar: "bg-[#F43F5E]",
    primaryChip: "bg-[#CFFAFE] text-[#0E7490] ring-[#0891B2]/20",
    accentChip: "bg-[#FFE4E6] text-[#BE123C] ring-[#F43F5E]/30",
    pageGradient: "bg-[radial-gradient(900px_420px_at_100%_-5%,rgba(244,63,94,0.08),transparent),radial-gradient(900px_480px_at_-5%_0%,rgba(8,145,178,0.07),transparent)]",
    primaryButton: "bg-gradient-to-br from-[#22D3EE] to-[#0891B2] text-white",
    accentButton: "bg-gradient-to-br from-[#FDA4AF] to-[#F43F5E] text-white shadow-[0_8px_20px_-8px_rgba(244,63,94,0.45)] hover:from-[#F43F5E] hover:to-[#BE123C]",
  },
  gradients: {
    barPrimaryFrom: "#22D3EE",
    barPrimaryTo: "#0891B2",
    barAccentFrom: "#FDA4AF",
    barAccentTo: "#F43F5E",
    barSoftFrom: "#67E8F9",
    barSoftTo: "#22D3EE",
    lineFrom: "#0E7490",
    lineMid: "#0891B2",
    lineTo: "#22D3EE",
  },
  avatarTones: [
    "from-[#22D3EE] to-[#0891B2] text-white",
    "from-[#FDA4AF] to-[#F43F5E] text-white",
    "from-[#67E8F9] to-[#0E7490] text-white",
    "from-[#FFE4E6] to-[#BE123C] text-white",
  ],
  pieColors: ["#0891B2", "#F43F5E", "#22D3EE"],
};

const DASHBOARD_THEMES: Record<DashboardRole, DashboardTheme> = {
  admin: ADMIN_THEME,
  sales: SALES_THEME,
  warehouse: WAREHOUSE_THEME,
  finance: FINANCE_THEME,
  support: SUPPORT_THEME,
  default: DEFAULT_THEME,
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
  stock_quantity?: number | string;
  status?: string;
}

interface NormalizedDashboard {
  total_revenue: string | number;
  total_orders: number;
  total_customers: number;
  total_distributors: number;
  total_products: number;

  sales_analysis: {
    this_week: {
      summary: {
        revenue: string | number;
        orders: number;
        start_date: string;
        end_date: string;
      };
      daily_breakdown: Array<{
        date: string;
        day: string;
        revenue: string | number;
        orders: number;
      }>;
    };
    last_week: {
      summary: {
        revenue: string | number;
        orders: number;
        start_date: string;
        end_date: string;
      };
      daily_breakdown: Array<{
        date: string;
        day: string;
        revenue: string | number;
        orders: number;
      }>;
    };
    this_month: {
      summary: {
        revenue: string | number;
        orders: number;
        start_date: string;
        end_date: string;
      };
      weekly_breakdown: Array<{
        week_number: number;
        start_date: string;
        end_date: string;
        revenue: string | number;
        orders: number;
      }>;
    };
    percentage_change: {
      week_over_week: number;
      month_over_month: number;
    };
  };

  top_categories: Array<{
    id: number;
    name: string;
    slug: string;
    product_count: number;
    max_price: number;
  }>;

  pending_kyc_reviews: Array<{
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    user_phone: string;
    account_type: string;
    title: string;
    type_of_entity: string;
    bank_name: string;
    kyc_status: string;
    submitted_at: string;
    created_at: string;
  }>;

  stock_status: {
    summary: {
      low_stock_count: number;
      out_of_stock_count: number;
      in_stock_count: number;
      total_products: number;
    };
    low_stock_products: InventoryAlertItem[];
    out_of_stock_products: InventoryAlertItem[];
  };

  top_contacts: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    message: string;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
  }>;

  finance: {
    revenue: {
      total_line_revenue: string | number;
      this_month_line_revenue: string | number;
      last_month_line_revenue: string | number;
      revenue_change_percentage: number;
    };
    tax: {
      total_gst: string | number;
      total_cgst: string | number;
      total_sgst: string | number;
      total_igst: string | number;
    };
    payments: {
      pending_payments_count: number;
      pending_payments_amount: string | number;
    };
    refunds: {
      pending_refunds_count: number;
      pending_refunds_amount: number;
      refunded_orders_count: number;
      refunded_orders_amount: number;
      refunded_lines_count: number;
      refunded_lines_amount: number;
      buyback_refunded_count: number;
      buyback_refunded_amount: number;
    };
    cancellations: {
      cancelled_lines_count: number;
      cancelled_lines_amount: string | number;
    };
  };

  support: {
    contacts: {
      unread_count: number;
      total_count: number;
      top_contacts: Array<{
        id: number;
        name: string;
        email: string;
        phone: string;
        message: string;
        is_read: boolean;
        read_at: string | null;
        created_at: string;
      }>;
    };
    order_lines: {
      cancel_pending_count: number;
      return_pending_count: number;
      buyback_pending_count: number;
      total_pending_support_lines: number;
      recent_support_lines: Array<{
        id: number;
        item_reference_id: string;
        order_id: number;
        order_reference: string;
        product_id: number;
        product_name: string;
        product_code: string;
        quantity: number;
        delivery_status: string;
        cancellation_requested_at: string | null;
        return_requested_at: string | null;
        buyback_requested_at: string | null;
        cancellation_reason: string | null;
        return_reason: string | null;
        updated_at: string;
      }>;
    };
  };

  warehouse: {
    stock_status: {
      summary: {
        low_stock_count: number;
        out_of_stock_count: number;
        in_stock_count: number;
        total_products: number;
      };
      low_stock_products: InventoryAlertItem[];
      out_of_stock_products: InventoryAlertItem[];
    };
    order_lines: {
      pending_dispatch_lines: number;
      processing_lines: number;
      ready_to_ship_lines: number;
      in_transit_lines: number;
      delivered_lines: number;
      recent_lines: Array<{
        id: number;
        item_reference_id: string;
        order_id: number;
        order_reference: string;
        product_id: number;
        product_name: string;
        product_code: string;
        quantity: number;
        delivery_status: string;
        dispatched_at: string | null;
        delivered_at: string | null;
        created_at: string;
      }>;
    };
    products: {
      total_products: number;
      needs_restock: Array<{
        id: number;
        name: string;
        product_code: string;
        stock_quantity: number;
        low_stock_threshold: number;
        needs_restock: boolean;
      }>;
    };
  };

  _ui_role: "admin" | "warehouse";
}

// =====================================================
// NORMALIZE API RESPONSE
// =====================================================

const normalizeDashboardData = (
  rawData: any,
  role?: "admin" | "warehouse" | null,
): NormalizedDashboard | null => {
  if (!rawData) return null;

  const admin = rawData.admin || {};
  const warehouse = rawData.warehouse || {};
  const finance = rawData.finance || {};
  const support = rawData.support || {};

  const hasAdmin = Boolean(
    rawData.admin && Object.keys(rawData.admin).length > 0,
  );

  const hasWarehouse = Boolean(
    rawData.warehouse && Object.keys(rawData.warehouse).length > 0,
  );

  const uiRole: "admin" | "warehouse" =
    role === "warehouse"
      ? "warehouse"
      : role === "admin"
        ? "admin"
        : hasWarehouse && !hasAdmin
          ? "warehouse"
          : "admin";

  const salesAnalysis = admin.sales_analysis || {};

  const thisWeek = salesAnalysis.this_week || {
    summary: { revenue: 0, orders: 0, start_date: "", end_date: "" },
    daily_breakdown: [],
  };

  const lastWeek = salesAnalysis.last_week || {
    summary: { revenue: 0, orders: 0, start_date: "", end_date: "" },
    daily_breakdown: [],
  };

  const thisMonth = salesAnalysis.this_month || {
    summary: { revenue: 0, orders: 0, start_date: "", end_date: "" },
    weekly_breakdown: [],
  };

  const percentageChange = salesAnalysis.percentage_change || {
    week_over_week: 0,
    month_over_month: 0,
  };

  const stockStatus = admin.stock_status || {
    summary: {
      low_stock_count: 0,
      out_of_stock_count: 0,
      in_stock_count: 0,
      total_products: 0,
    },
    low_stock_products: [],
    out_of_stock_products: [],
  };

  const financeRevenue = finance.revenue || {
    total_line_revenue: 0,
    this_month_line_revenue: 0,
    last_month_line_revenue: 0,
    revenue_change_percentage: 0,
  };

  const financeTax = finance.tax || {
    total_gst: 0,
    total_cgst: 0,
    total_sgst: 0,
    total_igst: 0,
  };

  const financePayments = finance.payments || {
    pending_payments_count: 0,
    pending_payments_amount: 0,
  };

  const financeRefunds = finance.refunds || {
    pending_refunds_count: 0,
    pending_refunds_amount: 0,
    refunded_orders_count: 0,
    refunded_orders_amount: 0,
    refunded_lines_count: 0,
    refunded_lines_amount: 0,
    buyback_refunded_count: 0,
    buyback_refunded_amount: 0,
  };

  const financeCancellations = finance.cancellations || {
    cancelled_lines_count: 0,
    cancelled_lines_amount: 0,
  };

  const supportContacts = support.contacts || {
    unread_count: 0,
    total_count: 0,
    top_contacts: [],
  };

  const supportOrderLines = support.order_lines || {
    cancel_pending_count: 0,
    return_pending_count: 0,
    buyback_pending_count: 0,
    total_pending_support_lines: 0,
    recent_support_lines: [],
  };

  const warehouseStockStatus = warehouse.stock_status || {
    summary: {
      low_stock_count: 0,
      out_of_stock_count: 0,
      in_stock_count: 0,
      total_products: 0,
    },
    low_stock_products: [],
    out_of_stock_products: [],
  };

  const warehouseOrderLines = warehouse.order_lines || {
    pending_dispatch_lines: 0,
    processing_lines: 0,
    ready_to_ship_lines: 0,
    in_transit_lines: 0,
    delivered_lines: 0,
    recent_lines: [],
  };

  const warehouseProducts = warehouse.products || {
    total_products: 0,
    needs_restock: [],
  };

  return {
    total_revenue: admin.total_revenue ?? 0,
    total_orders: admin.total_orders ?? 0,
    total_customers: admin.total_customers ?? 0,
    total_distributors: admin.total_distributors ?? 0,

    total_products:
      admin.total_products ?? warehouseProducts.total_products ?? 0,

    sales_analysis: {
      this_week: {
        summary: {
          revenue: thisWeek.summary?.revenue ?? 0,
          orders: thisWeek.summary?.orders ?? 0,
          start_date: thisWeek.summary?.start_date ?? "",
          end_date: thisWeek.summary?.end_date ?? "",
        },
        daily_breakdown: thisWeek.daily_breakdown || [],
      },

      last_week: {
        summary: {
          revenue: lastWeek.summary?.revenue ?? 0,
          orders: lastWeek.summary?.orders ?? 0,
          start_date: lastWeek.summary?.start_date ?? "",
          end_date: lastWeek.summary?.end_date ?? "",
        },
        daily_breakdown: lastWeek.daily_breakdown || [],
      },

      this_month: {
        summary: {
          revenue: thisMonth.summary?.revenue ?? 0,
          orders: thisMonth.summary?.orders ?? 0,
          start_date: thisMonth.summary?.start_date ?? "",
          end_date: thisMonth.summary?.end_date ?? "",
        },
        weekly_breakdown: thisMonth.weekly_breakdown || [],
      },

      percentage_change: {
        week_over_week: percentageChange.week_over_week ?? 0,
        month_over_month: percentageChange.month_over_month ?? 0,
      },
    },

    top_categories: admin.top_categories || [],
    pending_kyc_reviews: admin.pending_kyc_reviews || [],

    stock_status: {
      summary: {
        low_stock_count: stockStatus.summary?.low_stock_count ?? 0,
        out_of_stock_count: stockStatus.summary?.out_of_stock_count ?? 0,
        in_stock_count: stockStatus.summary?.in_stock_count ?? 0,
        total_products: stockStatus.summary?.total_products ?? 0,
      },
      low_stock_products: stockStatus.low_stock_products || [],
      out_of_stock_products: stockStatus.out_of_stock_products || [],
    },

    top_contacts: admin.top_contacts || [],

    finance: {
      revenue: {
        total_line_revenue: financeRevenue.total_line_revenue ?? 0,
        this_month_line_revenue: financeRevenue.this_month_line_revenue ?? 0,
        last_month_line_revenue: financeRevenue.last_month_line_revenue ?? 0,
        revenue_change_percentage:
          financeRevenue.revenue_change_percentage ?? 0,
      },

      tax: {
        total_gst: financeTax.total_gst ?? 0,
        total_cgst: financeTax.total_cgst ?? 0,
        total_sgst: financeTax.total_sgst ?? 0,
        total_igst: financeTax.total_igst ?? 0,
      },

      payments: {
        pending_payments_count: financePayments.pending_payments_count ?? 0,
        pending_payments_amount: financePayments.pending_payments_amount ?? 0,
      },

      refunds: {
        pending_refunds_count: financeRefunds.pending_refunds_count ?? 0,
        pending_refunds_amount: financeRefunds.pending_refunds_amount ?? 0,
        refunded_orders_count: financeRefunds.refunded_orders_count ?? 0,
        refunded_orders_amount: financeRefunds.refunded_orders_amount ?? 0,
        refunded_lines_count: financeRefunds.refunded_lines_count ?? 0,
        refunded_lines_amount: financeRefunds.refunded_lines_amount ?? 0,
        buyback_refunded_count: financeRefunds.buyback_refunded_count ?? 0,
        buyback_refunded_amount: financeRefunds.buyback_refunded_amount ?? 0,
      },

      cancellations: {
        cancelled_lines_count: financeCancellations.cancelled_lines_count ?? 0,
        cancelled_lines_amount: financeCancellations.cancelled_lines_amount ?? 0,
      },
    },

    support: {
      contacts: {
        unread_count: supportContacts.unread_count ?? 0,
        total_count: supportContacts.total_count ?? 0,
        top_contacts: supportContacts.top_contacts || [],
      },

      order_lines: {
        cancel_pending_count: supportOrderLines.cancel_pending_count ?? 0,
        return_pending_count: supportOrderLines.return_pending_count ?? 0,
        buyback_pending_count: supportOrderLines.buyback_pending_count ?? 0,
        total_pending_support_lines:
          supportOrderLines.total_pending_support_lines ?? 0,
        recent_support_lines: supportOrderLines.recent_support_lines || [],
      },
    },

    warehouse: {
      stock_status: {
        summary: {
          low_stock_count: warehouseStockStatus.summary?.low_stock_count ?? 0,
          out_of_stock_count:
            warehouseStockStatus.summary?.out_of_stock_count ?? 0,
          in_stock_count: warehouseStockStatus.summary?.in_stock_count ?? 0,
          total_products: warehouseStockStatus.summary?.total_products ?? 0,
        },
        low_stock_products: warehouseStockStatus.low_stock_products || [],
        out_of_stock_products:
          warehouseStockStatus.out_of_stock_products || [],
      },

      order_lines: {
        pending_dispatch_lines: warehouseOrderLines.pending_dispatch_lines ?? 0,
        processing_lines: warehouseOrderLines.processing_lines ?? 0,
        ready_to_ship_lines: warehouseOrderLines.ready_to_ship_lines ?? 0,
        in_transit_lines: warehouseOrderLines.in_transit_lines ?? 0,
        delivered_lines: warehouseOrderLines.delivered_lines ?? 0,
        recent_lines: warehouseOrderLines.recent_lines || [],
      },

      products: {
        total_products: warehouseProducts.total_products ?? 0,
        needs_restock: warehouseProducts.needs_restock || [],
      },
    },

    _ui_role: uiRole,
  };
};

// =====================================================
// ANIMATIONS
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.055, when: "beforeChildren" },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.02, when: "afterChildren" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 18 },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

// =====================================================
// ICON MAPS
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
// THEME-AWARE METRIC THEME
// =====================================================

const buildMetricTheme = (theme: DashboardTheme) => ({
  attach_money: {
    tile: theme.classes.primaryTile,
    iconColor: theme.classes.primaryText,
    bar: theme.classes.primaryBar,
  },
  shopping_cart: {
    tile: theme.classes.accentTile,
    iconColor: theme.classes.accentText,
    bar: theme.classes.accentBar,
  },
  groups: {
    tile: theme.classes.primaryTile,
    iconColor: theme.classes.primaryText,
    bar: theme.classes.primaryBar,
  },
  local_shipping: {
    tile: theme.classes.accentTile,
    iconColor: theme.classes.accentText,
    bar: theme.classes.accentBar,
  },
  account_balance_wallet: {
    tile: theme.classes.primaryTile,
    iconColor: theme.classes.primaryText,
    bar: theme.classes.primaryBar,
  },
});

// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (value: string | number | null | undefined) => {
  const numericValue = Number(value || 0);
  return `₹${numericValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

const formatNumber = (value: string | number | null | undefined) =>
  Number(value || 0).toLocaleString("en-IN");

const getPercentageData = (value: number, positiveLabel = "Up") => {
  if (value > 0) {
    return {
      change: `${value.toFixed(2)}%`,
      toneClass: "text-[#2D6FE8]",
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
    toneClass: "text-[#6B7280]",
    trendIcon: "trending_flat",
    note: "No change",
  };
};

const getRelativeTime = (date: string | null | undefined) => {
  if (!date) return "Not submitted";
  const created = new Date(date).getTime();
  if (Number.isNaN(created)) return date;
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

const formatDate = (date?: string | null) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const daysWaiting = (date?: string | null) => {
  if (!date) return 0;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
};

const splitCategory = (message?: string) => {
  const raw = String(message || "");
  const m = raw.match(/^\[(.+?)\]\s*([\s\S]*)$/);
  return m
    ? { category: m[1], body: m[2] }
    : { category: "General", body: raw };
};

const stockNumber = (item: any) => {
  const n = Number(
    item.stock_quantity ??
      item.current_stock ??
      item.stock ??
      item.quantity ??
      0,
  );
  return Number.isNaN(n) ? 0 : n;
};

// =====================================================
// ICON HELPERS
// =====================================================

const MetricIcon = ({ name, className = "" }: { name?: string; className?: string }) => {
  const IconComponent = iconMap[name || ""] || FaRupeeSign;
  return <IconComponent className={className} />;
};

const TrendIcon = ({ name, className = "" }: { name?: string; className?: string }) => {
  const IconComponent = trendIconMap[name || ""] || FaMinus;
  return <IconComponent className={className} />;
};

// =====================================================
// MINI SPARKLINE
// =====================================================

const MiniSparkline = ({
  color,
  seed = 0,
  trendUp = true,
}: {
  color: string;
  seed?: number;
  trendUp?: boolean;
}) => {
  const data = useMemo(() => buildSparklineData(seed, trendUp), [seed, trendUp]);

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
// SALES LINE DOT — theme-aware
// =====================================================

const SalesLineDot = (props: any) => {
  const { cx, cy, theme } = props;
  if (cx === undefined || cy === undefined) return null;
  const primary = theme?.primary ?? "#2D6FE8";
  const dark = theme?.primaryDark ?? "#1E40AF";

  return (
    <g>
      <circle cx={cx} cy={cy} r={9} fill={primary} opacity={0.08} />
      <circle cx={cx} cy={cy} r={5.5} fill="#ffffff" stroke={primary} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={2.6} fill={dark} />
    </g>
  );
};

// =====================================================
// SKELETON PRIMITIVES — theme-aware
// =====================================================

const SkeletonBlock = ({
  className = "",
  rounded = "rounded-md",
}: {
  className?: string;
  rounded?: string;
}) => (
  <motion.div
    className={`${rounded} bg-[#E8EEF7] ${className}`}
    animate={{ opacity: [0.55, 1, 0.55] }}
    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
  />
);

const KpiSkeleton = ({ theme }: { theme: DashboardTheme }) => (
  <div className={`relative flex min-h-[140px] flex-col overflow-hidden rounded-[17px] border ${theme.classes.border} bg-white px-4 py-5 shadow-[0_3px_14px_rgba(45,111,232,0.05)]`}>
    <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#DCE6F2]" />
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <SkeletonBlock className="h-2.5 w-20" />
        <SkeletonBlock className="mt-3 h-7 w-28" rounded="rounded-lg" />
      </div>
      <SkeletonBlock className="h-10 w-10 shrink-0" rounded="rounded-[12px]" />
    </div>
    <div className="mt-auto flex items-center gap-2">
      <SkeletonBlock className="h-2.5 w-2.5" rounded="rounded-full" />
      <SkeletonBlock className="h-2 w-14" />
    </div>
  </div>
);

const ChartSkeleton = ({ className = "", theme }: { className?: string; theme: DashboardTheme }) => (
  <div className={`relative overflow-hidden rounded-[18px] border ${theme.classes.border} bg-white p-4 shadow-[0_3px_16px_rgba(45,111,232,0.05)] sm:p-5 ${className}`}>
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <SkeletonBlock className="h-4 w-40" rounded="rounded-md" />
        <SkeletonBlock className="mt-2 h-2.5 w-64" />
      </div>
      <SkeletonBlock className="h-9 w-28" rounded="rounded-lg" />
    </div>
    <div className="relative mt-2 h-[300px] w-full overflow-hidden rounded-[15px] border border-[#DCE6F2] bg-[#F8FBFF] p-4">
      <div className="absolute inset-x-4 inset-y-6 flex flex-col justify-between">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-px w-full" rounded="rounded-none" />
        ))}
      </div>
      <div className="absolute inset-x-6 bottom-8 flex items-end justify-between gap-2">
        {[40, 65, 30, 80, 55, 70, 45].map((_h, i) => (
          <SkeletonBlock key={i} className="w-6" rounded="rounded-t-md" />
        ))}
      </div>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#DCE6F2] pt-3">
      <SkeletonBlock className="h-2.5 w-24" />
      <SkeletonBlock className="h-2.5 w-20" />
      <SkeletonBlock className="h-2.5 w-32" />
    </div>
  </div>
);

const PieSkeleton = ({ theme }: { theme: DashboardTheme }) => (
  <div className={`relative overflow-hidden rounded-[18px] border ${theme.classes.border} bg-white p-4 shadow-[0_3px_16px_rgba(45,111,232,0.05)] sm:p-5`}>
    <div>
      <SkeletonBlock className="h-4 w-32" rounded="rounded-md" />
      <SkeletonBlock className="mt-2 h-2.5 w-44" />
    </div>
    <div className="relative mt-4 h-[255px] sm:h-[270px]">
      <div className="absolute inset-0 flex items-center justify-center">
        <SkeletonBlock className="h-[180px] w-[180px]" rounded="rounded-full" />
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <SkeletonBlock className="h-2 w-16" />
        <SkeletonBlock className="mt-2 h-6 w-12" rounded="rounded-md" />
        <SkeletonBlock className="mt-2 h-2 w-14" />
      </div>
    </div>
    <div className="space-y-2 border-t border-[#DCE6F2] pt-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <SkeletonBlock className="h-2.5 w-2.5" rounded="rounded-full" />
            <SkeletonBlock className="h-2.5 w-28" />
          </div>
          <SkeletonBlock className="h-2.5 w-10" />
        </div>
      ))}
    </div>
  </div>
);

const PanelSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white shadow-[0_4px_22px_rgba(45,111,232,0.07)]">
    <div className="flex items-center justify-between gap-3 border-b border-[#DCE6F2] bg-gradient-to-r from-[#EAF3FF] via-white to-white px-4 py-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <SkeletonBlock className="h-11 w-11 shrink-0" rounded="rounded-2xl" />
        <div className="min-w-0">
          <SkeletonBlock className="h-4 w-40" rounded="rounded-md" />
          <SkeletonBlock className="mt-2 h-2.5 w-52" />
        </div>
      </div>
      <SkeletonBlock className="h-7 w-20 shrink-0" rounded="rounded-full" />
    </div>
    <div className="space-y-2.5 p-3 sm:p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-[#DCE6F2] bg-white p-3">
          <SkeletonBlock className="h-11 w-11 shrink-0" rounded="rounded-full" />
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="mt-2 h-2.5 w-48" />
          </div>
          <SkeletonBlock className="h-7 w-16 shrink-0" rounded="rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

const SummarySkeleton = () => (
  <div className="relative flex items-center justify-between overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white px-5 py-4 shadow-[0_4px_16px_rgba(45,111,232,0.06)]">
    <span className="absolute inset-y-0 left-0 w-1.5 bg-[#DCE6F2]" />
    <div className="flex items-center gap-3.5">
      <SkeletonBlock className="h-12 w-12" rounded="rounded-2xl" />
      <div>
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="mt-2 h-2.5 w-32" />
      </div>
    </div>
    <SkeletonBlock className="h-7 w-10" rounded="rounded-md" />
  </div>
);

// =====================================================
// FULL DASHBOARD SKELETON — theme-aware
// =====================================================

const DashboardSkeleton = ({
  role = "default",
}: {
  role?: DashboardRole;
}) => {
  const theme = DASHBOARD_THEMES[role];
  const isWarehouseMode = role === "warehouse";

  return (
    <div className="relative min-h-screen bg-white">
      <div className={`min-h-screen p-3 sm:p-4 lg:p-5 ${theme.classes.pageGradient}`}>
        <div className="mb-5 border-b border-[#DCE6F2] pb-4 sm:pb-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <SkeletonBlock className="h-1.5 w-1.5" rounded="rounded-full" />
                <SkeletonBlock className="h-1.5 w-1.5" rounded="rounded-full" />
                <SkeletonBlock className="h-1.5 w-1.5" rounded="rounded-full" />
                <SkeletonBlock className="ml-1 h-2.5 w-32" />
              </div>
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <SkeletonBlock className="h-8 w-40" rounded="rounded-lg" />
                <SkeletonBlock className="h-6 w-20" rounded="rounded-full" />
              </div>
              <SkeletonBlock className="mt-3 h-3 w-full max-w-lg" />
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
              <SkeletonBlock className="hidden h-10 w-28 sm:block" rounded="rounded-xl" />
              <SkeletonBlock className="hidden h-10 w-28 md:block" rounded="rounded-xl" />
              <SkeletonBlock className="h-10 w-24" rounded="rounded-xl" />
              <SkeletonBlock className="h-10 w-24" rounded="rounded-xl" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <KpiSkeleton key={i} theme={theme} />
          ))}
        </div>

        <div
          className={`mt-5 grid grid-cols-1 gap-5 ${
            isWarehouseMode ? "xl:grid-cols-1" : "xl:grid-cols-3"
          }`}
        >
          <ChartSkeleton theme={theme} className={isWarehouseMode ? "" : "xl:col-span-2"} />
          {!isWarehouseMode && <PieSkeleton theme={theme} />}
        </div>

        <div
          className={`mt-5 grid grid-cols-1 gap-5 ${
            isWarehouseMode ? "xl:grid-cols-2" : "xl:grid-cols-3"
          }`}
        >
          <div className={`space-y-5 ${isWarehouseMode ? "" : "xl:col-span-2"}`}>
            {!isWarehouseMode && <PanelSkeleton rows={4} />}
            <PanelSkeleton rows={3} />
          </div>
          <PanelSkeleton rows={4} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummarySkeleton />
          <SummarySkeleton />
          <SummarySkeleton />
        </div>

        <div className="h-3" />
      </div>
    </div>
  );
};

// =====================================================
// PANEL / BADGE / EMPTY STATE — theme-aware
// =====================================================

const Panel = ({
  icon,
  title,
  subtitle,
  badge,
  tone,
  theme,
  children,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge: React.ReactNode;
  tone: "blue" | "yellow";
  theme: DashboardTheme;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => {
  const head =
    tone === "blue"
      ? theme.classes.primaryTile.replace("bg-", "from-") + " via-white to-white"
      : theme.classes.accentTile.replace("bg-", "from-") + " via-white to-white";

  const iconTone =
    tone === "blue"
      ? `${theme.classes.primaryBar} text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.8)]`
      : `${theme.classes.accentBar} ${theme.classes.accentText} shadow-[0_8px_18px_-8px_rgba(234,179,8,0.9)]`;

  return (
    <section className={`overflow-hidden rounded-[20px] border ${theme.classes.border} bg-white shadow-[0_4px_22px_rgba(45,111,232,0.07)]`}>
      <header
        className={`flex items-center justify-between gap-3 border-b ${theme.classes.border} bg-gradient-to-r ${head} px-4 py-4 sm:px-5`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconTone}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold text-[#111827] sm:text-[16px]">{title}</h3>
            <p className="truncate text-[11px] text-[#6B7280]">{subtitle}</p>
          </div>
        </div>
        {badge}
      </header>
      <div className="p-3 sm:p-4">{children}</div>
      {footer && (
        <footer className={`border-t ${theme.classes.border} bg-[#F8FBFF] px-4 py-3 sm:px-5`}>
          {footer}
        </footer>
      )}
    </section>
  );
};

const CountBadge = ({
  count,
  label,
  tone,
  theme,
}: {
  count: number;
  label: string;
  tone: "blue" | "yellow";
  theme: DashboardTheme;
}) => (
  <div
    className={`flex shrink-0 items-baseline gap-1.5 rounded-full px-3 py-1.5 ring-1 ${
      tone === "blue" ? theme.classes.primaryChip : theme.classes.accentChip
    }`}
  >
    <span className="text-[11px] font-semibold leading-none">{count}</span>
    <span className="text-[11px] font-semibold">{label}</span>
  </div>
);

const EmptyState = ({
  icon,
  title,
  hint,
  theme,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  theme: DashboardTheme;
}) => (
  <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed ${theme.classes.border} bg-[#F8FBFF] px-4 py-8 text-center`}>
    <div className={`mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white ${theme.classes.primaryText} shadow-sm ring-1 ${theme.classes.border}`}>
      {icon}
    </div>
    <div className="text-[12px] font-bold text-[#111827]">{title}</div>
    <div className="mt-0.5 text-[11px] text-[#6B7280]">{hint}</div>
  </div>
);

// =====================================================
// DASHBOARD
// =====================================================

const Dashboard = () => {
  const [dashboard, setDashboard] = useState<NormalizedDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriodType>("this_week");

  const navigate = useNavigate();

  const { portalName, warehouseName, warehouseCode } = usePortalInfo();
  const { hasModuleAccess, hasPermission, loading: permissionsLoading, roles = [] } = usePermissions() as any;

  const isWarehouseHint = Boolean(
    portalName?.toLowerCase().includes("warehouse") || (warehouseName && !portalName),
  );

  // ---- Resolve the actual assigned role before falling back to the portal path.
  // API roles may be strings or objects such as { name: "Support", slug: "support" }.
  const activeRole: DashboardRole = useMemo(() => {
    const roleList = Array.isArray(roles) ? roles : roles ? [roles] : [];
    const roleNames = roleList
      .flatMap((role: any) => {
        if (typeof role === "string") return [role];
        if (!role || typeof role !== "object") return [];
        return [role.name, role.slug, role.role, role.key, role.title].filter(Boolean);
      })
      .join(" ")
      .toLowerCase();
    const portal = String(portalName || "").toLowerCase();
    const backendRole = String(dashboard?._ui_role || "").toLowerCase();

    // Specific assigned roles must take priority over the generic Admin Portal path.
    if (isWarehouseHint || roleNames.includes("warehouse") || backendRole === "warehouse") return "warehouse";
    if (roleNames.includes("finance") || portal.includes("finance")) return "finance";
    if (roleNames.includes("sales") || portal.includes("sales")) return "sales";
    if (roleNames.includes("support") || portal.includes("support")) return "support";
    if (roleNames.includes("admin") || portal.includes("admin") || backendRole === "admin") return "admin";
    return "default";
  }, [dashboard?._ui_role, isWarehouseHint, roles, portalName]);

  const isWarehouseMode = activeRole === "warehouse" || dashboard?._ui_role === "warehouse";
  const theme = DASHBOARD_THEMES[activeRole];
  const metricTheme = useMemo(() => buildMetricTheme(theme), [theme]);

  // ===================================================
  // PERMISSION-BASED VISIBILITY
  // ===================================================

  const canSeeKyc = useMemo(
    () => !isWarehouseMode && (hasModuleAccess("user") || hasPermission("user.view")),
    [hasModuleAccess, hasPermission, isWarehouseMode],
  );

  const canSeeInventory = useMemo(
    () => hasModuleAccess("stock") || hasModuleAccess("product") || hasPermission("stock.view"),
    [hasModuleAccess, hasPermission],
  );

  const canSeeSupport = useMemo(
    () => hasModuleAccess("contact_us") || hasPermission("contact_us.view"),
    [hasModuleAccess, hasPermission],
  );

  // ===================================================
  // LOWER-CONTENT VISIBILITY FLAGS
  // ---------------------------------------------------
  // We use these to avoid rendering an empty column.
  // ===================================================

  const showKycPanel = canSeeKyc && !isWarehouseMode;
  const showInventoryPanel = canSeeInventory;
  const showSupportPanel = !isWarehouseMode && canSeeSupport;
  const showWarehouseActivity = isWarehouseMode;

  // Left column only renders if at least one of its panels is visible.
  const hasLowerLeftContent = showKycPanel || showInventoryPanel;

  // Right column only renders if its panel is visible.
  const hasLowerRightContent = showWarehouseActivity || showSupportPanel;

  // Lower grid only renders if there's anything in it.
  const hasLowerContent = hasLowerLeftContent || hasLowerRightContent;

  const handleReview = (review: any) => {
    navigate("/UserManagement", { state: { kycUserName: review.user_name } });
  };

  // ===================================================
  // FETCH
  // ===================================================

  const fetchDashboard = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) setIsRefreshing(true);
        else setIsLoading(true);

        const response = await adminDashboardApi.getDashboard();

        if (response.data.success && response.data.data) {
          const roleHint: "admin" | "warehouse" | null =
            portalName?.toLowerCase().includes("warehouse") || (warehouseName && !portalName)
              ? "warehouse"
              : null;

          const normalized = normalizeDashboardData(response.data.data, roleHint);
          setDashboard(normalized);
          setLastUpdated(new Date());
          setRefreshKey((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setIsLoading(false);
        if (showRefreshing) {
          window.setTimeout(() => setIsRefreshing(false), 700);
        }
      }
    },
    [portalName, warehouseName],
  );

  useEffect(() => {
    if (permissionsLoading) return;
    void fetchDashboard();
  }, [fetchDashboard, permissionsLoading]);

  const handleRefresh = useCallback(() => {
    if (isRefreshing || permissionsLoading) return;
    void fetchDashboard(true);
  }, [fetchDashboard, isRefreshing, permissionsLoading]);

  // ===================================================
  // METRICS
  // ===================================================

  const metrics = useMemo(() => {
    if (!dashboard) return [];

    const weekChange = dashboard.sales_analysis?.percentage_change?.week_over_week ?? 0;
    const weekTrend = getPercentageData(weekChange);
    const positiveTone = weekChange >= 0 ? theme.classes.primaryText : "text-[#C23B32]";

    if (isWarehouseMode) {
      return [
        {
          label: "Pending Dispatch",
          value: formatNumber(dashboard.warehouse?.order_lines?.pending_dispatch_lines ?? 0),
          icon: "local_shipping",
          change: "To dispatch",
          trendIcon: "trending_up",
          toneClass: theme.classes.primaryText,
          note: "lines",
        },
        {
          label: "Ready to Ship",
          value: formatNumber(dashboard.warehouse?.order_lines?.ready_to_ship_lines ?? 0),
          icon: "shopping_cart",
          change: "Packed",
          trendIcon: "trending_up",
          toneClass: theme.classes.accentText,
          note: "lines",
        },
        {
          label: "In Transit",
          value: formatNumber(dashboard.warehouse?.order_lines?.in_transit_lines ?? 0),
          icon: "account_balance_wallet",
          change: "On the way",
          trendIcon: "trending_flat",
          toneClass: theme.classes.primaryText,
          note: "lines",
        },
        {
          label: "Delivered",
          value: formatNumber(dashboard.warehouse?.order_lines?.delivered_lines ?? 0),
          icon: "groups",
          change: "Completed",
          trendIcon: "trending_up",
          toneClass: theme.classes.primaryText,
          note: "lines",
        },
        {
          label: "Products",
          value: formatNumber(
            dashboard.warehouse?.products?.total_products ?? dashboard.total_products,
          ),
          icon: "account_balance_wallet",
          change: `${dashboard.warehouse?.stock_status?.summary?.in_stock_count ?? 0}`,
          trendIcon: "trending_up",
          toneClass: theme.classes.primaryText,
          note: "in stock",
        },
      ];
    }

    return [
      {
        label: "Total Revenue",
        value: formatCurrency(dashboard.total_revenue),
        icon: "attach_money",
        change: weekTrend.change,
        trendIcon: weekTrend.trendIcon,
        toneClass: positiveTone,
        note: "vs last week",
      },
      {
        label: "Total Orders",
        value: formatNumber(dashboard.total_orders),
        icon: "shopping_cart",
        change: `${formatNumber(dashboard.sales_analysis?.this_week?.summary?.orders ?? 0)}`,
        trendIcon: "trending_up",
        toneClass: theme.classes.accentText,
        note: "this week",
      },
      {
        label: "Customers",
        value: formatNumber(dashboard.total_customers),
        icon: "groups",
        change: "Registered",
        trendIcon: "trending_flat",
        toneClass: theme.classes.primaryText,
        note: "customers",
      },
      {
        label: "Distributors",
        value: formatNumber(dashboard.total_distributors),
        icon: "local_shipping",
        change: "Active",
        trendIcon: "trending_flat",
        toneClass: "text-[#6B7280]",
        note: "distributors",
      },
      {
        label: "Products",
        value: formatNumber(dashboard.total_products),
        icon: "account_balance_wallet",
        change: `${dashboard.stock_status?.summary?.in_stock_count ?? 0}`,
        trendIcon: "trending_up",
        toneClass: theme.classes.primaryText,
        note: "in stock",
      },
    ];
  }, [dashboard, isWarehouseMode, theme]);

  // ===================================================
  // SALES DATA
  // ===================================================

  const selectedSalesData = useMemo(() => {
    if (!dashboard) return [];
    const salesAnalysis = dashboard.sales_analysis;
    if (!salesAnalysis) return [];
    if (salesPeriod === "this_month") return salesAnalysis.this_month?.weekly_breakdown || [];
    if (salesPeriod === "last_week") return salesAnalysis.last_week?.daily_breakdown || [];
    return salesAnalysis.this_week?.daily_breakdown || [];
  }, [dashboard, salesPeriod]);

  const barData: SalesChartItem[] = useMemo(() => {
    return selectedSalesData.map((item: any, index: number) => {
      const isWeekly = "week_number" in item;
      const revenue = Number(item.revenue || 0);
      const orders = Number(item.orders || 0);
      return {
        name: isWeekly
          ? `Week ${item.week_number}`
          : String(item.day || item.date || "").substring(0, 3),
        value: revenue,
        lineValue: revenue,
        isCurrent:
          salesPeriod === "this_week" ? index === new Date().getDay() - 1 : false,
        orders,
        date: `${item.start_date || item.date || ""}${
          item.end_date && item.end_date !== item.start_date ? ` - ${item.end_date}` : ""
        }`,
      };
    });
  }, [selectedSalesData, salesPeriod]);

  const currentSalesSummary = useMemo(() => {
    if (!dashboard) return { revenue: 0, orders: 0, startDate: "", endDate: "" };
    const summary = dashboard.sales_analysis?.[salesPeriod]?.summary;
    return {
      revenue: Number(summary?.revenue || 0),
      orders: Number(summary?.orders || 0),
      startDate: summary?.start_date || "",
      endDate: summary?.end_date || "",
    };
  }, [dashboard, salesPeriod]);

  // ===================================================
  // PIE DATA
  // ===================================================

  const pieData = useMemo(() => {
    if (!dashboard) return [];
    return (dashboard.top_categories || []).slice(0, 3).map((category) => ({
      name: category.name,
      value: Number(category.product_count || 0),
      maxPrice: Number(category.max_price || 0),
    }));
  }, [dashboard]);

  const pieTotal = useMemo(
    () => pieData.reduce((sum, item) => sum + Number(item.value || 0), 0),
    [pieData],
  );

  // ===================================================
  // KYC / STOCK / SUPPORT
  // ===================================================

  const kycReviews = dashboard?.pending_kyc_reviews || [];
  const totalPending = kycReviews.length;

  const stockSource = isWarehouseMode
    ? dashboard?.warehouse?.stock_status
    : dashboard?.stock_status;

  const lowStockProducts = (stockSource?.low_stock_products || []) as InventoryAlertItem[];
  const outOfStockProducts = (stockSource?.out_of_stock_products || []) as InventoryAlertItem[];

  const inventoryAlerts = useMemo(
    () => [
      ...lowStockProducts.map((item) => ({
        ...item,
        alertType: "Low Stock",
        toneClass: theme.classes.accentText,
        tileClass: `${theme.classes.accentTile} ${theme.classes.accentText}`,
      })),
      ...outOfStockProducts.map((item) => ({
        ...item,
        alertType: "Out of Stock",
        toneClass: "text-[#C23B32]",
        tileClass: "bg-[#FEF2F2] text-[#C23B32]",
      })),
    ],
    [lowStockProducts, outOfStockProducts, theme],
  );

  const totalAlerts =
    (stockSource?.summary?.low_stock_count || 0) +
    (stockSource?.summary?.out_of_stock_count || 0);

  const tickets = dashboard?.top_contacts || [];
  const totalTickets = tickets.length;
  const unreadCount = tickets.filter((ticket: any) => !ticket.is_read).length;
  const warehouseRecentLines = dashboard?.warehouse?.order_lines?.recent_lines || [];

  // ===================================================
  // SUMMARY ITEMS
  // ===================================================

  const summaryItems = [
    {
      title: "KYC queue",
      value: totalPending,
      subtitle: "Applications pending",
      icon: FiUsersIcon,
      tile: `${theme.classes.primaryTile} ${theme.classes.primaryText}`,
      bar: theme.classes.primaryBar,
      visible: showKycPanel,
    },
    {
      title: "Inventory",
      value: totalAlerts,
      subtitle: "Items need attention",
      icon: FiPackage,
      tile: `${theme.classes.accentTile} ${theme.classes.accentText}`,
      bar: theme.classes.accentBar,
      visible: showInventoryPanel,
    },
    {
      title: "Pending dispatch",
      value: dashboard?.warehouse?.order_lines?.pending_dispatch_lines ?? 0,
      subtitle: "Lines to dispatch",
      icon: FiTruckIcon,
      tile: `${theme.classes.primaryTile} ${theme.classes.primaryText}`,
      bar: theme.classes.primaryBar,
      visible: isWarehouseMode,
    },
    {
      title: "Ready to ship",
      value: dashboard?.warehouse?.order_lines?.ready_to_ship_lines ?? 0,
      subtitle: "Packed lines",
      icon: FiPackage,
      tile: `${theme.classes.accentTile} ${theme.classes.accentText}`,
      bar: theme.classes.accentBar,
      visible: isWarehouseMode,
    },
    {
      title: "In transit",
      value: dashboard?.warehouse?.order_lines?.in_transit_lines ?? 0,
      subtitle: "On the way",
      icon: FiActivity,
      tile: `${theme.classes.primaryTile} ${theme.classes.primaryText}`,
      bar: theme.classes.primaryBar,
      visible: isWarehouseMode,
    },
    {
      title: "Contact requests",
      value: totalTickets,
      subtitle: `${unreadCount} unread`,
      icon: FiActivity,
      tile: `${theme.classes.primaryTile} ${theme.classes.primaryText}`,
      bar: theme.classes.primaryBar,
      visible: showSupportPanel,
    },
  ].filter((item) => item.visible);

  // ===================================================
  // EXPORT
  // ===================================================

  const handleExport = useCallback(() => {
    if (isExporting || !dashboard) return;
    setIsExporting(true);

    const rows = [
      ["Metric", "Value"],
      ["Portal", portalName],
      ["Mode", isWarehouseMode ? "Warehouse" : "Admin"],
      ["Theme", activeRole],
      ["Warehouse", warehouseName || "N/A"],
      ["Warehouse Code", warehouseCode || "N/A"],
      ["Total Revenue", dashboard.total_revenue],
      ["Total Orders", dashboard.total_orders],
      ["Total Customers", dashboard.total_customers],
      ["Total Distributors", dashboard.total_distributors],
      ["Total Products", dashboard.total_products],
      ["Pending Dispatch", dashboard.warehouse?.order_lines?.pending_dispatch_lines ?? 0],
      ["Ready to Ship", dashboard.warehouse?.order_lines?.ready_to_ship_lines ?? 0],
      ["In Transit", dashboard.warehouse?.order_lines?.in_transit_lines ?? 0],
      ["Delivered", dashboard.warehouse?.order_lines?.delivered_lines ?? 0],
      ["Pending KYC", dashboard.pending_kyc_reviews.length],
      ["Low Stock", dashboard.stock_status.summary.low_stock_count],
      ["Out of Stock", dashboard.stock_status.summary.out_of_stock_count],
      ["In Stock", dashboard.stock_status.summary.in_stock_count],
      ["Support Contacts", dashboard.top_contacts.length],
    ];

    const csv = rows
      .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dashboard-export-${activeRole}-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    window.setTimeout(() => setIsExporting(false), 700);
  }, [dashboard, isExporting, portalName, warehouseName, warehouseCode, isWarehouseMode, activeRole]);

  // ===================================================
  // LOADING
  // ===================================================

  if (permissionsLoading || (isLoading && !dashboard)) {
    return <DashboardSkeleton role={activeRole} />;
  }

  if (!dashboard) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#F4F8FD]">
        <div className="rounded-[20px] border border-[#DCE6F2] bg-white p-8 text-center shadow-xl">
          <FiAlertCircle size={28} className={`mx-auto ${theme.classes.primaryText}`} />
          <h2 className="mt-3 text-lg font-bold text-[#111827]">Unable to load dashboard</h2>
          <button
            type="button"
            onClick={() => void fetchDashboard()}
            className={`mt-4 rounded-xl px-4 py-2 text-xs font-bold transition hover:opacity-90 ${theme.classes.primaryButton}`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <div className="relative min-h-screen bg-white">
      <motion.div
        className={`min-h-screen p-3 sm:p-4 lg:p-5 ${theme.classes.pageGradient}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={refreshKey}
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 40px -25px rgba(30,58,138,0.12)",
        }}
      >
        {/* HEADER */}
        <motion.div variants={itemVariants} className="mb-5 border-b border-[#DCE6F2] pb-4 sm:pb-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: theme.primaryLight }} />
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: theme.primary }} />
                <span className="ml-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#6B7280] sm:text-[10px]">
                  {isWarehouseMode
                    ? "Warehouse Overview"
                    : activeRole === "finance"
                      ? "Finance Overview"
                      : activeRole === "sales"
                        ? "Sales Overview"
                        : activeRole === "support"
                          ? "Support Overview"
                          : "Business Overview"}
                </span>
              </div>

              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <h1 className="text-[24px] font-semibold tracking-[-0.035em] text-[#111827] sm:text-[28px]">
                  Dashboard
                </h1>
                <span
                  className="mb-1 hidden rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide sm:inline-flex"
                  style={{
                    borderColor: `${theme.primary}44`,
                    backgroundColor: theme.primaryPale,
                    color: theme.primaryDark,
                  }}
                >
                  {activeRole === "support"
                    ? "Support Role"
                    : activeRole === "sales"
                      ? "Sales Role"
                      : portalName || `${activeRole} dashboard`}
                </span>
                {warehouseName && (
                  <span
                    className="mb-1 hidden truncate rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide sm:inline-flex"
                    style={{
                      borderColor: `${theme.primary}44`,
                      backgroundColor: theme.primaryPale,
                      color: theme.primaryDark,
                    }}
                    title={`${warehouseName}${warehouseCode ? ` (${warehouseCode})` : ""}`}
                  >
                    {warehouseName}
                    {warehouseCode && ` (${warehouseCode})`}
                  </span>
                )}
              </div>

              <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#6B7280] sm:text-xs">
                {isWarehouseMode
                  ? "Monitor dispatches, stock levels and warehouse operations from one place."
                  : "Monitor sales performance, customers, operations and important business activity from one place."}
              </p>
            </div>

            <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
              <div className="hidden items-center gap-2 rounded-xl border border-[#DCE6F2] bg-white px-3 py-2.5 sm:flex">
                <motion.span
                  className="h-2 w-2 rounded-full ring-2"
                  style={{
                    background: theme.accent,
                    ["--tw-ring-color" as any]: `${theme.accent}55`,
                  }}
                  animate={{ opacity: isRefreshing ? [1, 0.3, 1] : 1 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">Live Data</div>
                  <div className="text-[8px] text-[#6B7280]">
                    {lastUpdated
                      ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      : "Fetching data..."}
                  </div>
                </div>
              </div>

              <div
                className="hidden items-center gap-2 rounded-xl border px-3 py-2.5 md:flex"
                style={{ borderColor: `${theme.primary}33`, background: theme.primaryPale }}
              >
                <motion.div
                  animate={isRefreshing ? { rotate: 360, scale: [1, 1.2, 1] } : { rotate: 0, scale: 1 }}
                  transition={
                    isRefreshing
                      ? { rotate: { repeat: Infinity, duration: 2, ease: "linear" }, scale: { repeat: Infinity, duration: 1, ease: "easeInOut" } }
                      : { duration: 0.3 }
                  }
                >
                  <FiTrendingUp size={14} style={{ color: theme.primary }} />
                </motion.div>
                <span className="text-[10px] font-bold" style={{ color: theme.primary }}>Performance</span>
              </div>

              <motion.button
                type="button"
                onClick={handleRefresh}
                whileTap={{ scale: 0.95 }}
                disabled={isRefreshing || permissionsLoading}
                className="flex h-10 items-center gap-2 rounded-xl border border-[#DCE6F2] bg-white px-3.5 text-[10px] font-bold shadow-sm transition-all hover:bg-[#F8FBFF] disabled:opacity-60"
                style={{ color: theme.primary }}
              >
                <motion.span
                  animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={isRefreshing ? { repeat: Infinity, duration: 0.75, ease: "linear" } : { duration: 0.2 }}
                  className="flex"
                >
                  <FiRefreshCw size={14} />
                </motion.span>
                <span className="hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </motion.button>

              <motion.button
                type="button"
                onClick={handleExport}
                whileTap={{ scale: 0.95 }}
                disabled={isExporting}
                className={`flex h-10 items-center gap-2 rounded-xl px-4 text-[10px] font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60 ${theme.classes.accentButton}`}
              >
                <motion.div
                  animate={
                    isExporting
                      ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }
                      : { scale: 1, opacity: 1 }
                  }
                  transition={isExporting ? { repeat: Infinity, duration: 0.8 } : {}}
                >
                  <FiDownload size={14} />
                </motion.div>
                <span>{isExporting ? "Exporting..." : "Export"}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* KPI CARDS */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {metrics.map((metric: any, index: number) => {
            const mTheme = metricTheme[metric.icon] || metricTheme.attach_money;
            return (
              <motion.div
                key={metric.label}
                variants={itemVariants}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className="group relative flex min-h-[140px] flex-col overflow-hidden rounded-[17px] border border-[#DCE6F2] bg-white px-4 py-5 shadow-[0_3px_14px_rgba(45,111,232,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#4F8FF7]/30 hover:shadow-[0_10px_24px_rgba(45,111,232,0.10)]"
              >
                <div className={`absolute bottom-0 left-0 top-0 w-[3px] ${mTheme.bar}`} />
                <div className="pointer-events-none absolute inset-0 rounded-[17px] bg-gradient-to-br from-[#4F8FF7]/[0.04] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#6B7280] transition-colors duration-300 group-hover:text-[#4F8FF7]">
                      {metric.label}
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                      className="mt-2 truncate text-[26px] font-bold leading-none tracking-[-0.03em] text-[#111827]"
                    >
                      {metric.value}
                    </motion.div>
                  </div>

                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${mTheme.tile} ${mTheme.iconColor} transition-transform duration-300 group-hover:scale-105`}
                  >
                    <MetricIcon name={metric.icon} className="h-[16px] w-[16px]" />
                  </div>
                </div>

                <div className={`relative mt-auto flex items-center text-[10px] font-bold ${metric.toneClass || theme.classes.primaryText}`}>
                  <TrendIcon name={metric.trendIcon} className="h-2.5 w-2.5" />
                  <span className="ml-1.5">{metric.change}</span>
                  {metric.note && (
                    <span className="ml-1.5 truncate font-normal text-[#6B7280]">{metric.note}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* MAIN ANALYTICS */}
        <motion.div
          variants={containerVariants}
          className={`mt-5 grid grid-cols-1 gap-5 ${isWarehouseMode ? "xl:grid-cols-1" : "xl:grid-cols-3"}`}
        >
          {/* SALES / DISPATCH CHART */}
          <motion.div
            variants={itemVariants}
            className={`relative overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white p-4 shadow-[0_3px_16px_rgba(45,111,232,0.05)] sm:p-5 ${isWarehouseMode ? "" : "xl:col-span-2"}`}
          >
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[16px] font-semibold text-[#111827] sm:text-[17px]">
                    {isWarehouseMode ? "Dispatch Analytics" : "Sales Analytics"}
                  </h2>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em]"
                    style={{
                      background: theme.primaryPale,
                      color: theme.primary,
                      boxShadow: `inset 0 0 0 1px ${theme.primary}22`,
                    }}
                  >
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: theme.primary }}
                      animate={{ opacity: isRefreshing ? [1, 0.3, 1] : 1 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    Live
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-[#6B7280]">
                  {isWarehouseMode
                    ? "Daily dispatch activity and period performance"
                    : salesPeriod === "this_month"
                      ? "Weekly sales activity and monthly performance"
                      : "Daily sales activity and period performance"}
                </p>
              </div>

              <select
                value={salesPeriod}
                onChange={(e) => setSalesPeriod(e.target.value as SalesPeriodType)}
                className="h-9 cursor-pointer rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] px-3 text-[10px] font-semibold text-[#111827] outline-none transition focus:ring-2"
              >
                <option value="this_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="this_month">This Month</option>
              </select>
            </div>

            <div className="mt-2 h-[300px] w-full overflow-hidden rounded-[15px] border border-[#DCE6F2] bg-[#F8FBFF]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={barData}
                  barCategoryGap="20%"
                  margin={{ top: 30, right: 12, left: 0, bottom: 2 }}
                >
                  <defs>
                    <linearGradient id="salesPrimaryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.gradients.barPrimaryFrom} />
                      <stop offset="100%" stopColor={theme.gradients.barPrimaryTo} />
                    </linearGradient>
                    <linearGradient id="salesAccentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.gradients.barAccentFrom} />
                      <stop offset="100%" stopColor={theme.gradients.barAccentTo} />
                    </linearGradient>
                    <linearGradient id="salesSoftGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.gradients.barSoftFrom} />
                      <stop offset="100%" stopColor={theme.gradients.barSoftTo} />
                    </linearGradient>
                    <linearGradient id="salesLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={theme.gradients.lineFrom} />
                      <stop offset="45%" stopColor={theme.gradients.lineMid} />
                      <stop offset="100%" stopColor={theme.gradients.lineTo} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid vertical horizontal stroke="#DCE6F2" strokeWidth={1} strokeDasharray="0" opacity={0.8} />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={10} axisLine={false} tickLine={false} dy={8} />
                  <YAxis
                    stroke="#6B7280"
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                    tickFormatter={(value) =>
                      `₹${Number(value) >= 1000 ? `${(Number(value) / 1000).toFixed(0)}k` : value}`
                    }
                  />
                  <Tooltip
                    cursor={{ fill: `${theme.primary}0D` }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: `1px solid ${theme.primary}22`,
                      borderRadius: "12px",
                      fontSize: "10px",
                      boxShadow: `0 12px 30px ${theme.primary}1A`,
                    }}
                    labelStyle={{ color: "#111827", fontWeight: 700 }}
                    formatter={(value: any, name: any) => {
                      if (name === "Orders") return [Number(value || 0), "Orders"];
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
                        color: theme.primary,
                      },
                    ]}
                    wrapperStyle={{ fontSize: "9px", color: "#6B7280", paddingBottom: "16px" }}
                  />
                  <Bar dataKey="value" name="Revenue" radius={[8, 8, 3, 3]} barSize={30}>
                    {barData.map((_entry, index) => {
                      const palette = [
                        "url(#salesPrimaryGrad)",
                        "url(#salesAccentGrad)",
                        "url(#salesSoftGrad)",
                      ];
                      return <Cell key={`sales-${index}`} fill={palette[index % 3]} />;
                    })}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="lineValue"
                    name="Sales trend"
                    stroke="url(#salesLineGradient)"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={<SalesLineDot theme={theme} />}
                    activeDot={{
                      r: 7,
                      fill: "#ffffff",
                      stroke: theme.primaryDark,
                      strokeWidth: 2.5,
                    }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 border-t border-[#DCE6F2] pt-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: theme.primary }} />
                <span className="text-[9px] text-[#6B7280]">Revenue: {formatCurrency(currentSalesSummary.revenue)}</span>
              </div>
              <div className="h-3 w-px bg-[#DCE6F2]" />
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: theme.accent }} />
                <span className="text-[9px] text-[#6B7280]">Orders: {formatNumber(currentSalesSummary.orders)}</span>
              </div>
              <div className="h-3 w-px bg-[#DCE6F2]" />
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: theme.primaryLight }} />
                <span className="text-[9px] text-[#6B7280]">Updated automatically</span>
              </div>
            </div>
          </motion.div>

          {/* TOP CATEGORIES — ADMIN ONLY */}
          {!isWarehouseMode && (
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white p-4 shadow-[0_3px_16px_rgba(45,111,232,0.05)] sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#111827] sm:text-[16px]">
                      Top Categories
                    </h3>
                    <span className={theme.classes.accentChip + " rounded-full px-2 py-1 text-[7px] font-bold uppercase tracking-[0.1em]"}>
                      Live
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-[#6B7280]">
                    Product distribution by category
                  </p>
                </div>
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
                          fill={theme.pieColors[index % theme.pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #DCE6F2",
                        borderRadius: "12px",
                        fontSize: "10px",
                        boxShadow: `0 12px 30px ${theme.primary}1F`,
                      }}
                      labelStyle={{ color: "#111827", fontWeight: 700 }}
                      formatter={(value: any) => [`${Number(value || 0)} Products`, "Count"]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-2">
                  <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#6B7280]">
                    Top 3 Total
                  </span>
                  <motion.span
                    animate={isRefreshing ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={isRefreshing ? { duration: 0.6, ease: "easeInOut" } : {}}
                    className="mt-1 text-[25px] font-extrabold leading-none tracking-[-0.04em] text-[#111827]"
                  >
                    {formatNumber(pieTotal)}
                  </motion.span>
                  <span className="mt-1 text-[8px] font-medium text-[#6B7280]">Products</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-[#DCE6F2] pt-3">
                {pieData.map((item, index) => {
                  const percentage =
                    pieTotal > 0 ? Math.round((Number(item.value || 0) / pieTotal) * 100) : 0;
                  const dotColor = theme.pieColors[index % theme.pieColors.length];
                  return (
                    <motion.div
                      key={`${item.name}-${index}`}
                      whileHover={{ x: 2 }}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dotColor }} />
                        <span className="truncate text-[10px] font-semibold text-[#111827]">{item.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[10px] font-bold text-[#111827]">{formatNumber(item.value)}</span>
                        <span className="min-w-[34px] text-right text-[9px] font-medium text-[#6B7280]">
                          {percentage}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
                {pieData.length === 0 && (
                  <div className="rounded-xl bg-[#F8FBFF] p-4 text-center text-[10px] text-[#6B7280]">
                    No category data available.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* LOWER CONTENT — only renders if there's something visible.
            "No modules available" block has been completely removed. */}
        {hasLowerContent && (
          <motion.div
            variants={containerVariants}
            className={`mt-5 grid grid-cols-1 gap-5 ${
              hasLowerLeftContent && hasLowerRightContent
                ? isWarehouseMode
                  ? "xl:grid-cols-2"
                  : "xl:grid-cols-3"
                : "xl:grid-cols-1"
            }`}
          >
            {/* LEFT COLUMN */}
            {hasLowerLeftContent && (
              <motion.div
                variants={itemVariants}
                className={`space-y-5 ${
                  hasLowerLeftContent && hasLowerRightContent && !isWarehouseMode
                    ? "xl:col-span-2"
                    : ""
                }`}
              >
                {/* KYC — ADMIN ONLY */}
                {showKycPanel && (
                  <Panel
                    tone="blue"
                    theme={theme}
                    icon={<FiCheckCircle size={19} />}
                    title="Pending KYC reviews"
                    subtitle="Applications waiting for review"
                    badge={<CountBadge count={totalPending} label="pending" tone="blue" theme={theme} />}
                    footer={
                      totalPending > 4 ? (
                        <span className="text-[11px] text-[#6B7280]">
                          Showing 4 of {totalPending} applications
                        </span>
                      ) : undefined
                    }
                  >
                    <div className="space-y-2.5">
                      {kycReviews.slice(0, 4).map((review, idx) => {
                        const waited = daysWaiting(review.created_at);
                        const urgent = waited >= 7;
                        return (
                          <motion.div
                            key={review.id}
                            whileHover={{ x: 3 }}
                            animate={isRefreshing ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
                            transition={isRefreshing ? { duration: 0.4, delay: idx * 0.06 } : {}}
                            className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white py-3 pl-5 pr-3 transition hover:shadow-[0_8px_20px_-10px_rgba(45,111,232,0.35)]"
                          >
                            <span
                              className="absolute inset-y-0 left-0 w-1"
                              style={{ background: urgent ? theme.danger : theme.primary }}
                            />
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[14px] font-medium shadow ring-2 ring-white ${
                                  theme.avatarTones[idx % theme.avatarTones.length]
                                }`}
                              >
                                {String(review.user_name || "?").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-[13px] font-bold text-[#111827]">{review.user_name}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#6B7280]">
                                  <span className="inline-flex items-center gap-1">
                                    <FiClock size={11} />
                                    Submitted {formatDate(review.created_at)}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                      urgent ? "bg-[#FEF2F2] text-[#C23B32]" : theme.classes.primaryChip
                                    }`}
                                  >
                                    {waited === 0 ? "Today" : `Waiting ${waited}d`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleReview(review)}
                              className="flex shrink-0 items-center gap-1 rounded-xl px-3.5 py-2 text-[11px] font-bold text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                              style={{ background: theme.primary }}
                            >
                              Review <FiChevronRight size={12} />
                            </button>
                          </motion.div>
                        );
                      })}
                      {kycReviews.length === 0 && (
                        <EmptyState
                          icon={<FiCheckCircle size={18} />}
                          title="All caught up"
                          hint="No KYC applications are waiting for review."
                          theme={theme}
                        />
                      )}
                    </div>
                  </Panel>
                )}

                {/* INVENTORY */}
                {showInventoryPanel && (
                  <Panel
                    tone="yellow"
                    theme={theme}
                    icon={<FiPackage size={19} />}
                    title="Inventory alerts"
                    subtitle={
                      isWarehouseMode ? "Warehouse products requiring attention" : "Products requiring attention"
                    }
                    badge={<CountBadge count={totalAlerts} label="alerts" tone="yellow" theme={theme} />}
                  >
                    <div className="space-y-2.5">
                      {inventoryAlerts.slice(0, 5).map((item: any, idx: number) => {
                        const qty = stockNumber(item);
                        const out = item.alertType === "Out of Stock" || qty === 0;
                        const pct = out ? 0 : Math.min(100, Math.round((qty / 20) * 100));
                        return (
                          <motion.div
                            key={`${getInventoryName(item)}-${idx}`}
                            whileHover={{ x: 3 }}
                            animate={isRefreshing ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
                            transition={isRefreshing ? { duration: 0.4, delay: idx * 0.05 } : {}}
                            className="flex items-center gap-3 rounded-2xl border border-[#DCE6F2] bg-white p-3 transition hover:shadow-[0_8px_20px_-10px_rgba(45,111,232,0.35)]"
                          >
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                out
                                  ? "bg-[#FEF2F2] text-[#C23B32]"
                                  : `${theme.classes.accentTile} ${theme.classes.accentText}`
                              }`}
                            >
                              <FiAlertCircle size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="truncate text-[13px] font-bold text-[#111827]">
                                  {getInventoryName(item)}
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                    out ? "bg-[#FEF2F2] text-[#C23B32]" : theme.classes.accentChip
                                  }`}
                                >
                                  {out ? "Out of stock" : "Low stock"}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-3">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF2F7]">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.7, delay: idx * 0.06 }}
                                    className={`h-full rounded-full ${out ? "bg-[#C23B32]" : theme.classes.accentBar}`}
                                  />
                                </div>
                                <span className="shrink-0 text-[11px] font-semibold text-[#374151]">
                                  {qty} {qty === 1 ? "unit" : "units"} left
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                      {inventoryAlerts.length === 0 && (
                        <EmptyState
                          icon={<FiPackage size={18} />}
                          title="Stock looks healthy"
                          hint="No products are low or out of stock."
                          theme={theme}
                        />
                      )}
                    </div>
                  </Panel>
                )}
              </motion.div>
            )}

            {/* RIGHT COLUMN */}
            {hasLowerRightContent && (
              <motion.div
                variants={itemVariants}
                className={hasLowerLeftContent && hasLowerRightContent ? "" : ""}
              >
                {showWarehouseActivity ? (
                  <Panel
                    tone="blue"
                    theme={theme}
                    icon={<FiActivity size={19} />}
                    title="Recent warehouse activity"
                    subtitle="Latest dispatch lines"
                    badge={
                      <CountBadge
                        count={dashboard.warehouse?.order_lines?.pending_dispatch_lines ?? 0}
                        label="pending"
                        tone="blue"
                        theme={theme}
                      />
                    }
                    footer={
                      <Link to="/warehouse" className="block">
                        <span
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-bold text-white transition hover:opacity-90"
                          style={{ background: theme.primary }}
                        >
                          View all lines <FiChevronRight size={13} />
                        </span>
                      </Link>
                    }
                  >
                    <div className="space-y-2.5">
                      {warehouseRecentLines.slice(0, 5).map((line) => (
                        <motion.div
                          key={line.id}
                          whileHover={{ x: 3 }}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-[#DCE6F2] bg-white p-3 transition hover:shadow-[0_8px_20px_-10px_rgba(45,111,232,0.35)]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                              style={{ background: theme.primaryPale, color: theme.primary }}
                            >
                              <FiTruckIcon size={15} />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-[12px] font-bold text-[#111827]">{line.product_name}</div>
                              <div className="mt-0.5 text-[10px] text-[#6B7280]">
                                {line.item_reference_id} · Qty {line.quantity}
                              </div>
                            </div>
                          </div>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize"
                            style={{ background: theme.primaryPale, color: theme.primary }}
                          >
                            {line.delivery_status.replace(/_/g, " ")}
                          </span>
                        </motion.div>
                      ))}
                      {warehouseRecentLines.length === 0 && (
                        <EmptyState
                          icon={<FiInbox size={18} />}
                          title="No recent lines"
                          hint="Warehouse activity will appear here."
                          theme={theme}
                        />
                      )}
                    </div>
                  </Panel>
                ) : (
                  showSupportPanel && (
                    <Panel
                      tone="blue"
                      theme={theme}
                      icon={<FiActivity size={19} />}
                      title="Contact requests"
                      subtitle="Latest customer support activity"
                      badge={<CountBadge count={totalTickets} label="open" tone="blue" theme={theme} />}
                      footer={
                        <Link to="/contact" className="block">
                          <span
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-bold text-white transition hover:opacity-90"
                            style={{ background: theme.primary }}
                          >
                            View all requests <FiChevronRight size={13} />
                          </span>
                        </Link>
                      }
                    >
                      <div className="space-y-2.5">
                        {tickets.slice(0, 5).map((ticket, idx) => {
                          const { category, body } = splitCategory(ticket.message);
                          const unread = !ticket.is_read;
                          return (
                            <motion.div
                              key={ticket.id}
                              whileHover={{ x: 3 }}
                              className={`relative rounded-2xl border p-3.5 transition hover:shadow-[0_8px_20px_-10px_rgba(45,111,232,0.35)] ${
                                unread ? "bg-[#F5F9FF]" : "bg-white"
                              }`}
                              style={{ borderColor: unread ? `${theme.primary}66` : undefined }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[12px] font-extrabold ${
                                      theme.avatarTones[idx % theme.avatarTones.length]
                                    }`}
                                  >
                                    {String(ticket.name || "?").charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      {unread && (
                                        <span
                                          className="h-2 w-2 shrink-0 rounded-full ring-2"
                                          style={{
                                            background: theme.primary,
                                            ["--tw-ring-color" as any]: `${theme.primary}33`,
                                          }}
                                        />
                                      )}
                                      <span className="truncate text-[12px] font-bold text-[#111827]">{ticket.name}</span>
                                    </div>
                                    <div className="text-[10px] text-[#6B7280]">
                                      {formatDate(ticket.created_at)} · {getRelativeTime(ticket.created_at)}
                                    </div>
                                  </div>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    unread ? theme.classes.accentChip : "bg-[#F3F6FB] text-[#6B7280]"
                                  }`}
                                >
                                  {unread ? "Unread" : "Read"}
                                </span>
                              </div>
                              <div className="mt-2.5 flex items-start gap-2">
                                <span
                                  className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                                  style={{ background: theme.primaryPale, color: theme.primaryDark }}
                                >
                                  <FiMail size={10} />
                                  {category}
                                </span>
                                <p className="line-clamp-2 text-[12px] leading-5 text-[#374151]">{body}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                        {tickets.length === 0 && (
                          <EmptyState
                            icon={<FiInbox size={18} />}
                            title="Inbox is empty"
                            hint="New contact requests will show up here."
                            theme={theme}
                          />
                        )}
                      </div>
                    </Panel>
                  )
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* BOTTOM SUMMARY */}
        {summaryItems.length > 0 && (
          <motion.div
            variants={containerVariants}
            className={`mt-5 grid grid-cols-1 gap-3 ${
              summaryItems.length === 1
                ? "sm:grid-cols-1"
                : summaryItems.length === 2
                  ? "sm:grid-cols-2"
                  : "sm:grid-cols-3"
            }`}
          >
            {summaryItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                  animate={isRefreshing ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                  transition={isRefreshing ? { duration: 0.4, delay: idx * 0.08 } : {}}
                  className="relative flex items-center justify-between overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white px-5 py-4 shadow-[0_4px_16px_rgba(45,111,232,0.06)]"
                >
                  <span className={`absolute inset-y-0 left-0 w-1.5 ${item.bar}`} />
                  <div className="flex items-center gap-3.5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.tile}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#111827]">{item.title}</div>
                      <div className="mt-0.5 text-[11px] text-[#6B7280]">{item.subtitle}</div>
                    </div>
                  </div>
                  <motion.div
                    animate={isRefreshing ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={isRefreshing ? { duration: 0.4, delay: idx * 0.08 } : {}}
                    className="text-[26px] font-semibold leading-none tracking-tight text-[#111827]"
                  >
                    {item.value}
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        <div className="h-3" />
      </motion.div>
    </div>
  );
};

export default Dashboard;