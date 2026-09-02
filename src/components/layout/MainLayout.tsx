import {
  Outlet,
  NavLink,
  useLocation,
} from "react-router-dom";

import { menuItems } from "@/config/menu";
import Header from "./Header";

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
// IMPORTANT:
// This component is OUTSIDE MainLayout so React doesn't
// remount the scroll container on every route/state update.
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
          AMBIENT GLOW
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -top-24
          left-1/2
          -translate-x-1/2
          w-72
          h-72
          rounded-full
          bg-[#b8902e]/[0.05]
          blur-3xl
        "
      />

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
          ${
            !isMobile && !isSidebarOpen
              ? "flex justify-center px-0"
              : ""
          }
        `}
      >
        <div
          className={`
            flex
            items-center
            gap-3
            transition-all
            duration-300
            ${
              !isMobile &&
              !isSidebarOpen
                ? "justify-center"
                : ""
            }
          `}
        >
          {/* LOGO IMAGE */}

          <div
            className="
              w-14
              h-14
              flex-shrink-0
              flex
              items-center
              justify-center
              rounded-2xl
              border
              border-[#b8902e]/25
              bg-[#faf8f3]
              p-1.5
            "
          >
            <img
              src={`${import.meta.env.BASE_URL}assets/logo.png`}
              alt="IndieKonnect Logo"
              className="w-full h-full object-contain"
            />
          </div>

          {/* BRAND */}

          {showLabels && (
            <div className="min-w-0">
              <h1
                className="
                  text-xl
                  font-serif
                  font-bold
                  text-[#2a2620]
                  leading-tight
                  tracking-tight
                "
              >
                IndieKonnect
              </h1>

              <p
                className="
                  mt-0.5
                  text-[10px]
                  font-medium
                  tracking-[0.25em]
                  uppercase
                  text-[#b8902e]
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
          via-[#b8902e]/35
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
          ${
            isMobile
              ? "pb-8"
              : ""
          }
          scrollbar-thin
          scrollbar-thumb-[#b8902e]/20
          scrollbar-track-transparent

          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-[#b8902e]/30
          [&::-webkit-scrollbar-track]:bg-transparent
          hover:[&::-webkit-scrollbar-thumb]:bg-[#b8902e]/50
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
            via-[#b8902e]/25
            to-transparent
          "
        />

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
            w-full
            flex
            items-center
            justify-center
            gap-3
            px-4
            py-3
            rounded-xl
            border
            border-[#b8902e]/40
            text-[#a8841c]

            hover:text-white
            hover:bg-gradient-to-r
            hover:from-[#d4af52]
            hover:to-[#a8841c]
            hover:border-transparent
            hover:shadow-lg
            hover:shadow-[#b8902e]/20

            transition-all
            duration-300
            active:scale-95

            disabled:opacity-60
            disabled:cursor-not-allowed

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
                  w-4
                  h-4
                  border-2
                  border-[#a8841c]
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
                    font-semibold
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
                    font-semibold
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

  // =====================================================
  // MOBILE SCROLL REFS
  // =====================================================

  const mobileNavRef =
    useRef<HTMLDivElement>(null);

  const mobileScrollTopRef =
    useRef(0);

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
    // Save current position before opening/closing.
    if (mobileNavRef.current) {
      mobileScrollTopRef.current =
        mobileNavRef.current.scrollTop;
    }

    setIsMobileSidebarOpen((prev) => !prev);
  };

  // =====================================================
  // CLOSE MOBILE SIDEBAR WHEN ROUTE CHANGES
  // =====================================================

  useEffect(() => {
    // Save current scroll position before the sidebar
    // closes because of navigation.

    if (mobileNavRef.current) {
      mobileScrollTopRef.current =
        mobileNavRef.current.scrollTop;
    }

    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // =====================================================
  // LOCK BODY SCROLL ON MOBILE
  // =====================================================

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

  // =====================================================
  // RESTORE MOBILE SIDEBAR SCROLL POSITION
  // =====================================================

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      if (!mobileNavRef.current) {
        return;
      }

      mobileNavRef.current.scrollTop =
        mobileScrollTopRef.current;
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    isMobileSidebarOpen,
    expandedMenus,
    location.pathname,
  ]);

  // =====================================================
  // MENU TOGGLE
  // =====================================================

  const toggleMenu = (path: string) => {
    // Important:
    // Save scroll before expanding/collapsing a dropdown.

    if (mobileNavRef.current) {
      mobileScrollTopRef.current =
        mobileNavRef.current.scrollTop;
    }

    setExpandedMenus((prev) =>
      prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path]
    );
  };

  // =====================================================
  // LOGOUT MODAL
  // =====================================================

  const openLogoutModal = () => {
    if (isLoggingOut) {
      return;
    }

    setIsLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    if (isLoggingOut) {
      return;
    }

    setIsLogoutModalOpen(false);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);

      await adminApi.logout();
    } catch (error) {
      console.error(
        "Logout API failed:",
        error
      );
    } finally {
      sessionStorage.removeItem(
        "adminToken"
      );

      sessionStorage.removeItem(
        "adminData"
      );

      sessionStorage.removeItem(
        "adminPermissions"
      );

      sessionStorage.removeItem(
        "adminRoles"
      );

      window.location.href =
        `${import.meta.env.BASE_URL}login`;
    }
  };

  // =====================================================
  // RENDER NAVIGATION ITEM
  // =====================================================

  const renderNavItem = (
    item: any,
    depth: number = 0,
    isMobile: boolean = false
  ): ReactNode => {
    const hasChildren =
      Array.isArray(item.children) &&
      item.children.length > 0;

    const isExpanded =
      expandedMenus.includes(item.path);

    const shouldShowLabels =
      isMobile ||
      isSidebarOpen ||
      depth > 0;

    // =====================================================
    // PARENT WITH CHILDREN
    // =====================================================

    if (hasChildren) {
      return (
        <div
          key={item.path}
          className="mb-1"
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
            className={`
              w-full
              flex
              items-center
              gap-3.5
              px-4
              py-2.5
              rounded-xl

              text-[#6b6152]

              hover:text-[#2a2620]
              hover:bg-[#b8902e]/[0.06]

              transition-all
              duration-300

              ${
                depth > 0
                  ? "ml-4"
                  : ""
              }

              ${
                !shouldShowLabels &&
                depth === 0
                  ? "justify-center px-0"
                  : ""
              }
            `}
          >
            <span
              className="
                material-symbols-outlined
                text-lg
                text-[#b8902e]
                flex-shrink-0
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
                    font-medium
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
                    text-[#b8902e]/70
                    transition-transform
                    duration-300
                    ease-out

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
                  border-[#b8902e]/20
                  pl-3
                  ml-6
                "
              >
                {item.children.map(
                  (child: any) =>
                    renderNavItem(
                      child,
                      depth + 1,
                      isMobile
                    )
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
        title={
          !shouldShowLabels &&
          depth === 0
            ? item.label
            : undefined
        }
        onClick={() => {
          // Save exact scroll position BEFORE navigation.
          if (
            isMobile &&
            mobileNavRef.current
          ) {
            mobileScrollTopRef.current =
              mobileNavRef.current.scrollTop;
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
                bg-gradient-to-r
                from-[#b8902e]/12
                via-[#b8902e]/5
                to-transparent
                text-[#7a5a12]
                font-semibold
              `
              : `
                text-[#6b6152]
                hover:text-[#2a2620]
                hover:bg-[#b8902e]/[0.06]
              `
          }

          ${
            depth > 0
              ? "ml-2"
              : ""
          }

          ${
            !shouldShowLabels &&
            depth === 0
              ? "justify-center px-0"
              : ""
          }
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
                  from-[#d4af52]
                  to-[#a8841c]
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
                        bg-[#b8902e]
                        scale-110
                        shadow-[0_0_0_3px_rgba(184,144,46,0.15)]
                      `
                      : `
                        bg-[#c9bda3]
                        group-hover:bg-[#b8902e]/70
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
                      ? "text-[#b8902e]"
                      : `
                        text-[#8a7f63]
                        group-hover:text-[#b8902e]
                      `
                  }
                `}
              >
                {item.icon}
              </span>
            )}

            {shouldShowLabels && (
              <span className="text-[13px] tracking-wide">
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
      {menuItems.map((item) =>
        renderNavItem(
          item,
          0,
          false
        )
      )}
    </>
  );

  const mobileNavContent = (
    <>
      {menuItems.map((item) =>
        renderNavItem(
          item,
          0,
          true
        )
      )}
    </>
  );

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-surface-subtle
        via-surface
        to-surface-subtle
        text-on-surface
        font-sans
      "
    >
      {/* =====================================================
          DESKTOP SIDEBAR
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

          bg-white
          border-r
          border-[#b8902e]/15

          flex-col

          pt-8
          pb-8
          px-5

          z-[9999]

          shadow-2xl
          shadow-black/[0.03]

          overflow-hidden
          overscroll-contain

          transition-all
          duration-300
          ease-in-out

          ${
            isSidebarOpen
              ? "w-[280px]"
              : "w-[90px]"
          }
        `}
      >
        <SidebarContent
          isSidebarOpen={
            isSidebarOpen
          }
          isMobile={false}
          navContent={
            desktopNavContent
          }
          onLogout={
            openLogoutModal
          }
          isLoggingOut={
            isLoggingOut
          }
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
          onClick={
            toggleMobileSidebar
          }
        />
      )}

      {/* =====================================================
          MOBILE SIDEBAR
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

          bg-white

          border-r
          border-[#b8902e]/15

          flex
          flex-col

          pt-8
          pb-8
          px-5

          z-[99999]

          shadow-2xl
          shadow-black/[0.2]

          overflow-hidden
          overscroll-contain

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
        {/* MOBILE CLOSE */}

        <button
          type="button"
          onClick={
            toggleMobileSidebar
          }
          className="
            absolute
            right-3
            top-3
            p-2
            rounded-full
            hover:bg-[#b8902e]/10
            transition-colors
            text-[#6b6152]
            z-10
          "
          aria-label="Close sidebar"
        >
          <FiX className="text-[22px]" />
        </button>

        <SidebarContent
          isSidebarOpen={true}
          isMobile={true}
          navContent={
            mobileNavContent
          }
          navRef={
            mobileNavRef
          }
          onLogout={
            openLogoutModal
          }
          isLoggingOut={
            isLoggingOut
          }
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
          isSidebarOpen={
            isSidebarOpen
          }
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
          LOGOUT MODAL
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
              bg-black/40
              backdrop-blur-[3px]
            "
            onClick={
              closeLogoutModal
            }
          />

          {/* MODAL */}

          <div
            className="
              relative
              w-full
              max-w-[400px]
              bg-white
              rounded-2xl
              shadow-2xl
              border
              border-[#b8902e]/20
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
                from-[#d4af52]
                via-[#b8902e]
                to-[#a8841c]
              "
            />

            {/* CLOSE */}

            <button
              type="button"
              onClick={
                closeLogoutModal
              }
              disabled={
                isLoggingOut
              }
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

                text-[#8a7f63]

                hover:text-[#2a2620]
                hover:bg-[#b8902e]/10

                transition-all

                disabled:opacity-50
                disabled:cursor-not-allowed
              "
              aria-label="Close"
            >
              <FiX className="text-[18px]" />
            </button>

            {/* CONTENT */}

            <div
              className="
                px-6
                pt-7
                pb-6
              "
            >
              {/* LOGOUT ICON */}

              <div
                className="
                  mx-auto
                  w-14
                  h-14

                  rounded-full

                  flex
                  items-center
                  justify-center

                  bg-[#b8902e]/10

                  border
                  border-[#b8902e]/20

                  mb-5
                "
              >
                <FiLogOut
                  className="
                    text-[25px]
                    text-[#a8841c]
                  "
                />
              </div>

              {/* TITLE */}

              <h2
                className="
                  text-center
                  text-xl
                  font-semibold
                  text-[#2a2620]
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
                  text-[#6b6152]
                  px-2
                "
              >
                Are you sure you want
                to logout from the
                <span
                  className="
                    font-medium
                    text-[#a8841c]
                  "
                >
                  {" "}
                  Admin Portal
                </span>
                ?
              </p>

              <p
                className="
                  mt-1
                  text-center
                  text-xs
                  text-[#8a7f63]
                "
              >
                You will need to login
                again to access your
                account.
              </p>

              {/* BUTTONS */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                  mt-7
                "
              >
                {/* CANCEL */}

                <button
                  type="button"
                  onClick={
                    closeLogoutModal
                  }
                  disabled={
                    isLoggingOut
                  }
                  className="
                    flex-1
                    px-4
                    py-3
                    rounded-xl
                    border
                    border-[#b8902e]/25
                    bg-white
                    text-[#6b6152]
                    text-sm
                    font-semibold
                    hover:bg-[#faf8f3]
                    hover:text-[#2a2620]
                    transition-all
                    duration-200
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  Cancel
                </button>

                {/* CONFIRM */}

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  disabled={
                    isLoggingOut
                  }
                  className="
                    flex-1
                    px-4
                    py-3
                    rounded-xl

                    bg-gradient-to-r
                    from-[#d4af52]
                    to-[#a8841c]

                    text-white
                    text-sm
                    font-semibold

                    shadow-md
                    shadow-[#b8902e]/20

                    hover:shadow-lg
                    hover:shadow-[#b8902e]/30

                    hover:from-[#c9a344]
                    hover:to-[#967719]

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
                      <FiLogOut
                        className="
                          text-[17px]
                        "
                      />

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