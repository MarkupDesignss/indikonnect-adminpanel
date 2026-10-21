// src/layouts/MainLayout.tsx

import {
  Outlet,
  NavLink,
  useLocation,
} from "react-router-dom";

import { useMenuItemsState } from "../../pages/permissions/useMenuItems";
import { usePortalInfo } from "../../pages/permissions/usePortalInfo";
import { usePermissions } from "../../pages/permissions/usePermissions";

import Header from "./Header";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";

import type {
  CSSProperties,
  ReactNode,
  RefObject,
} from "react";

import { adminApi } from "../../api/endpoints/Auth";
import logoApi from "../../api/endpoints/logoApi";
import { FiX, FiLogOut } from "react-icons/fi";
import { getPortalLoginUrl } from "../../config/portalConfig";

// =====================================================
// DEFAULT LOGO FALLBACK
// =====================================================

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";


interface NavGroup {
  key: string;
  label: string;
  match: string[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: "overview",
    label: "Overview",
    match: ["dashboard", "home", "overview"],
  },
  {
    key: "operations",
    label: "Operations",
    match: [
      "inbound",
      "outbound",
      "order",
      "grn",
      "receiving",
      "dispatch",
      "shipment",
      "pick",
      "pack",
      "putaway",
      "transfer",
      "return",
      "asn",
      "dock",
      "gate",
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    match: [
      "inventory",
      "stock",
      "product",
      "item",
      "sku",
      "catalog",
      "location",
      "bin",
      "warehouse",
    ],
  },
  {
    key: "finance",
    label: "Finance",
    match: [
      "finance",
      "fiance",
      "billing",
      "invoice",
      "payment",
      "payout",
      "account",
      "ledger",
      "expense",
      "revenue",
      "tax",
      "gst",
      "financial",
      "credit",
      "refund",
      "buyback",
      "cooloff",
    ],
  },
  {
    key: "sales",
    label: "Sales",
    match: ["sales"],
  },
  {
    key: "content",
    label: "Content",
    match: [
      "blog",
      "cms",
      "content",
      "faq",
      "reels",
      "testimonial",
      "landing",
      "header",
      "footer",
      "notification",
    ],
  },
  {
    key: "admin",
    label: "Administration",
    match: [
      "user",
      "role",
      "permission",
      "setting",
      "config",
      "master",
      "vendor",
      "customer",
      "audit",
      "profile",
    ],
  },
];

const FALLBACK_GROUP: Pick<NavGroup, "key" | "label"> = {
  key: "general",
  label: "General",
};

const ACCOUNT_PATHS = [
  "/UpdateProfile",
  "/ChangePassword",
  "/SettingsManagement",
];

// =====================================================
// ROLE-BASED SIDEBAR COLORS
// =====================================================

type SidebarRole = "admin" | "sales" | "warehouse" | "finance" | "support" | "default";

interface SidebarTheme {
  primary: string;
  light: string;
  mid: string;
  dark: string;
  pale: string;
  soft: string;
  border: string;
}

const SIDEBAR_THEMES: Record<SidebarRole, SidebarTheme> = {
  admin: {
    primary: "#2D6FE8",
    light: "#5A95F6",
    mid: "#8BB7FF",
    dark: "#1E5AD1",
    pale: "#EAF3FF",
    soft: "#F2F7FC",
    border: "#D7E7FF",
  },
  sales: {
    primary: "#7C3AED",
    light: "#A78BFA",
    mid: "#C4B5FD",
    dark: "#5B21B6",
    pale: "#F3E8FF",
    soft: "#FAF5FF",
    border: "#E9D5FF",
  },
  warehouse: {
    primary: "#0FA3A3",
    light: "#2CC2B8",
    mid: "#6FE0D6",
    dark: "#0B7C7C",
    pale: "#E6FBFA",
    soft: "#F2FCFB",
    border: "#CDEFEA",
  },
  finance: {
    primary: "#15803D",
    light: "#4ADE80",
    mid: "#86EFAC",
    dark: "#166534",
    pale: "#DCFCE7",
    soft: "#F0FDF4",
    border: "#CDEBD5",
  },
  support: {
    primary: "#0891B2",
    light: "#22D3EE",
    mid: "#67E8F9",
    dark: "#0E7490",
    pale: "#CFFAFE",
    soft: "#ECFEFF",
    border: "#CBEFF5",
  },
  default: {
    primary: "#6366F1",
    light: "#818CF8",
    mid: "#A5B4FC",
    dark: "#4338CA",
    pale: "#EEF0FF",
    soft: "#F7F7FF",
    border: "#E4E7F5",
  },
};

const getRoleNames = (roles: any): string => {
  const list = Array.isArray(roles) ? roles : roles ? [roles] : [];
  return list
    .flatMap((role: any) => {
      if (typeof role === "string") return [role];
      if (!role || typeof role !== "object") return [];
      return [role.name, role.slug, role.role, role.key, role.title].filter(Boolean);
    })
    .join(" ")
    .toLowerCase();
};

// =====================================================
// MENU SIGNATURE
// =====================================================

const getMenuSignature = (items: any[]): string => {
  return JSON.stringify(
    items.map((item) => ({
      path: item?.path ?? "",
      label: item?.label ?? "",
      icon: item?.icon ?? "",
      group: item?.group ?? "",
      children: Array.isArray(item?.children)
        ? getMenuSignature(item.children)
        : "",
    })),
  );
};

const resolveGroupKey = (item: any): string => {
  if (item?.group && typeof item.group === "string") {
    return item.group.toLowerCase();
  }

  const haystack =
    `${item?.path ?? ""} ${item?.label ?? ""}`.toLowerCase();

  const found = NAV_GROUPS.find((group) =>
    group.match.some((match) => haystack.includes(match)),
  );

  return found ? found.key : FALLBACK_GROUP.key;
};

interface GroupedMenu {
  key: string;
  label: string;
  items: any[];
}

const groupMenuItems = (items: any[]): GroupedMenu[] => {
  const buckets = new Map<string, any[]>();

  items.forEach((item) => {
    const key = resolveGroupKey(item);

    if (!buckets.has(key)) {
      buckets.set(key, []);
    }

    buckets.get(key)!.push(item);
  });

  const result: GroupedMenu[] = [];

  NAV_GROUPS.forEach((group) => {
    const list = buckets.get(group.key);

    if (list?.length) {
      result.push({
        key: group.key,
        label: group.label,
        items: list,
      });

      buckets.delete(group.key);
    }
  });

  buckets.forEach((list, key) => {
    const label =
      key === FALLBACK_GROUP.key
        ? FALLBACK_GROUP.label
        : key.charAt(0).toUpperCase() + key.slice(1);

    result.push({
      key,
      label,
      items: list,
    });
  });

  return result;
};

// =====================================================
// TYPES
// =====================================================

interface SidebarContentProps {
  isSidebarOpen: boolean;
  isMobile: boolean;
  isSidebarLoading: boolean;
  navContent: ReactNode;
  navRef?: RefObject<HTMLDivElement | null>;
  onLogout: () => void;
  isLoggingOut: boolean;
  accountItems: any[];
  portalLabel: string;
  logoUrl: string;
  renderNavItem: (
    item: any,
    depth?: number,
    isMobile?: boolean,
  ) => ReactNode;
}

// =====================================================
// SKELETON LINE
// =====================================================

const SkeletonLine = ({
  className = "",
}: {
  className?: string;
}) => (
  <div
    className={`
      animate-pulse
      rounded-md
      bg-[#E8EFF8]
      ${className}
    `}
  />
);

// =====================================================
// SIDEBAR SKELETON
// =====================================================

const SidebarSkeleton = ({
  isMobile,
  showLabels,
  navRef,
  warehouseName,
  logoUrl,
}: {
  isMobile: boolean;
  showLabels: boolean;
  navRef?: RefObject<HTMLDivElement | null>;
  warehouseName?: string;
  logoUrl: string;
}) => {
  const sections = showLabels ? 5 : 7;

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      aria-busy="true"
      aria-label="Loading sidebar"
    >
      {/* BRAND SKELETON */}
      <div
        className={`
          mb-4
          flex
          flex-shrink-0
          items-center
          gap-3
          ${showLabels ? "px-1" : "justify-center"}
        `}
      >
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[var(--portal-primary)]/10 bg-white p-1.5">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-full w-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_LOGO_URL;
            }}
          />
        </div>

        {showLabels && (
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine className="h-4 w-32" />
            <SkeletonLine className="h-2.5 w-24" />
          </div>
        )}
      </div>

      {/* WAREHOUSE SKELETON */}
      {showLabels && (
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--portal-primary)]/10 bg-[var(--portal-soft)] px-3 py-3">
            <SkeletonLine className="h-8 w-8 flex-shrink-0 rounded-lg" />

            <div className="min-w-0 flex-1 space-y-2">
              {warehouseName ? (
                <>
                  <p className="truncate text-[12px] font-semibold text-[var(--portal-dark)]">
                    {warehouseName}
                  </p>

                  <SkeletonLine className="h-2.5 w-20" />
                </>
              ) : (
                <>
                  <SkeletonLine className="h-3 w-28" />
                  <SkeletonLine className="h-2.5 w-16" />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {!showLabels && (
        <div className="relative mb-3 h-px w-full flex-shrink-0 bg-[var(--portal-primary)]/10" />
      )}

      {/* NAVIGATION SKELETON */}
      <div
        ref={navRef}
        className={`
          relative
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
          overscroll-contain
          px-0.5
          py-1
          ${isMobile ? "pb-8" : ""}
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-[var(--portal-primary)]/20
          [&::-webkit-scrollbar-track]:bg-transparent
        `}
      >
        <span className="sr-only">
          Loading navigation menu...
        </span>

        {Array.from({ length: sections }).map((_, sectionIndex) => (
          <section
            key={`sidebar-skeleton-section-${sectionIndex}`}
            className={
              sectionIndex === 0
                ? ""
                : showLabels
                  ? "mt-3"
                  : "mt-2"
            }
          >
            {showLabels ? (
              <div className="mb-1 flex items-center gap-2 px-2.5">
                <SkeletonLine
                  className={`h-2.5 ${
                    sectionIndex % 2 === 0 ? "w-20" : "w-24"
                  }`}
                />

                <SkeletonLine className="h-px flex-1" />
              </div>
            ) : sectionIndex !== 0 ? (
              <div className="mx-auto mb-2 h-px w-8 bg-[var(--portal-primary)]/10" />
            ) : null}

            <div className="space-y-0.5">
              {Array.from({
                length: showLabels
                  ? sectionIndex === 0
                    ? 3
                    : 2
                  : 2,
              }).map((__, itemIndex) => (
                <div
                  key={`sidebar-skeleton-item-${sectionIndex}-${itemIndex}`}
                  className={`
                    flex
                    items-center
                    gap-2.5
                    rounded-lg
                    ${
                      showLabels
                        ? "px-2 py-1.5"
                        : "justify-center px-0 py-1.5"
                    }
                  `}
                >
                  <SkeletonLine className="h-8 w-8 flex-shrink-0 rounded-lg" />

                  {showLabels && (
                    <SkeletonLine
                      className={`h-3 ${
                        (sectionIndex + itemIndex) % 2 === 0
                          ? "w-28"
                          : "w-20"
                      }`}
                    />
                  )}

                  {showLabels &&
                    itemIndex === 0 &&
                    sectionIndex === 1 && (
                      <SkeletonLine className="ml-auto h-3 w-3 rounded-full" />
                    )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* ACCOUNT SKELETON */}
        {showLabels ? (
          <div className="mt-3">
            <div className="mb-2 flex items-center gap-2 px-2.5">
              <SkeletonLine className="h-2.5 w-14" />
              <SkeletonLine className="h-px flex-1" />
            </div>

            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <SkeletonLine className="h-8 w-8 flex-shrink-0 rounded-lg" />
              <SkeletonLine className="h-3 w-20" />
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-3 h-px w-8 bg-[var(--portal-primary)]/10" />
        )}
      </div>
    </div>
  );
};

// =====================================================
// SIDEBAR CONTENT
// =====================================================

const SidebarContent = ({
  isSidebarOpen,
  isMobile,
  isSidebarLoading,
  navContent,
  navRef,
  onLogout,
  isLoggingOut,
  accountItems,
  portalLabel,
  logoUrl,
  renderNavItem,
}: SidebarContentProps) => {
  const { warehouseName, warehouseCode } = usePortalInfo();

  const showLabels = isMobile || isSidebarOpen;

  // Permissions load hone tak real sidebar render nahi hogi.
  if (isSidebarLoading) {
    return (
      <SidebarSkeleton
        isMobile={isMobile}
        showLabels={showLabels}
        navRef={navRef}
        warehouseName={warehouseName}
        logoUrl={logoUrl}
      />
    );
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-white" />

      {/* LOGO / BRAND */}
      <div
        className={`
          relative
          mb-4
          flex-shrink-0
          transition-all
          duration-300
          ${!isMobile && !isSidebarOpen ? "flex justify-center" : "px-1"}
        `}
      >
        <div
          className={`
            flex
            items-center
            gap-3
            ${!isMobile && !isSidebarOpen ? "justify-center" : ""}
          `}
        >
          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[var(--portal-primary)]/15 bg-white p-1.5 shadow-[0_4px_14px_rgba(45,111,232,0.12)]">
            <img
              src={logoUrl}
              alt="Logo"
              className="relative z-10 h-full w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_LOGO_URL;
              }}
            />
          </div>

          {showLabels && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight tracking-tight text-[#0F1B3D]">
                IndieKonnect
              </h1>

              <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-[var(--portal-primary)]">
                {portalLabel}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WAREHOUSE CHIP */}
      {showLabels && warehouseName && (
        <div className="relative mb-4 flex-shrink-0">
          <div
            className="flex items-center gap-2.5 rounded-xl border border-[var(--portal-primary)]/10 bg-[var(--portal-soft)] px-3 py-2.5"
            title={`${warehouseName}${
              warehouseCode ? ` (${warehouseCode})` : ""
            }`}
          >
            <span className="material-symbols-outlined flex-shrink-0 text-[18px] text-[var(--portal-primary)]">
              warehouse
            </span>

            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold leading-tight text-[var(--portal-dark)]">
                {warehouseName}
              </p>

              {warehouseCode && (
                <p className="mt-0.5 text-[11px] leading-tight text-[#8C97B2]">
                  {warehouseCode}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!showLabels && (
        <div className="relative mb-3 h-px w-full flex-shrink-0 bg-[var(--portal-primary)]/10" />
      )}

      {/* NAVIGATION */}
      <div
        ref={navRef}
        className={`
          relative
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
          overscroll-contain
          touch-pan-y
          px-0.5
          py-1
          ${isMobile ? "pb-8" : ""}
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-[var(--portal-primary)]/20
          [&::-webkit-scrollbar-track]:bg-transparent
        `}
      >
        {navContent}

        {/* ACCOUNT SECTION */}
        <div className="mt-3">
          {showLabels ? (
            <h2 className="mb-1 flex items-center gap-2 px-2.5 text-[11px] font-semibold tracking-wide text-[#8C97B2]">
              <span>Account</span>
              <span className="h-px flex-1 bg-[var(--portal-primary)]/10" />
            </h2>
          ) : (
            <div className="mx-auto mb-2 h-px w-8 bg-[var(--portal-primary)]/10" />
          )}

          <div>
            {accountItems.map((item) =>
              renderNavItem(item, 0, isMobile),
            )}
          </div>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            title={!showLabels ? "Logout" : undefined}
            className={`
              group
              relative
              mb-0.5
              flex
              w-full
              items-center
              gap-3
              rounded-lg
              transition-colors
              duration-200
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#E11D48]/40
              ${showLabels ? "px-2 py-1.5" : "justify-center px-0 py-1.5"}
              text-[#4A5778]
              hover:bg-[#FEF2F2]
              hover:text-[#E11D48]
              disabled:cursor-not-allowed
              disabled:opacity-60
            `}
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--portal-soft)] transition-colors duration-200 group-hover:bg-white">
              {isLoggingOut ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#E11D48] border-t-transparent" />
              ) : (
                <FiLogOut className="text-[18px] text-[#E11D48]" />
              )}
            </span>

            {showLabels && (
              <span className="truncate text-[13px] font-semibold tracking-wide">
                {isLoggingOut ? "Logging out..." : "Logout"}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

// =====================================================
// MAIN LAYOUT
// =====================================================

const MainLayout = () => {
  // Single source of truth:
  // menuItems aur loading dono same permissions hook se aate hain.
  const {
    menuItems,
    loading: isSidebarLoading,
  } = useMenuItemsState();

  const { portalName, warehouseName } = usePortalInfo();
  const { roles = [] } = usePermissions() as any;

  // =====================================================
  // LOGO FETCH
  // =====================================================

  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO_URL);

  useEffect(() => {
    let isMounted = true;

    const fetchLogo = async () => {
      try {
        const response = await logoApi.getLogo();
        const remoteLogo = response?.data?.data?.logo;

        if (isMounted && remoteLogo) {
          setLogoUrl(remoteLogo);
        }
      } catch (error) {
        console.error("Failed to fetch logo:", error);

        if (isMounted) {
          setLogoUrl(DEFAULT_LOGO_URL);
        }
      }
    };

    fetchLogo();

    return () => {
      isMounted = false;
    };
  }, []);

  const roleNames = useMemo(() => getRoleNames(roles), [roles]);
  const currentPathname = typeof window !== "undefined" ? window.location.pathname : "";
  const sidebarRole: SidebarRole = useMemo(() => {
    const portal = String(portalName || "").toLowerCase();
    const path = String(currentPathname || "").toLowerCase();

    // Specific API roles must win over the generic Admin Portal name/path.
    if (roleNames.includes("warehouse") || portal.includes("warehouse") || path.includes("indiekonnect-warehouse") || (warehouseName && !portalName)) return "warehouse";
    if (roleNames.includes("finance") || portal.includes("finance") || path.includes("indiekonnect-finance")) return "finance";
    if (roleNames.includes("sales") || portal.includes("sales") || path.includes("indiekonnect-sales")) return "sales";
    if (roleNames.includes("support") || portal.includes("support")) return "support";
    if (roleNames.includes("admin") || portal.includes("admin") || path.includes("indiekonnect-admin")) return "admin";
    return "default";
  }, [roleNames, portalName, warehouseName, currentPathname]);

  const sidebarTheme = SIDEBAR_THEMES[sidebarRole];
  const sidebarPortalLabel: string =
    sidebarRole === "support"
      ? "Support Workspace"
      : sidebarRole === "sales"
        ? "Sales Workspace"
        : sidebarRole === "warehouse"
          ? "Warehouse Portal"
          : sidebarRole === "finance"
            ? "Finance Portal"
            : portalName || "Admin Portal";

  const portalThemeStyle = {
    "--portal-primary": sidebarTheme.primary,
    "--portal-light": sidebarTheme.light,
    "--portal-mid": sidebarTheme.mid,
    "--portal-dark": sidebarTheme.dark,
    "--portal-pale": sidebarTheme.pale,
    "--portal-soft": sidebarTheme.soft,
    "--portal-border": sidebarTheme.border,
  } as CSSProperties;

  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const location = useLocation();

  // =====================================================
  // MENU SIGNATURE
  // =====================================================

  const menuSignature = useMemo(
    () => getMenuSignature(menuItems as any[]),
    [menuItems],
  );

  // =====================================================
  // ACTIVE PATH HANDLING
  // =====================================================

  const isPathActive = (path?: string) => {
    if (!path) return false;

    const current = location.pathname;

    if (current === path) return true;

    const segments = path.split("/").filter(Boolean);

    if (segments.length <= 1) return false;

    return current.startsWith(`${path}/`);
  };

  const isItemActive = (item: any): boolean => {
    if (
      Array.isArray(item.children) &&
      item.children.length > 0
    ) {
      return item.children.some((child: any) =>
        isItemActive(child),
      );
    }

    return isPathActive(item.path);
  };

  // =====================================================
  // ACCOUNT / GROUPED MENU
  // =====================================================

  const accountItems = useMemo(
    () =>
      (menuItems as any[]).filter((item) =>
        ACCOUNT_PATHS.includes(item.path),
      ),
    [menuItems],
  );

  const groupedMenu = useMemo(
    () =>
      groupMenuItems(
        (menuItems as any[]).filter(
          (item) => !ACCOUNT_PATHS.includes(item.path),
        ),
      ),
    [menuItems],
  );

  // =====================================================
  // MOBILE SCROLL
  // =====================================================

  const mobileNavRef = useRef<HTMLDivElement>(null);
  const mobileScrollTopRef = useRef(0);

  const toggleSidebar = () => {
    setIsSidebarOpen((previous) => !previous);
  };

  const toggleMobileSidebar = () => {
    if (mobileNavRef.current) {
      mobileScrollTopRef.current =
        mobileNavRef.current.scrollTop;
    }

    setIsMobileSidebarOpen((previous) => !previous);
  };

  useEffect(() => {
    if (mobileNavRef.current) {
      mobileScrollTopRef.current =
        mobileNavRef.current.scrollTop;
    }

    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // =====================================================
  // AUTOMATICALLY EXPAND ACTIVE PARENTS
  // =====================================================

  useEffect(() => {
    const parents: string[] = [];

    const walk = (items: any[]) => {
      items.forEach((item) => {
        if (
          Array.isArray(item.children) &&
          item.children.length > 0 &&
          isItemActive(item)
        ) {
          parents.push(item.path);
          walk(item.children);
        }
      });
    };

    walk(menuItems as any[]);

    if (parents.length === 0) return;

    setExpandedMenus((previous) => {
      const missing = parents.filter(
        (path) => !previous.includes(path),
      );

      return missing.length
        ? [...previous, ...missing]
        : previous;
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, menuSignature]);

  // =====================================================
  // PREVENT BACKGROUND SCROLL ON MOBILE
  // =====================================================

  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  // =====================================================
  // ESCAPE KEY
  // =====================================================

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (isLogoutModalOpen && !isLoggingOut) {
        setIsLogoutModalOpen(false);
      } else if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    isLogoutModalOpen,
    isLoggingOut,
    isMobileSidebarOpen,
  ]);

  // =====================================================
  // RESTORE MOBILE SCROLL
  // =====================================================

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const frame = requestAnimationFrame(() => {
      if (!mobileNavRef.current) return;

      mobileNavRef.current.scrollTop =
        mobileScrollTopRef.current;
    });

    return () => cancelAnimationFrame(frame);
  }, [
    isMobileSidebarOpen,
    expandedMenus,
    location.pathname,
    isSidebarLoading,
  ]);

  // =====================================================
  // TOGGLE MENU
  // =====================================================

  const toggleMenu = (path: string) => {
    if (mobileNavRef.current) {
      mobileScrollTopRef.current =
        mobileNavRef.current.scrollTop;
    }

    setExpandedMenus((previous) =>
      previous.includes(path)
        ? previous.filter((item) => item !== path)
        : [...previous, path],
    );
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const openLogoutModal = () => {
    if (isLoggingOut) return;

    setIsLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    if (isLoggingOut) return;

    setIsLogoutModalOpen(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      const loginUrl = getPortalLoginUrl();

      try {
        await adminApi.logout();
      } catch (error) {
        console.error("Logout API failed:", error);
      }

      localStorage.clear();
      sessionStorage.clear();

      document.cookie.split(";").forEach((cookie) => {
        const cookieName = cookie.split("=")[0].trim();

        if (cookieName) {
          document.cookie =
            `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });

      setIsLogoutModalOpen(false);

      window.location.href = loginUrl;
    } catch (error) {
      console.error("Logout failed:", error);

      localStorage.clear();
      sessionStorage.clear();

      window.location.href = getPortalLoginUrl();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // =====================================================
  // RENDER NAVIGATION ITEM
  // =====================================================

  const renderNavItem = (
    item: any,
    depth: number = 0,
    isMobile: boolean = false,
  ): ReactNode => {
    const hasChildren =
      Array.isArray(item.children) &&
      item.children.length > 0;

    const isExpanded = expandedMenus.includes(item.path);

    const shouldShowLabels =
      isMobile || isSidebarOpen || depth > 0;

    const parentActive =
      hasChildren && isItemActive(item);

    if (hasChildren) {
      return (
        <div key={item.path} className="mb-0.5">
          <button
            type="button"
            onClick={() => toggleMenu(item.path)}
            aria-expanded={isExpanded}
            title={
              !shouldShowLabels && depth === 0
                ? item.label
                : undefined
            }
            className={`
              group
              flex
              w-full
              items-center
              gap-2.5
              rounded-lg
              px-2
              py-1.5
              transition-colors
              duration-200
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--portal-primary)]/40
              ${
                parentActive
                  ? "bg-[var(--portal-pale)] text-[var(--portal-primary)]"
                  : "text-[#4A5778] hover:bg-[var(--portal-pale)]/70 hover:text-[var(--portal-primary)]"
              }
              ${depth > 0 ? "ml-3" : ""}
              ${
                !shouldShowLabels && depth === 0
                  ? "justify-center px-0"
                  : ""
              }
            `}
          >
            <span
              className={`
                flex
                h-8
                w-8
                flex-shrink-0
                items-center
                justify-center
                rounded-lg
                transition-colors
                duration-200
                ${
                  parentActive
                    ? "bg-white shadow-sm"
                    : "bg-[var(--portal-soft)] group-hover:bg-white"
                }
              `}
            >
              <span className="material-symbols-outlined text-[18px] text-[var(--portal-primary)]">
                {item.icon}
              </span>
            </span>

            {shouldShowLabels && (
              <>
                <span className="flex-1 text-left text-[13px] font-semibold tracking-wide">
                  {item.label}
                </span>

                <span
                  className={`
                    material-symbols-outlined
                    text-base
                    text-[var(--portal-primary)]/60
                    transition-transform
                    duration-300
                    ease-out
                    motion-reduce:transition-none
                    ${isExpanded ? "rotate-180" : ""}
                  `}
                >
                  expand_more
                </span>
              </>
            )}
          </button>

          {shouldShowLabels && (
            <div
              className={`
                overflow-hidden
                transition-all
                duration-300
                ease-in-out
                motion-reduce:transition-none
                ${
                  isExpanded
                    ? "mt-1 max-h-[800px] opacity-100"
                    : "max-h-0 opacity-0"
                }
              `}
            >
              <div className="ml-[22px] space-y-0.5 border-l border-[var(--portal-primary)]/15 pl-3">
                {item.children.map((child: any) =>
                  renderNavItem(
                    child,
                    depth + 1,
                    isMobile,
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        title={
          !shouldShowLabels && depth === 0
            ? item.label
            : undefined
        }
        onClick={() => {
          if (isMobile && mobileNavRef.current) {
            mobileScrollTopRef.current =
              mobileNavRef.current.scrollTop;
          }
        }}
        className={({ isActive }) => `
          group
          relative
          mb-0.5
          flex
          items-center
          gap-2.5
          rounded-lg
          transition-colors
          duration-200
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[var(--portal-primary)]/40
          ${depth === 0 ? "px-2 py-1.5" : "px-2.5 py-1.5"}
          ${
            isActive
              ? "bg-[var(--portal-primary)] font-semibold text-white"
              : "text-[#4A5778] hover:bg-[var(--portal-pale)]/70 hover:text-[var(--portal-primary)]"
          }
          ${
            !shouldShowLabels && depth === 0
              ? "justify-center px-0"
              : ""
          }
        `}
      >
        {({ isActive }) => (
          <>
            {depth > 0 ? (
              <span
                className={`
                  h-1.5
                  w-1.5
                  flex-shrink-0
                  rounded-full
                  transition-colors
                  duration-200
                  ${
                    isActive
                      ? "bg-white"
                      : "bg-[#8C97B2]/60 group-hover:bg-[var(--portal-primary)]/70"
                  }
                `}
              />
            ) : (
              <span
                className={`
                  flex
                  h-8
                  w-8
                  flex-shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  transition-colors
                  duration-200
                  ${
                    isActive
                      ? "bg-white/20"
                      : "bg-[var(--portal-soft)] group-hover:bg-white"
                  }
                `}
              >
                <span
                  className={`
                    material-symbols-outlined
                    text-[18px]
                    ${
                      isActive
                        ? "text-white"
                        : "text-[#4A5778] group-hover:text-[var(--portal-primary)]"
                    }
                  `}
                >
                  {item.icon}
                </span>
              </span>
            )}

            {shouldShowLabels && (
              <span
                className={`
                  truncate
                  text-[13px]
                  tracking-wide
                  ${isActive ? "text-white" : ""}
                `}
              >
                {item.label}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  // =====================================================
  // GROUPED NAVIGATION
  // =====================================================

  const renderGroupedNav = (isMobile: boolean) => {
    const showLabels = isMobile || isSidebarOpen;

    return (
      <>
        {groupedMenu.map((group, index) => (
          <section
            key={group.key}
            aria-label={group.label}
            className={
              index === 0
                ? ""
                : showLabels
                  ? "mt-3"
                  : "mt-2"
            }
          >
            {showLabels ? (
              <h2 className="mb-1 flex items-center gap-2 px-2.5 text-[11px] font-semibold tracking-wide text-[#8C97B2]">
                <span>{group.label}</span>
                <span className="h-px flex-1 bg-[var(--portal-primary)]/10" />
              </h2>
            ) : (
              index !== 0 && (
                <div className="mx-auto mb-2 h-px w-8 bg-[var(--portal-primary)]/10" />
              )
            )}

            <div>
              {group.items.map((item) =>
                renderNavItem(item, 0, isMobile),
              )}
            </div>
          </section>
        ))}
      </>
    );
  };

  const desktopNavContent = renderGroupedNav(false);
  const mobileNavContent = renderGroupedNav(true);

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div
      data-sidebar-role={sidebarRole}
      style={portalThemeStyle}
      className="min-h-screen bg-[var(--portal-soft)] font-sans text-[#0F1B3D]"
    >
      {/* DESKTOP SIDEBAR */}
      <nav
        aria-label="Main navigation"
        aria-busy={isSidebarLoading}
        className={`
          fixed
          left-0
          top-0
          bottom-0
          z-[9999]
          hidden
          h-screen
          flex-col
          overflow-hidden
          overscroll-contain
          border-r
          border-[var(--portal-primary)]/10
          bg-white
          px-4
          pt-6
          pb-5
          transition-all
          duration-300
          ease-in-out
          motion-reduce:transition-none
          md:flex
          ${isSidebarOpen ? "w-[280px]" : "w-[84px]"}
        `}
      >
        <SidebarContent
          isSidebarOpen={isSidebarOpen}
          isMobile={false}
          isSidebarLoading={isSidebarLoading}
          navContent={desktopNavContent}
          onLogout={openLogoutModal}
          isLoggingOut={isLoggingOut}
          accountItems={accountItems}
          portalLabel={sidebarPortalLabel}
          logoUrl={logoUrl}
          renderNavItem={renderNavItem}
        />
      </nav>

      {/* MOBILE BACKDROP */}
      <div
        className={`
          fixed
          inset-0
          z-[99999]
          touch-none
          bg-[#0F1B3D]/40
          backdrop-blur-[2px]
          transition-opacity
          duration-300
          md:hidden
          ${
            isMobileSidebarOpen
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
        onClick={toggleMobileSidebar}
        aria-hidden="true"
      />

      {/* MOBILE SIDEBAR */}
      <nav
        aria-label="Main navigation"
        aria-busy={isSidebarLoading}
        className={`
          fixed
          left-0
          top-0
          bottom-0
          z-[99999]
          flex
          h-screen
          w-[280px]
          flex-col
          overflow-hidden
          overscroll-contain
          border-r
          border-[var(--portal-primary)]/10
          bg-white
          px-4
          pt-6
          pb-5
          transition-transform
          duration-300
          ease-in-out
          motion-reduce:transition-none
          md:hidden
          ${
            isMobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-[#4A5778] transition-colors hover:bg-[var(--portal-pale)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portal-primary)]/40"
          aria-label="Close sidebar"
        >
          <FiX className="text-[22px]" />
        </button>

        <SidebarContent
          isSidebarOpen={true}
          isMobile={true}
          isSidebarLoading={isSidebarLoading}
          navContent={mobileNavContent}
          navRef={mobileNavRef}
          onLogout={openLogoutModal}
          isLoggingOut={isLoggingOut}
          accountItems={accountItems}
          portalLabel={sidebarPortalLabel}
          logoUrl={logoUrl}
          renderNavItem={renderNavItem}
        />
      </nav>

      {/* MAIN CONTENT */}
      <div
        className={`
          flex
          min-h-screen
          w-full
          flex-col
          transition-all
          duration-300
          ease-in-out
          motion-reduce:transition-none
          ${
            isSidebarOpen
              ? "md:ml-[280px] md:w-[calc(100%-280px)]"
              : "md:ml-[84px] md:w-[calc(100%-84px)]"
          }
        `}
      >
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={toggleMobileSidebar}
        />

        <main className="flex-1 pt-[72px] bg-white">
          <div
            className="mx-auto max-w-full"
            key={`${location.pathname}${location.search}`}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* LOGOUT MODAL */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
        >
          <div
            className="absolute inset-0 bg-[#0F1B3D]/40 backdrop-blur-[2px]"
            onClick={closeLogoutModal}
          />

          <div className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-[var(--portal-primary)]/10 bg-white shadow-[0_20px_60px_rgba(45,111,232,0.18)]">
            <div className="h-1 w-full bg-gradient-to-r from-[var(--portal-primary)] via-[var(--portal-light)] to-[var(--portal-mid)]" />

            <button
              type="button"
              onClick={closeLogoutModal}
              disabled={isLoggingOut}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#4A5778] transition-colors hover:bg-[var(--portal-pale)] hover:text-[var(--portal-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <FiX className="text-[18px]" />
            </button>

            <div className="px-6 pb-6 pt-7">
              <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--portal-pale)]">
                <FiLogOut className="text-[25px] text-[var(--portal-primary)]" />
              </div>

              <h2
                id="logout-title"
                className="text-center text-xl font-bold text-[#0F1B3D]"
              >
                Log out?
              </h2>

              <p className="mt-2 px-2 text-center text-sm leading-6 text-[#4A5778]">
                You&apos;re about to log out of the{" "}
                <span className="font-bold text-[var(--portal-primary)]">
                  {sidebarPortalLabel}
                </span>.
              </p>

              <p className="mt-1 text-center text-xs text-[#8C97B2]">
                You&apos;ll need to log in again to continue.
              </p>

              <div className="mt-7 flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeLogoutModal}
                  disabled={isLoggingOut}
                  className="flex-1 rounded-xl border border-[var(--portal-primary)]/15 bg-white px-4 py-3 text-sm font-bold text-[#4A5778] transition-colors duration-200 hover:bg-[var(--portal-soft)] hover:text-[var(--portal-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--portal-primary)] px-4 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-[var(--portal-dark)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoggingOut ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <FiLogOut className="text-[17px]" />
                      Log out
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;