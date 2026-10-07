// src/layouts/MainLayout.tsx

import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useMenuItems } from "../../pages/permissions/useMenuItems";
import { usePortalInfo } from "../../pages/permissions/usePortalInfo";
import Header from "./Header";
import { useState, useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { adminApi } from "../../api/endpoints/Auth";
import { FiX, FiLogOut } from "react-icons/fi";

import { getPortalLoginUrl } from "../../config/portalConfig";

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
}: SidebarContentProps) => {
  const showLabels = isMobile || isSidebarOpen;

  // ✅ Portal info (URL + API combined)
  const { portalName, warehouseName, warehouseCode } = usePortalInfo();

  return (
    <>
      {/* AMBIENT BACKGROUND LAYER — NAVY + YELLOW */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top navy glow */}
        <div
          className="
            absolute
            -top-24
            left-1/2
            h-72
            w-72
            -translate-x-1/2
            rounded-full
            bg-[#1E3A8A]
            opacity-[0.06]
            blur-3xl
          "
        />

        {/* Bottom yellow glow */}
        <div
          className="
            absolute
            -bottom-24
            left-1/2
            h-64
            w-64
            -translate-x-1/2
            rounded-full
            bg-[#FACC15]
            opacity-[0.08]
            blur-3xl
          "
        />
      </div>

      {/* LOGO */}

      <div
        className={`
          relative
          mb-6
          flex-shrink-0
          px-2
          transition-all
          duration-300
          ${!isMobile && !isSidebarOpen ? "flex justify-center px-0" : ""}
        `}
      >
        <div
          className={`
            flex
            items-center
            gap-3
            transition-all
            duration-300
            ${!isMobile && !isSidebarOpen ? "justify-center" : ""}
          `}
        >
          {/* LOGO IMAGE — navy ring */}
          <div
            className="
              relative
              flex
              h-14
              w-14
              flex-shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-[#1E3A8A]/15
              bg-white
              p-1.5
              shadow-[0_4px_14px_rgba(30,58,138,0.10)]
            "
          >
            <img
              src={`${import.meta.env.BASE_URL}assets/logo.png`}
              alt="IndieKonnect Logo"
              className="relative z-10 h-full w-full object-contain"
            />
          </div>

          {showLabels && (
            <div className="min-w-0">
              <h1
                className="
                  text-xl
                  font-bold
                  leading-tight
                  tracking-tight
                  text-[#0F1B3D]
                "
              >
                IndieKonnect
              </h1>

              {/* PORTAL NAME — yellow accent */}
              <p
                className="
                  mt-0.5
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.25em]
                  text-[#EAB308]
                "
              >
                {portalName}
              </p>

              {/* WAREHOUSE NAME — navy accent */}
              {warehouseName && (
                <p
                  className="
                    mt-0.5
                    truncate
                    text-[10px]
                    font-semibold
                    text-[#1E40AF]
                  "
                  title={`${warehouseName}${
                    warehouseCode ? ` (${warehouseCode})` : ""
                  }`}
                >
                  {warehouseName}
                  {warehouseCode && ` (${warehouseCode})`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DIVIDER — navy tint */}

      <div
        className="
          relative
          mb-6
          h-px
          w-full
          flex-shrink-0
          bg-[#1E3A8A]/10
        "
      />

      {/* NAVIGATION */}

      <div
        ref={navRef}
        className={`
          relative
          flex-1
          min-h-0
          overflow-y-auto
          overflow-x-hidden
          overscroll-contain
          touch-pan-y
          px-1
          py-1
          space-y-1
          ${isMobile ? "pb-8" : ""}

          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-[#1E3A8A]/20
          [&::-webkit-scrollbar-track]:bg-transparent
        `}
      >
        {navContent}
      </div>

      {/* LOGOUT */}

      <div className="relative mt-2 flex-shrink-0 pt-5">
        <div className="mb-5 h-px w-full bg-[#1E3A8A]/10" />

        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          title={!isMobile && !isSidebarOpen ? "Logout" : undefined}
          className={`
            group
            relative
            flex
            w-full
            items-center
            justify-center
            gap-3
            rounded-xl
            border
            border-[#1E3A8A]/15
            bg-white
            px-4
            py-3
            text-[#1E3A8A]
            transition-all
            duration-200

            hover:border-[#1E3A8A]/30
            hover:bg-[#EAF1FF]

            active:scale-[0.98]

            disabled:cursor-not-allowed
            disabled:opacity-60

            ${!isMobile && !isSidebarOpen ? "px-0" : ""}
          `}
        >
          {isLoggingOut ? (
            <>
              <span
                className="
                  h-4
                  w-4
                  rounded-full
                  border-2
                  border-[#1E3A8A]
                  border-t-transparent
                  animate-spin
                "
              />

              {showLabels && (
                <span className="text-[12px] font-bold uppercase tracking-[0.15em]">
                  Logging out...
                </span>
              )}
            </>
          ) : (
            <>
              <FiLogOut className="text-lg" />

              {showLabels && (
                <span className="text-[12px] font-bold uppercase tracking-[0.15em]">
                  Logout
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </>
  );
};

// =====================================================
// MAIN LAYOUT
// =====================================================

const MainLayout = () => {
  // ✅ PERMISSION-FILTERED MENU ITEMS
  const menuItems = useMenuItems();

  // ✅ PORTAL INFO (URL + API combined)
  const { portalName } = usePortalInfo();

  // =====================================================
  // STATES
  // =====================================================

  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const location = useLocation();

  // =====================================================
  // MOBILE SCROLL REFS
  // =====================================================

  const mobileNavRef = useRef<HTMLDivElement>(null);
  const mobileScrollTopRef = useRef(0);

  // =====================================================
  // DESKTOP SIDEBAR TOGGLE
  // =====================================================

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // =====================================================
  // MOBILE SIDEBAR TOGGLE
  // =====================================================

  const toggleMobileSidebar = () => {
    if (mobileNavRef.current) {
      mobileScrollTopRef.current = mobileNavRef.current.scrollTop;
    }
    setIsMobileSidebarOpen((prev) => !prev);
  };

  // =====================================================
  // CLOSE MOBILE SIDEBAR WHEN ROUTE CHANGES
  // =====================================================

  useEffect(() => {
    if (mobileNavRef.current) {
      mobileScrollTopRef.current = mobileNavRef.current.scrollTop;
    }
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // =====================================================
  // LOCK BODY SCROLL ON MOBILE
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
  // RESTORE MOBILE SIDEBAR SCROLL POSITION
  // =====================================================

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const frame = requestAnimationFrame(() => {
      if (!mobileNavRef.current) return;
      mobileNavRef.current.scrollTop = mobileScrollTopRef.current;
    });

    return () => cancelAnimationFrame(frame);
  }, [isMobileSidebarOpen, expandedMenus, location.pathname]);

  // =====================================================
  // MENU TOGGLE
  // =====================================================

  const toggleMenu = (path: string) => {
    if (mobileNavRef.current) {
      mobileScrollTopRef.current = mobileNavRef.current.scrollTop;
    }

    setExpandedMenus((prev) =>
      prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path],
    );
  };

  // =====================================================
  // LOGOUT MODAL
  // =====================================================

  const openLogoutModal = () => {
    if (isLoggingOut) return;
    setIsLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    if (isLoggingOut) return;
    setIsLogoutModalOpen(false);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

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

    if (hasChildren) {
      return (
        <div key={item.path} className="mb-0.5">
          <button
            type="button"
            onClick={() => toggleMenu(item.path)}
            title={!shouldShowLabels && depth === 0 ? item.label : undefined}
            className={`
              group
              flex
              w-full
              items-center
              gap-3.5
              rounded-lg
              px-4
              py-2.5
              text-[#4A5778]
              transition-colors
              duration-200

              hover:bg-[#EAF1FF]
              hover:text-[#1E3A8A]

              ${depth > 0 ? "ml-4" : ""}

              ${!shouldShowLabels && depth === 0 ? "justify-center px-0" : ""}
            `}
          >
            <span className="material-symbols-outlined flex-shrink-0 text-lg text-[#1E3A8A]">
              {item.icon}
            </span>

            {shouldShowLabels && (
              <>
                <span className="flex-1 text-left text-[11px] font-bold uppercase tracking-[0.15em]">
                  {item.label}
                </span>

                <span
                  className={`
                    material-symbols-outlined
                    text-sm
                    text-[#1E3A8A]/60
                    transition-transform
                    duration-300
                    ease-out
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

                ${
                  isExpanded
                    ? "mt-0.5 max-h-[500px] opacity-100"
                    : "max-h-0 opacity-0"
                }
              `}
            >
              <div
                className="
                  ml-6
                  space-y-0.5
                  border-l
                  border-[#1E3A8A]/15
                  pl-3
                "
              >
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
          flex
          items-center
          gap-3.5
          rounded-lg
          px-4
          py-2.5
          transition-colors
          duration-200

          ${
            isActive
              ? "bg-[#1E3A8A] font-semibold text-white shadow-[0_6px_16px_-6px_rgba(30,58,138,0.55)]"
              : "text-[#4A5778] hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
          }

          ${depth > 0 ? "ml-2" : ""}

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
                      ? "bg-[#FACC15]"
                      : "bg-[#8C97B2]/60 group-hover:bg-[#1E3A8A]/70"
                  }
                `}
              />
            ) : (
              <span
                className={`
                  material-symbols-outlined
                  flex-shrink-0
                  text-lg

                  ${
                    isActive
                      ? "text-[#FACC15]"
                      : "text-[#4A5778] group-hover:text-[#1E3A8A]"
                  }
                `}
              >
                {item.icon}
              </span>
            )}

            {shouldShowLabels && (
              <span
                className={`
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
  // NAVIGATION CONTENT
  // =====================================================

  const desktopNavContent = (
    <>
      {menuItems.map((item) => renderNavItem(item, 0, false))}
    </>
  );

  const mobileNavContent = (
    <>
      {menuItems.map((item) => renderNavItem(item, 0, true))}
    </>
  );

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[#F5F8FF] font-sans text-[#0F1B3D]">
      {/* DESKTOP SIDEBAR */}

      <nav
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
          border-[#1E3A8A]/10
          bg-white
          px-5
          pt-8
          pb-8
          transition-all
          duration-300
          ease-in-out
          md:flex

          ${isSidebarOpen ? "w-[280px]" : "w-[90px]"}
        `}
      >
        <SidebarContent
          isSidebarOpen={isSidebarOpen}
          isMobile={false}
          navContent={desktopNavContent}
          onLogout={openLogoutModal}
          isLoggingOut={isLoggingOut}
        />
      </nav>

      {/* MOBILE BACKDROP */}

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-[99999] touch-none bg-black/40 md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* MOBILE SIDEBAR */}

      <nav
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
          border-[#1E3A8A]/10
          bg-white
          px-5
          pt-8
          pb-8
          transition-transform
          duration-300
          ease-in-out
          md:hidden

          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-[#4A5778] transition-colors hover:bg-[#EAF1FF]"
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

          ${
            isSidebarOpen
              ? `
                md:ml-[280px]
                md:w-[calc(100%-280px)]
              `
              : `
                md:ml-[90px]
                md:w-[calc(100%-90px)]
              `
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
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeLogoutModal}
          />

          <div className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-[#1E3A8A]/10 bg-white shadow-[0_20px_60px_rgba(30,58,138,0.18)]">
            {/* NAVY → YELLOW top accent */}
            <div className="h-1 w-full bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#FACC15]" />

            <button
              type="button"
              onClick={closeLogoutModal}
              disabled={isLoggingOut}
              className="
                absolute
                right-4
                top-4
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                text-[#4A5778]
                transition-colors

                hover:bg-[#EAF1FF]
                hover:text-[#1E3A8A]

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              aria-label="Close"
            >
              <FiX className="text-[18px]" />
            </button>

            <div className="px-6 pb-6 pt-7">
              {/* Navy icon circle with yellow icon */}
              <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1FF]">
                <FiLogOut className="text-[25px] text-[#1E3A8A]" />
              </div>

              <h2 className="text-center text-xl font-bold text-[#0F1B3D]">
                Are you sure?
              </h2>

              <p className="mt-2 px-2 text-center text-sm leading-6 text-[#4A5778]">
                Are you sure you want to logout from the{" "}
                <span className="font-bold text-[#1E3A8A]">
                  {portalName}
                </span>
                ?
              </p>

              <p className="mt-1 text-center text-xs text-[#8C97B2]">
                You will need to login again to access your account.
              </p>

              <div className="mt-7 flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeLogoutModal}
                  disabled={isLoggingOut}
                  className="
                    flex-1
                    rounded-xl
                    border
                    border-[#1E3A8A]/15
                    bg-white
                    px-4
                    py-3
                    text-sm
                    font-bold
                    text-[#4A5778]
                    transition-colors
                    duration-200

                    hover:bg-[#F5F8FF]
                    hover:text-[#1E3A8A]

                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="
                    flex
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-[#1E3A8A]
                    px-4
                    py-3
                    text-sm
                    font-bold
                    text-white
                    transition-colors
                    duration-200

                    hover:bg-[#172554]

                    active:scale-[0.98]

                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {isLoggingOut ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <FiLogOut className="text-[17px]" />
                      Yes, Logout
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