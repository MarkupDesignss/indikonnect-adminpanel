import { Outlet, NavLink, useLocation } from "react-router-dom";

import { menuItems } from "@/config/menu";
import Header from "./Header";

import { useState, useEffect, useRef } from "react";

import type { ReactNode, RefObject } from "react";

import { adminApi } from "../../api/endpoints/Auth";

import { FiX, FiLogOut } from "react-icons/fi";

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
// BRAND PALETTE
// =====================================================

const BRAND_GREEN = "#163F20";
const BRAND_GREEN_DARK = "#0F3219";
const BRAND_GREEN_SOFT = "#4C8A57";
const BRAND_GREEN_LIGHT = "#EAF3EA";

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

  return (
    <>
      {/* =====================================================
          AMBIENT BACKGROUND LAYER (3D depth)
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top green glow */}
        <div
          className="
            sidebar-ambient
            absolute
            -top-24
            left-1/2
            w-72
            h-72
            rounded-full
            bg-[#163F20]
            blur-3xl
          "
        />

        {/* Bottom soft mint glow */}
        <div
          className="
            absolute
            -bottom-24
            left-1/2
            -translate-x-1/2
            w-64
            h-64
            rounded-full
            bg-[#4C8A57]
            opacity-[0.05]
            blur-3xl
          "
        />

        {/* Vertical shimmer */}
        <div
          className="
            sidebar-shimmer
            absolute
            top-0
            bottom-0
            w-24
            bg-gradient-to-r
            from-transparent
            via-white/40
            to-transparent
            opacity-30
            blur-2xl
          "
        />
      </div>

      {/* =====================================================
          LOGO
      ===================================================== */}

      <div
        className={`
          relative
          mb-6
          px-2
          flex-shrink-0
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
          {/* LOGO IMAGE with 3D ring */}
          <div
            className="
              relative
              w-14
              h-14
              flex-shrink-0
              flex
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              from-white
              to-[#F5F7F5]
              border
              border-[#163F20]/15
              p-1.5
              shadow-[0_6px_16px_-6px_rgba(22,63,32,0.28),inset_0_1px_0_rgba(255,255,255,0.9)]
            "
          >
            {/* Inner highlight ring */}
            <span
              className="
                pointer-events-none
                absolute
                inset-0
                rounded-2xl
                ring-1
                ring-inset
                ring-white/60
              "
            />

            <img
              src={`${import.meta.env.BASE_URL}assets/logo.png`}
              alt="IndieKonnect Logo"
              className="w-full h-full object-contain relative z-10"
            />
          </div>

          {/* BRAND */}
          {showLabels && (
            <div className="min-w-0">
              <h1
                className="
                  text-xl
                  font-bold
                  leading-tight
                  tracking-tight
                  bg-gradient-to-br
                  from-[#163F20]
                  via-[#0F3219]
                  to-[#4C8A57]
                  bg-clip-text
                  text-transparent
                "
              >
                IndieKonnect
              </h1>

              <p
                className="
                  mt-0.5
                  text-[10px]
                  font-bold
                  tracking-[0.25em]
                  uppercase
                  text-[#4C8A57]
                "
              >
                Admin Portal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          DIVIDER
      ===================================================== */}

      <div
        className="
          relative
          h-px
          w-full
          mb-6
          flex-shrink-0
          bg-gradient-to-r
          from-transparent
          via-[#163F20]/25
          to-transparent
        "
      />

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <div
        ref={navRef}
        onScroll={() => {
          // Scroll position is captured by MainLayout ref.
        }}
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
          space-y-1.5
          ${isMobile ? "pb-8" : ""}
          scrollbar-thin
          scrollbar-thumb-[#163F20]/20
          scrollbar-track-transparent

          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-[#163F20]/25
          [&::-webkit-scrollbar-track]:bg-transparent
          hover:[&::-webkit-scrollbar-thumb]:bg-[#163F20]/40
        `}
      >
        {navContent}
      </div>

      {/* =====================================================
          LOGOUT
      ===================================================== */}

      <div
        className="
          relative
          mt-2
          pt-5
          flex-shrink-0
        "
      >
        <div
          className="
            h-px
            w-full
            mb-5
            bg-gradient-to-r
            from-transparent
            via-[#163F20]/20
            to-transparent
          "
        />

        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          title={!isMobile && !isSidebarOpen ? "Logout" : undefined}
          className={`
            group
            relative
            w-full
            flex
            items-center
            justify-center
            gap-3
            px-4
            py-3
            rounded-xl

            border
            border-[#163F20]/20

            bg-gradient-to-br
            from-white
            to-[#F5F7F5]

            text-[#163F20]

            shadow-[0_4px_12px_-4px_rgba(22,63,32,0.15),inset_0_1px_0_rgba(255,255,255,0.9)]

            hover:border-[#163F20]/40
            hover:from-[#4C8A57]
            hover:to-[#163F20]
            hover:text-white
            hover:shadow-[0_10px_22px_-8px_rgba(22,63,32,0.55),inset_0_1px_0_rgba(255,255,255,0.25)]
            hover:-translate-y-0.5

            transition-all
            duration-300
            active:scale-[0.97]

            disabled:opacity-60
            disabled:cursor-not-allowed

            ${!isMobile && !isSidebarOpen ? "px-0" : ""}
          `}
        >
          {isLoggingOut ? (
            <>
              <span
                className="
                  w-4
                  h-4
                  border-2
                  border-[#163F20]
                  border-t-transparent
                  rounded-full
                  animate-spin
                  group-hover:border-white
                  group-hover:border-t-transparent
                "
              />

              {showLabels && (
                <span
                  className="
                    text-[12px]
                    font-bold
                    uppercase
                    tracking-[0.15em]
                  "
                >
                  Logging out...
                </span>
              )}
            </>
          ) : (
            <>
              <FiLogOut
                className="
                  text-lg
                  transition-transform
                  duration-300
                  group-hover:translate-x-0.5
                "
              />

              {showLabels && (
                <span
                  className="
                    text-[12px]
                    font-bold
                    uppercase
                    tracking-[0.15em]
                  "
                >
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
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
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
      await adminApi.logout();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminData");
      sessionStorage.removeItem("adminPermissions");
      sessionStorage.removeItem("adminRoles");

      window.location.href = `${import.meta.env.BASE_URL}login`;
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

    // =====================================================
    // PARENT WITH CHILDREN
    // =====================================================

    if (hasChildren) {
      return (
        <div key={item.path} className="mb-1">
          <button
            type="button"
            onClick={() => toggleMenu(item.path)}
            title={!shouldShowLabels && depth === 0 ? item.label : undefined}
            className={`
              group
              w-full
              flex
              items-center
              gap-3.5
              px-4
              py-2.5
              rounded-xl

              text-[#59645C]

              hover:text-[#163F20]
              hover:bg-[#EAF3EA]/70
              hover:shadow-[0_4px_10px_-4px_rgba(22,63,32,0.15)]

              transition-all
              duration-300

              ${depth > 0 ? "ml-4" : ""}

              ${!shouldShowLabels && depth === 0 ? "justify-center px-0" : ""}
            `}
          >
            <span
              className="
                material-symbols-outlined
                text-lg
                text-[#163F20]
                flex-shrink-0
                transition-transform
                duration-300
                group-hover:scale-110
              "
            >
              {item.icon}
            </span>

            {shouldShowLabels && (
              <>
                <span
                  className="
                    flex-1
                    text-left
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.15em]
                  "
                >
                  {item.label}
                </span>

                <span
                  className={`
                    material-symbols-outlined
                    text-sm
                    text-[#163F20]/70
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
                    ? "max-h-[500px] opacity-100 mt-1"
                    : "max-h-0 opacity-0"
                }
              `}
            >
              <div
                className="
                  space-y-1
                  border-l
                  border-[#163F20]/20
                  pl-3
                  ml-6
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

    // =====================================================
    // NORMAL NAVIGATION ITEM
    // =====================================================

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
          px-4
          py-2.5
          rounded-xl

          transition-all
          duration-300

          ${
            isActive
              ? `
                nav-glow
                bg-gradient-to-r
                from-[#163F20]
                via-[#0F3219]
                to-[#4C8A57]
                text-white
                font-bold
                scale-[1.02]
              `
              : `
                text-[#59645C]
                hover:text-[#163F20]
                hover:bg-[#EAF3EA]/70
                hover:shadow-[0_4px_10px_-4px_rgba(22,63,32,0.12)]
              `
          }

          ${depth > 0 ? "ml-2" : ""}

          ${!shouldShowLabels && depth === 0 ? "justify-center px-0" : ""}
        `}
      >
        {({ isActive }) => (
          <>
            {/* ACTIVE INDICATOR */}
            {isActive && (
              <span
                className="
                  absolute
                  left-0
                  top-1/2
                  -translate-y-1/2
                  w-[3px]
                  h-7
                  rounded-r-full
                  bg-gradient-to-b
                  from-[#8FC199]
                  to-white
                "
              />
            )}

            {/* SUB ITEM DOT / MAIN ICON */}
            {depth > 0 ? (
              <span
                className={`
                  flex-shrink-0
                  w-2
                  h-2
                  rounded-full
                  transition-all
                  duration-300

                  ${
                    isActive
                      ? `
                        bg-white
                        scale-110
                        shadow-[0_0_0_3px_rgba(255,255,255,0.25)]
                      `
                      : `
                        bg-[#89918B]/50
                        group-hover:bg-[#163F20]/70
                      `
                  }
                `}
              />
            ) : (
              <span
                className={`
                  material-symbols-outlined
                  text-lg
                  transition-transform
                  duration-300
                  group-hover:scale-110
                  flex-shrink-0

                  ${
                    isActive
                      ? "text-white"
                      : "text-[#59645C] group-hover:text-[#163F20]"
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
    <>{menuItems.map((item) => renderNavItem(item, 0, false))}</>
  );

  const mobileNavContent = (
    <>{menuItems.map((item) => renderNavItem(item, 0, true))}</>
  );

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div
      className="
        min-h-screen
        bg-[#F5F7F5]
        text-[#202721]
        font-sans
      "
    >
      {/* =====================================================
          DESKTOP SIDEBAR (3D)
      ===================================================== */}

      <nav
        className={`
          hidden
          md:flex
          fixed
          left-0
          top-0
          bottom-0
          h-screen

          bg-gradient-to-b
          from-white
          via-white
          to-[#F5FAF5]

          border-r
          border-[#163F20]/10

          flex-col

          pt-8
          pb-8
          px-5

          z-[9999]

          shadow-[8px_0_28px_-12px_rgba(22,63,32,0.22),inset_-1px_0_0_rgba(255,255,255,0.9)]

          overflow-hidden
          overscroll-contain

          transition-all
          duration-300
          ease-in-out

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

      {/* =====================================================
          MOBILE BACKDROP
      ===================================================== */}

      {isMobileSidebarOpen && (
        <div
          className="
            fixed
            inset-0
            z-[99999]
            bg-black/50
            backdrop-blur-sm
            md:hidden
            touch-none
          "
          onClick={toggleMobileSidebar}
        />
      )}

      {/* =====================================================
          MOBILE SIDEBAR (3D)
      ===================================================== */}

      <nav
        className={`
          md:hidden

          fixed
          left-0
          top-0
          bottom-0

          w-[280px]
          h-screen

          bg-gradient-to-b
          from-white
          via-white
          to-[#F5FAF5]

          border-r
          border-[#163F20]/10

          flex
          flex-col

          pt-8
          pb-8
          px-5

          z-[99999]

          shadow-[16px_0_40px_-12px_rgba(22,63,32,0.35)]

          overflow-hidden
          overscroll-contain

          transition-transform
          duration-300
          ease-in-out

          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* MOBILE CLOSE */}

        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="
            absolute
            right-3
            top-3
            p-2
            rounded-full
            hover:bg-[#EAF3EA]
            transition-colors
            text-[#59645C]
            z-10
          "
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

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div
        className={`
          min-h-screen
          flex
          flex-col
          w-full

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
          <div
            className="
              max-w-full
              mx-auto
              animate-fade-in
            "
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* =====================================================
          LOGOUT MODAL (3D)
      ===================================================== */}

      {isLogoutModalOpen && (
        <div
          className="
            fixed
            inset-0
            z-[100000]
            flex
            items-center
            justify-center
            p-4
          "
        >
          {/* BACKDROP */}

          <div
            className="
              absolute
              inset-0
              bg-black/45
              backdrop-blur-[3px]
            "
            onClick={closeLogoutModal}
          />

          {/* MODAL */}

          <div
            className="
              relative
              w-full
              max-w-[400px]
              bg-white
              rounded-2xl
              shadow-[0_30px_80px_-20px_rgba(22,63,32,0.45)]
              border
              border-[#163F20]/15
              overflow-hidden
              animate-scale-in
            "
          >
            {/* TOP ACCENT */}
            <div
              className="
                h-1
                w-full
                bg-gradient-to-r
                from-[#4C8A57]
                via-[#163F20]
                to-[#0F3219]
              "
            />

            {/* CLOSE */}

            <button
              type="button"
              onClick={closeLogoutModal}
              disabled={isLoggingOut}
              className="
                absolute
                right-4
                top-4

                w-8
                h-8

                rounded-full

                flex
                items-center
                justify-center

                text-[#59645C]

                hover:text-[#163F20]
                hover:bg-[#EAF3EA]

                transition-all

                disabled:opacity-50
                disabled:cursor-not-allowed
              "
              aria-label="Close"
            >
              <FiX className="text-[18px]" />
            </button>

            {/* CONTENT */}

            <div className="px-6 pt-7 pb-6">
              {/* LOGOUT ICON with 3D ring */}
              <div
                className="
                  relative
                  mx-auto
                  w-14
                  h-14
                  rounded-full
                  flex
                  items-center
                  justify-center
                  bg-gradient-to-br
                  from-[#EAF3EA]
                  to-[#D5E5D6]
                  border
                  border-[#163F20]/15
                  shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_6px_14px_-6px_rgba(22,63,32,0.25)]
                  mb-5
                "
              >
                <FiLogOut className="text-[25px] text-[#163F20]" />
              </div>

              {/* TITLE */}

              <h2
                className="
                  text-center
                  text-xl
                  font-bold
                  text-[#202721]
                "
              >
                Are you sure?
              </h2>

              {/* DESCRIPTION */}

              <p
                className="
                  mt-2
                  text-center
                  text-sm
                  leading-6
                  text-[#59645C]
                  px-2
                "
              >
                Are you sure you want to logout from the{" "}
                <span className="font-bold text-[#163F20]">Admin Portal</span>?
              </p>

              <p
                className="
                  mt-1
                  text-center
                  text-xs
                  text-[#89918B]
                "
              >
                You will need to login again to access your account.
              </p>

              {/* BUTTONS */}

              <div className="flex items-center gap-3 mt-7">
                {/* CANCEL */}

                <button
                  type="button"
                  onClick={closeLogoutModal}
                  disabled={isLoggingOut}
                  className="
                    flex-1
                    px-4
                    py-3
                    rounded-xl
                    border
                    border-[#163F20]/20
                    bg-white
                    text-[#59645C]
                    text-sm
                    font-bold
                    hover:bg-[#F5F7F5]
                    hover:text-[#163F20]
                    transition-all
                    duration-200
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  Cancel
                </button>

                {/* CONFIRM — 3D green */}

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="
                    flex-1
                    px-4
                    py-3
                    rounded-xl

                    bg-gradient-to-br
                    from-[#4C8A57]
                    via-[#163F20]
                    to-[#0F3219]

                    text-white
                    text-sm
                    font-bold

                    shadow-[0_10px_22px_-8px_rgba(22,63,32,0.6),inset_0_1px_0_rgba(255,255,255,0.25)]

                    hover:shadow-[0_14px_28px_-8px_rgba(22,63,32,0.7),inset_0_1px_0_rgba(255,255,255,0.35)]
                    hover:-translate-y-0.5

                    transition-all
                    duration-200

                    active:scale-[0.98]

                    disabled:opacity-60
                    disabled:cursor-not-allowed

                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >
                  {isLoggingOut ? (
                    <>
                      <span
                        className="
                          w-4
                          h-4
                          border-2
                          border-white/80
                          border-t-transparent
                          rounded-full
                          animate-spin
                        "
                      />
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
