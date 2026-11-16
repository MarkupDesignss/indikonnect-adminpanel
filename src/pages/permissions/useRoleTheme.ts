// src/pages/permissions/useRoleTheme.ts
//
// SINGLE SOURCE OF TRUTH for role-based sidebar/dashboard theme.
// MainLayout + Dashboard pages dono yahan se theme lete hain.

import { useMemo } from "react";

import { usePortalInfo } from "./usePortalInfo";
import { usePermissions } from "./usePermissions";

// =====================================================
// TYPES
// =====================================================

export type SidebarRole =
  | "super-admin"
  | "admin"
  | "sales"
  | "warehouse"
  | "finance"
  | "support"
  | "default";

export interface SidebarTheme {
  primary: string;
  light: string;
  mid: string;
  dark: string;
  pale: string;
  soft: string;
  border: string;
  gradient: string;
  accent: string;
  label: string;
}

// =====================================================
// THEMES
// =====================================================

const SIDEBAR_THEMES: Record<SidebarRole, SidebarTheme> = {
  // Teal + Mint Green — Super Admin (Screenshot Match)
  "super-admin": {
    primary: "#0FA3A3",       // Deep Teal (Export button text/base)
    light: "#2CC2B8",         // Mid Teal
    mid: "#6FE0D6",           // Light Teal
    dark: "#0B7C7C",          // Dark Teal for text
    pale: "#E6FBFA",          // Very Light Mint
    soft: "#F0FDF4",          // Mint White
    border: "#CDEFEA",        // Mint Border
    gradient: "linear-gradient(135deg, #2CC2B8, #0FA3A3)", // Export Button Gradient
    accent: "#10B981",        // Emerald Accent (for dots)
    label: "Super Admin",
  },
  admin: {
    primary: "#2D6FE8",
    light: "#5A95F6",
    mid: "#8BB7FF",
    dark: "#1E5AD1",
    pale: "#EAF3FF",
    soft: "#F2F7FC",
    border: "#D7E7FF",
    gradient: "linear-gradient(135deg,#2D6FE8,#5A95F6)",
    accent: "#7C3AED",
    label: "Admin Portal",
  },
  sales: {
    primary: "#7C3AED",
    light: "#A78BFA",
    mid: "#C4B5FD",
    dark: "#5B21B6",
    pale: "#F3E8FF",
    soft: "#FAF5FF",
    border: "#E9D5FF",
    gradient: "linear-gradient(135deg,#7C3AED,#EC4899)",
    accent: "#F59E0B",
    label: "Sales Workspace",
  },
  warehouse: {
    primary: "#0FA3A3",
    light: "#2CC2B8",
    mid: "#6FE0D6",
    dark: "#0B7C7C",
    pale: "#E6FBFA",
    soft: "#F2FCFB",
    border: "#CDEFEA",
    gradient: "linear-gradient(135deg,#0FA3A3,#22C55E)",
    accent: "#F97316",
    label: "Warehouse Portal",
  },
  finance: {
    primary: "#15803D",
    light: "#4ADE80",
    mid: "#86EFAC",
    dark: "#166534",
    pale: "#DCFCE7",
    soft: "#F0FDF4",
    border: "#CDEBD5",
    gradient: "linear-gradient(135deg,#15803D,#10B981)",
    accent: "#0EA5E9",
    label: "Finance Portal",
  },
  support: {
    primary: "#0891B2",
    light: "#22D3EE",
    mid: "#67E8F9",
    dark: "#0E7490",
    pale: "#CFFAFE",
    soft: "#ECFEFF",
    border: "#CBEFF5",
    gradient: "linear-gradient(135deg,#0891B2,#6366F1)",
    accent: "#F43F5E",
    label: "Support Workspace",
  },
  default: {
    primary: "#6366F1",
    light: "#818CF8",
    mid: "#A5B4FC",
    dark: "#4338CA",
    pale: "#EEF0FF",
    soft: "#F7F7FF",
    border: "#E4E7F5",
    gradient: "linear-gradient(135deg,#6366F1,#8B5CF6)",
    accent: "#EC4899",
    label: "Portal",
  },
};

// =====================================================
// DETECTION (priority order)
// =====================================================

const ROLE_PRIORITY: Array<[SidebarRole, RegExp]> = [
  ["super-admin", /super[-_ ]?admin/],
  ["warehouse", /warehouse|wh\b|inventory/],
  ["finance", /finance|fiance|account|billing|payout/],
  ["sales", /sales|seller|vendor/],
  ["support", /support|helpdesk|ticket/],
  ["admin", /admin|manager/],
];

interface DetectRoleOptions {
  roles: any;
  portalName?: string | null;
  warehouseName?: string | null;
  pathname?: string;
  hasWarehouseAccess?: boolean;
}

export function detectRole(opts: DetectRoleOptions): SidebarRole {
  const { roles, portalName, warehouseName, pathname, hasWarehouseAccess } = opts;

  const list = Array.isArray(roles) ? roles : roles ? [roles] : [];

  const roleStr = list
    .flatMap((r: any) => {
      if (typeof r === "string") return [r];
      if (!r || typeof r !== "object") return [];
      return [r.slug, r.name, r.role, r.key, r.title].filter(Boolean);
    })
    .join(" ")
    .toLowerCase();

  // 1. Role slug match
  for (const [role, re] of ROLE_PRIORITY) {
    if (re.test(roleStr)) return role;
  }

  // 2. Portal name match
  const portal = String(portalName ?? "").toLowerCase();
  for (const [role, re] of ROLE_PRIORITY) {
    if (re.test(portal)) return role;
  }

  // 3. Pathname fallback
  const path = String(pathname ?? "").toLowerCase();
  for (const [role, re] of ROLE_PRIORITY) {
    if (re.test(path)) return role;
  }

  // 4. Warehouse presence + access
  if (warehouseName && hasWarehouseAccess) return "warehouse";

  return "default";
}

// =====================================================
// HOOK
// =====================================================

export function useRoleTheme() {
  const permissions = (usePermissions() as any) ?? {};
  const roles = permissions.roles ?? [];
  const { portalName, warehouseName } = usePortalInfo();

  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";

  const role = useMemo<SidebarRole>(
    () =>
      detectRole({
        roles,
        portalName,
        warehouseName,
        pathname,
        hasWarehouseAccess: false,
      }),
    [roles, portalName, warehouseName, pathname],
  );

  const theme = SIDEBAR_THEMES[role];

  const cssVars = useMemo(
    () =>
      ({
        "--portal-primary": theme.primary,
        "--portal-light": theme.light,
        "--portal-mid": theme.mid,
        "--portal-dark": theme.dark,
        "--portal-pale": theme.pale,
        "--portal-soft": theme.soft,
        "--portal-border": theme.border,
        "--portal-gradient": theme.gradient,
        "--portal-accent": theme.accent,
        "--portal-label": theme.label,
      }) as React.CSSProperties,
    [theme],
  );

  return { role, theme, cssVars };
}

export default useRoleTheme;