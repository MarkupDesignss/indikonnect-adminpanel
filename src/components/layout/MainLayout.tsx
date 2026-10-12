// src/layouts/MainLayout.tsx

import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useMenuItems } from "../../pages/permissions/useMenuItems";
import { usePortalInfo } from "../../pages/permissions/usePortalInfo";
import Header from "./Header";
import { useState, useEffect, useRef, useMemo } from "react";
import type { ReactNode, RefObject } from "react";
import { adminApi } from "../../api/endpoints/Auth";
import { FiX, FiLogOut } from "react-icons/fi";

import { getPortalLoginUrl } from "../../config/portalConfig";

// =====================================================
// MENU GROUPING CONFIG
// =====================================================

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
  // ✅ Naya group — Sales (Finance ke baad dikhega)
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

// ✅ Account items ke paths — inhe grouped menu se exclude karenge
// Update Profile, Change Password, Admin Settings — sab Account section mein
const ACCOUNT_PATHS = [
  "/UpdateProfile",
  "/ChangePassword",
  "/SettingsManagement",
];

const resolveGroupKey = (item: any): string => {
  if (item?.group && typeof item.group === "string") {
    return item.group.toLowerCase();
  }

  const haystack = `${item?.path ?? ""} ${item?.label ?? ""}`.toLowerCase();
  const found = NAV_GROUPS.find((g) => g.match.some((m) => haystack.includes(m)));

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
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(item);
  });

  const result: GroupedMenu[] = [];

  NAV_GROUPS.forEach((g) => {
    const list = buckets.get(g.key);
    if (list?.length) {
      result.push({ key: g.key, label: g.label, items: list });
      buckets.delete(g.key);
    }
  });

  buckets.forEach((list, key) => {
    const label =
      key === FALLBACK_GROUP.key
        ? FALLBACK_GROUP.label
        : key.charAt(0).toUpperCase() + key.slice(1);
    result.push({ key, label, items: list });
  });

  return result;
};

// =====================================================
// TYPES
// =====================================================

interface SidebarContentProps {
  isSidebarOpen: boolean;
  isMobile: boolean;
  navContent: ReactNode;
  navRef?: RefObject<HTMLDivElement | null>;
  onLogout: () => void;
  isLoggingOut: boolean;
  accountItems: any[];
  renderNavItem: (item: any, depth?: number, isMobile?: boolean) => ReactNode;
}

// =====================================================
// STABLE SIDEBAR CONTENT
// =====================================================

const SidebarContent = ({
  isSidebarOpen,
  isMobile,
  navContent,
  navRef,
  onLogout,
  isLoggingOut,
  accountItems,
  renderNavItem,
}: SidebarContentProps) => {
  const showLabels = isMobile || isSidebarOpen;
  const { portalName, warehouseName, warehouseCode } = usePortalInfo();

  return (
    <>
      {/* AMBIENT BACKGROUND LAYER — SOFT BLUE GLOW */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#2D6FE8] opacity-[0.05] blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#8BB7FF] opacity-[0.08] blur-3xl" />
      </div>

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
          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#2D6FE8]/15 bg-white p-1.5 shadow-[0_4px_14px_rgba(45,111,232,0.12)]">
            <img
              src={`${import.meta.env.BASE_URL}assets/logo.png`}
              alt="IndieKonnect Logo"
              className="relative z-10 h-full w-full object-contain"
            />
          </div>

          {showLabels && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight tracking-tight text-[#0F1B3D]">
                IndieKonnect
              </h1>
              <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-[#2D6FE8]">
                {portalName}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WAREHOUSE CHIP */}
      {showLabels && warehouseName && (
        <div className="relative mb-4 flex-shrink-0">
          <div
            className="flex items-center gap-2.5 rounded-xl border border-[#2D6FE8]/10 bg-[#F2F7FC] px-3 py-2.5"
            title={`${warehouseName}${warehouseCode ? ` (${warehouseCode})` : ""}`}
          >
            <span className="material-symbols-outlined flex-shrink-0 text-[18px] text-[#2D6FE8]">
              warehouse
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold leading-tight text-[#1E40AF]">
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
        <div className="relative mb-3 h-px w-full flex-shrink-0 bg-[#2D6FE8]/10" />
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
          [&::-webkit-scrollbar-thumb]:bg-[#2D6FE8]/20
          [&::-webkit-scrollbar-track]:bg-transparent
        `}
      >
        {navContent}

        {/* ACCOUNT SECTION — Update Profile, Change Password, Admin Settings, Logout */}
        <div className="mt-3">
          {showLabels ? (
            <h2 className="mb-1 flex items-center gap-2 px-2.5 text-[11px] font-semibold tracking-wide text-[#8C97B2]">
              <span>Account</span>
              <span className="h-px flex-1 bg-[#2D6FE8]/10" />
            </h2>
          ) : (
            <div className="mx-auto mb-2 h-px w-8 bg-[#2D6FE8]/10" />
          )}

          {/* Account menu items: Update Profile, Change Password, Admin Settings */}
          <div>
            {accountItems.map((item) => renderNavItem(item, 0, isMobile))}
          </div>

          {/* Logout button */}
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

              text-[#4A5778] hover:bg-[#FEF2F2] hover:text-[#E11D48]

              disabled:cursor-not-allowed
              disabled:opacity-60
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
                bg-[#F2F7FC] group-hover:bg-white
              `}
            >
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
  const menuItems = useMenuItems();
  const { portalName } = usePortalInfo();

  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const location = useLocation();

  const isPathActive = (path?: string) => {
    if (!path) return false;
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const isItemActive = (item: any): boolean => {
    if (Array.isArray(item.children) && item.children.length > 0) {
      return item.children.some((c: any) => isItemActive(c));
    }
    return isPathActive(item.path);
  };

  // ✅ Account items (Update Profile, Change Password, Admin Settings)
  //    — sirf Account section ke liye
  const accountItems = useMemo(
    () =>
      (menuItems as any[]).filter((item) =>
        ACCOUNT_PATHS.includes(item.path),
      ),
    [menuItems],
  );

  // ✅ Baaki sab menu items grouped menu ke liye (Account items excluded)
  const groupedMenu = useMemo(
    () =>
      groupMenuItems(
        (menuItems as any[]).filter(
          (item) => !ACCOUNT_PATHS.includes(item.path),
        ),
      ),
    [menuItems],
  );

  const mobileNavRef = useRef<HTMLDivElement>(null);
  const mobileScrollTopRef = useRef(0);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const toggleMobileSidebar = () => {
    if (mobileNavRef.current) {
      mobileScrollTopRef.current = mobileNavRef.current.scrollTop;
    }
    setIsMobileSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    if (mobileNavRef.current) {
      mobileScrollTopRef.current = mobileNavRef.current.scrollTop;
    }
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

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

    setExpandedMenus((prev) => {
      const missing = parents.filter((p) => !prev.includes(p));
      return missing.length ? [...prev, ...missing] : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, (menuItems as any[]).length]);

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isLogoutModalOpen && !isLoggingOut) setIsLogoutModalOpen(false);
      else if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isLogoutModalOpen, isLoggingOut, isMobileSidebarOpen]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const frame = requestAnimationFrame(() => {
      if (!mobileNavRef.current) return;
      mobileNavRef.current.scrollTop = mobileScrollTopRef.current;
    });

    return () => cancelAnimationFrame(frame);
  }, [isMobileSidebarOpen, expandedMenus, location.pathname]);

  const toggleMenu = (path: string) => {
    if (mobileNavRef.current) {
      mobileScrollTopRef.current = mobileNavRef.current.scrollTop;
    }

    setExpandedMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

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
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
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
      Array.isArray(item.children) && item.children.length > 0;

    const isExpanded = expandedMenus.includes(item.path);
    const shouldShowLabels = isMobile || isSidebarOpen || depth > 0;
    const parentActive = hasChildren && isItemActive(item);

    if (hasChildren) {
      return (
        <div key={item.path} className="mb-0.5">
          <button
            type="button"
            onClick={() => toggleMenu(item.path)}
            aria-expanded={isExpanded}
            title={!shouldShowLabels && depth === 0 ? item.label : undefined}
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
              focus-visible:ring-[#2D6FE8]/40

              ${
                parentActive
                  ? "bg-[#EAF3FF] text-[#2D6FE8]"
                  : "text-[#4A5778] hover:bg-[#EAF3FF]/70 hover:text-[#2D6FE8]"
              }

              ${depth > 0 ? "ml-3" : ""}

              ${!shouldShowLabels && depth === 0 ? "justify-center px-0" : ""}
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
                    : "bg-[#F2F7FC] group-hover:bg-white"
                }
              `}
            >
              <span className="material-symbols-outlined text-[18px] text-[#2D6FE8]">
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
                    text-[#2D6FE8]/60
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
              <div className="ml-[22px] space-y-0.5 border-l border-[#2D6FE8]/15 pl-3">
                {item.children.map((child: any) =>
                  renderNavItem(child, depth + 1, isMobile),
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
        title={!shouldShowLabels && depth === 0 ? item.label : undefined}
        onClick={() => {
          if (isMobile && mobileNavRef.current) {
            mobileScrollTopRef.current = mobileNavRef.current.scrollTop;
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
          focus-visible:ring-[#2D6FE8]/40

          ${depth === 0 ? "px-2 py-1.5" : "px-2.5 py-1.5"}

          ${
            isActive
              ? "bg-[#2D6FE8] font-semibold text-white"
              : "text-[#4A5778] hover:bg-[#EAF3FF]/70 hover:text-[#2D6FE8]"
          }

          ${!shouldShowLabels && depth === 0 ? "justify-center px-0" : ""}
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
                      : "bg-[#8C97B2]/60 group-hover:bg-[#2D6FE8]/70"
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
                      : "bg-[#F2F7FC] group-hover:bg-white"
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
                        : "text-[#4A5778] group-hover:text-[#2D6FE8]"
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

  const renderGroupedNav = (isMobile: boolean) => {
    const showLabels = isMobile || isSidebarOpen;

    return (
      <>
        {groupedMenu.map((group, index) => (
          <section
            key={group.key}
            aria-label={group.label}
            className={index === 0 ? "" : showLabels ? "mt-3" : "mt-2"}
          >
            {showLabels ? (
              <h2 className="mb-1 flex items-center gap-2 px-2.5 text-[11px] font-semibold tracking-wide text-[#8C97B2]">
                <span>{group.label}</span>
                <span className="h-px flex-1 bg-[#2D6FE8]/10" />
              </h2>
            ) : (
              index !== 0 && (
                <div className="mx-auto mb-2 h-px w-8 bg-[#2D6FE8]/10" />
              )
            )}

            <div>
              {group.items.map((item) => renderNavItem(item, 0, isMobile))}
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
    <div className="min-h-screen bg-[#F2F7FC] font-sans text-[#0F1B3D]">
      {/* DESKTOP SIDEBAR */}
      <nav
        aria-label="Main navigation"
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
          border-[#2D6FE8]/10
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
          navContent={desktopNavContent}
          onLogout={openLogoutModal}
          isLoggingOut={isLoggingOut}
          accountItems={accountItems}
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
          border-[#2D6FE8]/10
          bg-white
          px-4
          pt-6
          pb-5
          transition-transform
          duration-300
          ease-in-out
          motion-reduce:transition-none
          md:hidden

          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-[#4A5778] transition-colors hover:bg-[#EAF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6FE8]/40"
          aria-label="Close sidebar"
        >
          <FiX className="text-[22px]" />
        </button>

        <SidebarContent
          isSidebarOpen={true}
          isMobile={true}
          navContent={mobileNavContent}
          navRef={mobileNavRef}
          onLogout={openLogoutModal}
          isLoggingOut={isLoggingOut}
          accountItems={accountItems}
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

        <main className="flex-1 pt-[72px]">
          <div className="mx-auto max-w-full">
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

          <div className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-[#2D6FE8]/10 bg-white shadow-[0_20px_60px_rgba(45,111,232,0.18)]">
            <div className="h-1 w-full bg-gradient-to-r from-[#2D6FE8] via-[#5A95F6] to-[#8BB7FF]" />

            <button
              type="button"
              onClick={closeLogoutModal}
              disabled={isLoggingOut}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#4A5778] transition-colors hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <FiX className="text-[18px]" />
            </button>

            <div className="px-6 pb-6 pt-7">
              <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF3FF]">
                <FiLogOut className="text-[25px] text-[#2D6FE8]" />
              </div>

              <h2
                id="logout-title"
                className="text-center text-xl font-bold text-[#0F1B3D]"
              >
                Log out?
              </h2>

              <p className="mt-2 px-2 text-center text-sm leading-6 text-[#4A5778]">
                You&apos;re about to log out of the{" "}
                <span className="font-bold text-[#2D6FE8]">{portalName}</span>.
              </p>

              <p className="mt-1 text-center text-xs text-[#8C97B2]">
                You&apos;ll need to log in again to continue.
              </p>

              <div className="mt-7 flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeLogoutModal}
                  disabled={isLoggingOut}
                  className="flex-1 rounded-xl border border-[#2D6FE8]/15 bg-white px-4 py-3 text-sm font-bold text-[#4A5778] transition-colors duration-200 hover:bg-[#F2F7FC] hover:text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2D6FE8] px-4 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#1E5AD1] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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