import { Outlet, NavLink, useLocation } from "react-router-dom";

import {
  warehouseMenuItems as menuItems,
} from "../../config/warehouseMenu";

import Header from "@/components/layout/Header";

import {
  useState,
  useEffect,
  useRef,
} from "react";

import type {
  ReactNode,
  RefObject,
} from "react";

import { adminApi } from "../../api/endpoints/Auth";

import {
  FiX,
  FiLogOut,
} from "react-icons/fi";


import {
  getPortalLoginUrl,
  getPortalName,
} from "@/config/portalConfig";

// =====================================================
// SIDEBAR CONTENT PROPS
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
// SIDEBAR CONTENT
// =====================================================

const SidebarContent = ({
  isSidebarOpen,
  isMobile,
  navContent,
  navRef,
  onLogout,
  isLoggingOut,
}: SidebarContentProps) => {
  const showLabels =
    isMobile || isSidebarOpen;

  // ===================================================
  // DYNAMIC PORTAL NAME
  // ===================================================

  const portalName = getPortalName();

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* =================================================
          SOFT BACKGROUND GLOW
      ================================================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="
            absolute
            -top-24
            left-1/2
            h-64
            w-64
            -translate-x-1/2
            rounded-full
            bg-[#163F20]
            opacity-[0.02]
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -bottom-24
            left-1/2
            h-64
            w-64
            -translate-x-1/2
            rounded-full
            bg-[#4C8A57]
            opacity-[0.015]
            blur-3xl
          "
        />
      </div>

      {/* =================================================
          LOGO
      ================================================= */}

      <div
        className={`
          relative
          flex-shrink-0
          pb-6
          ${
            !isMobile && !isSidebarOpen
              ? "flex justify-center"
              : ""
          }
        `}
      >
        <div
          className={`
            flex
            items-center
            gap-3
            ${
              !isMobile && !isSidebarOpen
                ? "justify-center"
                : ""
            }
          `}
        >
          {/* LOGO BOX */}

          <div
            className="
              flex
              h-[54px]
              w-[54px]
              flex-shrink-0
              items-center
              justify-center
              rounded-xl
              bg-white
              p-1
              shadow-[0_2px_8px_rgba(22,63,32,0.06)]
              ring-1
              ring-[#163F20]/5
            "
          >
            <img
              src={`${import.meta.env.BASE_URL}assets/logo.png`}
              alt="IndieKonnect Logo"
              className="h-full w-full object-contain"
            />
          </div>

          {/* BRAND NAME */}

          {showLabels && (
            <div className="min-w-0">
              <h1
                className="
                  text-[20px]
                  font-bold
                  leading-tight
                  tracking-[-0.02em]
                  text-[#163F20]
                "
              >
                IndieKonnect
              </h1>

              <p
                className="
                  mt-1
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.22em]
                  text-[#4C8A57]
                "
              >
                {portalName}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =================================================
          DIVIDER
      ================================================= */}

      <div className="mb-4 h-px w-full flex-shrink-0 bg-[#163F20]/8" />

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <div
        ref={navRef}
        className="
          relative
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
          px-0
          py-1

          [&::-webkit-scrollbar]:w-1
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-[#163F20]/15
          [&::-webkit-scrollbar-track]:bg-transparent
        "
      >
        <div className="flex min-h-full flex-col gap-1.5">
          {navContent}
        </div>
      </div>

      {/* =================================================
          LOGOUT
      ================================================= */}

      <div className="relative mt-4 flex-shrink-0 pt-4">
        <div className="mb-4 h-px w-full bg-[#163F20]/8" />

        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          title={
            !isMobile && !isSidebarOpen
              ? "Logout"
              : undefined
          }
          className={`
            group
            flex
            w-full
            items-center
            justify-center
            gap-2.5
            rounded-xl
            border
            border-[#163F20]/10
            bg-white
            px-3
            py-3
            text-[#163F20]
            shadow-[0_1px_4px_rgba(22,63,32,0.03)]
            transition-all
            duration-200

            hover:border-[#163F20]/20
            hover:bg-[#EAF3EA]

            active:scale-[0.98]

            disabled:cursor-not-allowed
            disabled:opacity-60

            ${
              !isMobile && !isSidebarOpen
                ? "px-0"
                : ""
            }
          `}
        >
          {isLoggingOut ? (
            <>
              <span
                className="
                  h-4
                  w-4
                  animate-spin
                  rounded-full
                  border-2
                  border-[#163F20]
                  border-t-transparent
                "
              />

              {showLabels && (
                <span
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.14em]
                  "
                >
                  Logging out...
                </span>
              )}
            </>
          ) : (
            <>
              <FiLogOut className="text-[16px]" />

              {showLabels && (
                <span
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.14em]
                  "
                >
                  Logout
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// =====================================================
// MAIN LAYOUT
// =====================================================

const WarehouseLayout = () => {
  const [expandedMenus, setExpandedMenus] =
    useState<string[]>([]);

  const [isLogoutModalOpen, setIsLogoutModalOpen] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(true);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
    useState(false);

  const location = useLocation();

  const mobileNavRef =
    useRef<HTMLDivElement>(null);

  // ===================================================
  // DYNAMIC PORTAL NAME
  // ===================================================

  const portalName = getPortalName();

  // ===================================================
  // DESKTOP SIDEBAR TOGGLE
  // ===================================================

  const toggleSidebar = () => {
    setIsSidebarOpen(
      (prev) => !prev,
    );
  };

  // ===================================================
  // MOBILE SIDEBAR TOGGLE
  // ===================================================

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(
      (prev) => !prev,
    );
  };

  // ===================================================
  // CLOSE MOBILE SIDEBAR ON ROUTE CHANGE
  // ===================================================

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // ===================================================
  // LOCK BODY SCROLL ON MOBILE
  // ===================================================

  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow =
        "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow =
        "";
    };
  }, [isMobileSidebarOpen]);

  // ===================================================
  // MENU TOGGLE
  // ===================================================

  const toggleMenu = (path: string) => {
    setExpandedMenus((prev) =>
      prev.includes(path)
        ? prev.filter(
            (item) => item !== path,
          )
        : [...prev, path],
    );
  };

  // ===================================================
  // LOGOUT MODAL
  // ===================================================

  const openLogoutModal = () => {
    if (isLoggingOut) return;

    setIsLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    if (isLoggingOut) return;

    setIsLogoutModalOpen(false);
  };

  // ===================================================
  // CLEAR ALL AUTH STORAGE
  // ===================================================

  const clearAllAuthStorage = () => {
    // =================================================
    // LOCAL STORAGE
    // =================================================

    try {
      localStorage.clear();
    } catch (error) {
      console.error(
        "Failed to clear localStorage:",
        error,
      );
    }

    // =================================================
    // SESSION STORAGE
    // =================================================

    try {
      sessionStorage.clear();
    } catch (error) {
      console.error(
        "Failed to clear sessionStorage:",
        error,
      );
    }

    // =================================================
    // COOKIES
    // =================================================

    try {
      document.cookie
        .split(";")
        .forEach((cookie) => {
          const cookieName =
            cookie.split("=")[0].trim();

          if (!cookieName) return;

          // Root path
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;

          // Current path
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${window.location.pathname}`;
        });
    } catch (error) {
      console.error(
        "Failed to clear cookies:",
        error,
      );
    }
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      // =================================================
      // IMPORTANT:
      // GET LOGIN URL BEFORE STORAGE CLEAR
      // =================================================

      const loginUrl =
        getPortalLoginUrl();

      const currentPortalName =
        getPortalName();

      console.log(
        "Logging out from:",
        currentPortalName,
      );

      console.log(
        "Current path:",
        window.location.pathname,
      );

      console.log(
        "Redirecting to:",
        loginUrl,
      );

      // =================================================
      // LOGOUT API
      // =================================================

      try {
        await adminApi.logout();
      } catch (error) {
        console.error(
          "Logout API failed:",
          error,
        );
      }

      // =================================================
      // CLEAR ALL STORAGE
      // =================================================

      clearAllAuthStorage();

      // =================================================
      // CLOSE MODAL
      // =================================================

      setIsLogoutModalOpen(false);

      // =================================================
      // REDIRECT
      // =================================================

      window.location.href = loginUrl;
    } catch (error) {
      console.error(
        "Logout failed:",
        error,
      );

      // =================================================
      // FORCE CLEAR STORAGE
      // =================================================

      clearAllAuthStorage();

      // =================================================
      // DYNAMIC FALLBACK LOGIN
      // =================================================

      const loginUrl =
        getPortalLoginUrl();

      window.location.href = loginUrl;
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ===================================================
  // RENDER NAV ITEM
  // ===================================================

  const renderNavItem = (
    item: any,
    depth: number = 0,
    isMobile: boolean = false,
  ): ReactNode => {
    // =================================================
    // SECTION HEADING
    // =================================================

    if (item.isHeading) {
      const shouldShowHeading =
        isMobile || isSidebarOpen;

      return (
        <div
          key={`heading-${item.label}`}
          className={`
            ${
              shouldShowHeading
                ? "px-2 pb-3 pt-5"
                : "flex justify-center px-0 py-4"
            }
          `}
        >
          {shouldShowHeading ? (
            <div className="flex items-center gap-2.5">
              <span className="h-px flex-1 bg-[#163F20]/8" />

              <span
                className="
                  whitespace-nowrap
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-[#9AA39B]
                "
              >
                {item.label}
              </span>

              <span className="h-px flex-1 bg-[#163F20]/8" />
            </div>
          ) : (
            <div className="h-px w-8 bg-[#163F20]/12" />
          )}
        </div>
      );
    }

    // =================================================
    // CHILDREN
    // =================================================

    const hasChildren =
      Array.isArray(item.children) &&
      item.children.length > 0;

    const isExpanded =
      expandedMenus.includes(item.path);

    const shouldShowLabels =
      isMobile ||
      isSidebarOpen ||
      depth > 0;

    // =================================================
    // PARENT WITH CHILDREN
    // =================================================

    if (hasChildren) {
      return (
        <div
          key={item.path}
          className="w-full"
        >
          <button
            type="button"
            onClick={() =>
              toggleMenu(item.path)
            }
            title={
              !shouldShowLabels &&
              depth === 0
                ? item.label
                : undefined
            }
            className="
              group
              flex
              w-full
              items-center
              gap-3
              rounded-lg
              px-3
              py-2.5
              text-[#59645C]
              transition-all
              duration-200

              hover:bg-[#EAF3EA]
              hover:text-[#163F20]
            "
          >
            <span
              className="
                material-symbols-outlined
                flex-shrink-0
                text-[19px]
                text-[#59645C]

                group-hover:text-[#163F20]
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
                    text-[12.5px]
                    font-medium
                  "
                >
                  {item.label}
                </span>

                <span
                  className={`
                    material-symbols-outlined
                    text-[16px]
                    text-[#163F20]/50
                    transition-transform
                    duration-300
                    ${
                      isExpanded
                        ? "rotate-180"
                        : ""
                    }
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

                ${
                  isExpanded
                    ? "max-h-[400px] opacity-100"
                    : "max-h-0 opacity-0"
                }
              `}
            >
              <div
                className="
                  ml-5
                  space-y-1
                  border-l
                  border-[#163F20]/10
                  pl-2
                "
              >
                {item.children.map(
                  (child: any) =>
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

    // =================================================
    // NORMAL MENU ITEM
    // =================================================

    return (
      <NavLink
        key={item.path}
        to={item.path}
        title={
          !shouldShowLabels &&
          depth === 0
            ? item.label
            : undefined
        }
        className={({ isActive }) => `
          group
          relative
          flex
          items-center
          gap-3
          rounded-lg
          px-3
          py-2.5
          transition-all
          duration-200

          ${
            isActive
              ? `
                bg-[#163F20]
                font-semibold
                text-white
                shadow-[0_3px_10px_rgba(22,63,32,0.12)]
              `
              : `
                text-[#59645C]
                hover:bg-[#EAF3EA]
                hover:text-[#163F20]
              `
          }

          ${
            !shouldShowLabels &&
            depth === 0
              ? "justify-center px-0"
              : ""
          }

          ${depth > 0 ? "ml-2" : ""}
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

                  ${
                    isActive
                      ? "bg-white"
                      : "bg-[#89918B]/50"
                  }
                `}
              />
            ) : (
              <span
                className={`
                  material-symbols-outlined
                  flex-shrink-0
                  text-[19px]

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
                  truncate
                  text-[13px]
                  tracking-[0.005em]

                  ${
                    isActive
                      ? "text-white"
                      : ""
                  }
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

  // ===================================================
  // NAVIGATION CONTENT
  // ===================================================

  const desktopNavContent = (
    <>
      {menuItems.map((item) =>
        renderNavItem(
          item,
          0,
          false,
        ),
      )}
    </>
  );

  const mobileNavContent = (
    <>
      {menuItems.map((item) =>
        renderNavItem(
          item,
          0,
          true,
        ),
      )}
    </>
  );

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen bg-[#F5F7F5] font-sans text-[#202721]">
      {/* =================================================
          DESKTOP SIDEBAR
      ================================================= */}

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

          border-r
          border-[#163F20]/8
          bg-white

          px-4
          pb-5
          pt-6

          md:flex

          transition-all
          duration-300
          ease-in-out

          ${
            isSidebarOpen
              ? "w-[260px]"
              : "w-[84px]"
          }
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

      {/* =================================================
          MOBILE BACKDROP
      ================================================= */}

      {isMobileSidebarOpen && (
        <div
          className="
            fixed
            inset-0
            z-[99999]
            bg-black/40
            md:hidden
          "
          onClick={toggleMobileSidebar}
        />
      )}

      {/* =================================================
          MOBILE SIDEBAR
      ================================================= */}

      <nav
        className={`
          fixed
          left-0
          top-0
          bottom-0
          z-[99999]

          flex
          h-screen
          w-[290px]
          flex-col
          overflow-hidden

          border-r
          border-[#163F20]/8
          bg-white

          px-4
          pb-5
          pt-6

          md:hidden

          transition-transform
          duration-300
          ease-in-out

          ${
            isMobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* MOBILE CLOSE BUTTON */}

        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="
            absolute
            right-3
            top-3
            z-10

            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full

            bg-transparent

            text-[#59645C]

            outline-none
            ring-0
            transition

            hover:bg-[#EAF3EA]
            hover:text-[#163F20]
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

      {/* =================================================
          MAIN CONTENT WRAPPER
      ================================================= */}

      <div className="flex min-h-screen w-full flex-col">
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className={`
            fixed
            left-0
            right-0
            top-0
            z-[9998]
            h-[72px]
            overflow-hidden
            bg-white

            transition-all
            duration-300
            ease-in-out

            ${
              isSidebarOpen
                ? "md:left-[260px]"
                : "md:left-[84px]"
            }
          `}
        >
          <Header
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={
              toggleSidebar
            }
            isMobileSidebarOpen={
              isMobileSidebarOpen
            }
            onToggleMobileSidebar={
              toggleMobileSidebar
            }
          />
        </div>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <main
          className={`
            min-h-screen
            flex-1
            pt-[72px]

            transition-all
            duration-300
            ease-in-out

            ${
              isSidebarOpen
                ? "md:ml-[260px]"
                : "md:ml-[84px]"
            }
          `}
        >
          <div className="mx-auto w-full max-w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* =================================================
          LOGOUT MODAL
      ================================================= */}

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
              bg-black/40
            "
            onClick={closeLogoutModal}
          />

          {/* MODAL */}

          <div
            className="
              relative
              w-full
              max-w-[400px]
              overflow-hidden
              rounded-2xl
              border
              border-[#163F20]/10
              bg-white
              shadow-2xl
            "
          >
            {/* TOP ACCENT */}

            <div className="h-1 w-full bg-[#163F20]" />

            {/* CLOSE */}

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
                text-[#59645C]
                transition-colors

                hover:bg-[#EAF3EA]
                hover:text-[#163F20]

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              aria-label="Close"
            >
              <FiX className="text-[18px]" />
            </button>

            {/* CONTENT */}

            <div className="px-6 pb-6 pt-7">
              {/* ICON */}

              <div
                className="
                  mx-auto
                  mb-5
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EAF3EA]
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
                  px-2
                  text-center
                  text-sm
                  leading-6
                  text-[#59645C]
                "
              >
                Are you sure you want to logout
                from the{" "}
                <span className="font-bold text-[#163F20]">
                  {portalName}
                </span>
                ?
              </p>

              <p
                className="
                  mt-1
                  text-center
                  text-xs
                  text-[#89918B]
                "
              >
                You will need to login again to
                access your account.
              </p>

              {/* BUTTONS */}

              <div className="mt-7 flex items-center gap-3">
                {/* CANCEL */}

                <button
                  type="button"
                  onClick={closeLogoutModal}
                  disabled={isLoggingOut}
                  className="
                    flex-1
                    rounded-xl
                    border
                    border-[#163F20]/15
                    bg-white
                    px-4
                    py-3
                    text-sm
                    font-bold
                    text-[#59645C]
                    transition

                    hover:bg-[#F5F7F5]
                    hover:text-[#163F20]

                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                {/* LOGOUT */}

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
                    bg-[#163F20]
                    px-4
                    py-3
                    text-sm
                    font-bold
                    text-white
                    transition

                    hover:bg-[#0F3219]
                    active:scale-[0.98]

                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {isLoggingOut ? (
                    <>
                      <span
                        className="
                          h-4
                          w-4
                          animate-spin
                          rounded-full
                          border-2
                          border-white/80
                          border-t-transparent
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

export default WarehouseLayout;