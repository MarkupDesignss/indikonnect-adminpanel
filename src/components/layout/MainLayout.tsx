// src/components/layout/MainLayout.tsx

import { Outlet, NavLink } from "react-router-dom";
import { menuItems } from "@/config/menu";
import Header from "./Header";
import { useState } from "react";

const MainLayout = () => {
  // No menu is expanded by default.
  // After page refresh, Inventory (or any other parent menu)
  // will remain collapsed until the user clicks it.
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (path: string) => {
    setExpandedMenus((prev) =>
      prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path]
    );
  };

  const renderNavItem = (item: any, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.path);

    // =====================================================
    // PARENT MENU WITH CHILDREN
    // =====================================================
    if (hasChildren) {
      return (
        <div key={item.path} className="mb-1">
          <button
            type="button"
            onClick={() => toggleMenu(item.path)}
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
              ${depth > 0 ? "ml-4" : ""}
            `}
          >
            <span className="material-symbols-outlined text-lg text-[#b8902e]">
              {item.icon}
            </span>

            <span className="flex-1 text-left text-[11px] font-medium uppercase tracking-[0.15em]">
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
                ${isExpanded ? "rotate-180" : ""}
              `}
            >
              expand_more
            </span>
          </button>

          {/* Animated Expand / Collapse */}
          <div
            className={`
              grid
              transition-all
              duration-300
              ease-in-out
              ${isExpanded
                ? "grid-rows-[1fr] opacity-100 mt-1"
                : "grid-rows-[0fr] opacity-0"
              }
            `}
          >
            <div className="overflow-hidden">
              <div className="space-y-1 border-l border-[#b8902e]/20 pl-3 ml-6">
                {item.children.map((child: any) =>
                  renderNavItem(child, depth + 1)
                )}
              </div>
            </div>
          </div>
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
        className={({ isActive }) =>
          `
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

          ${isActive
            ? "bg-gradient-to-r from-[#b8902e]/12 via-[#b8902e]/5 to-transparent text-[#7a5a12] font-semibold"
            : "text-[#6b6152] hover:text-[#2a2620] hover:bg-[#b8902e]/[0.06]"
          }

          ${depth > 0 ? "ml-2" : ""}
        `
        }
      >
        {({ isActive }) => (
          <>
            {/* Active Indicator */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-gradient-to-b from-[#d4af52] to-[#a8841c]" />
            )}

            {/* Sub Item Dot / Main Item Icon */}
            {depth > 0 ? (
              <span
                className={`
                  flex-shrink-0
                  w-2
                  h-2
                  rounded-full
                  transition-all
                  duration-300

                  ${isActive
                    ? "bg-[#b8902e] scale-110 shadow-[0_0_0_3px_rgba(184,144,46,0.15)]"
                    : "bg-[#c9bda3] group-hover:bg-[#b8902e]/70"
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

                  ${isActive
                    ? "text-[#b8902e]"
                    : "text-[#8a7f63] group-hover:text-[#b8902e]"
                  }
                `}
              >
                {item.icon}
              </span>
            )}

            <span className="text-[13px] tracking-wide">
              {item.label}
            </span>
          </>
        )}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-subtle via-surface to-surface-subtle text-on-surface font-sans">
      {/* =====================================================
          FIXED SIDEBAR
      ===================================================== */}
      <nav
        className="
          hidden md:flex

          fixed
          left-0
          top-0
          bottom-0

          w-[280px]
          h-screen

          bg-white

          border-r
          border-[#b8902e]/15

          flex-col

          pt-8
          pb-8
          px-5

          z-50

          shadow-2xl
          shadow-black/[0.03]

          overflow-hidden
        "
      >
        {/* Ambient Glow */}
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
        <div className="relative mb-6 px-2 flex-shrink-0">
          <div className="flex items-center gap-3">
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
                src="/assets/logo.png"
                alt="IndieKonnect Logo"
                className="w-full h-full object-contain"
              />
            </div>

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
          </div>
        </div>

        {/* Divider */}
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
            ONLY THIS AREA WILL SCROLL
        ===================================================== */}
        <div
          className="
            relative
            flex-1
            min-h-0
            overflow-y-auto
            overflow-x-hidden
            px-1
            space-y-1.5

            scrollbar-thin
            scrollbar-thumb-[#b8902e]/20
            scrollbar-track-transparent
          "
        >
          {menuItems.map((item) => renderNavItem(item))}
        </div>

        {/* =====================================================
            LOGOUT
        ===================================================== */}
        <div className="relative mt-2 pt-5 flex-shrink-0">
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

          <NavLink
            to="/logout"
            className="
              group

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
            "
          >
            <span
              className="
                material-symbols-outlined
                text-lg
                transition-transform
                duration-300
                group-hover:rotate-12
              "
            >
              logout
            </span>

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
          </NavLink>
        </div>
      </nav>

      {/* =====================================================
          MAIN CONTENT
          ml-[280px] = sidebar width
      ===================================================== */}
      <div
        className="
          min-h-screen
          flex
          flex-col

          w-full

          md:ml-[280px]
          md:w-[calc(100%-280px)]

          bg-surface-subtle/50
        "
      >
        {/* Header */}
        <Header />

        {/* Page Content */}

        <main className="flex-1 pt-[72px]">
          <div className="max-w-full mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;