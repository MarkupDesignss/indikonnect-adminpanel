import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

import { adminApi, AdminProfile } from "../../api/endpoints/Auth";

import headerApi, {
  GlobalSearchAdmin,
  GlobalSearchProduct,
  GlobalSearchUser,
} from "../../api/endpoints/header";

import {
  FiMenu,
  FiX,
  FiSearch,
  FiUser,
  FiShield,
  FiPackage,
  FiMail,
  FiLoader,
  FiChevronRight,
  FiCommand,
} from "react-icons/fi";

import {
  IoNotificationsOutline,
  IoSettingsOutline,
  IoPersonOutline,
  IoLogOutOutline,
  IoCloseOutline,
} from "react-icons/io5";

import { HiOutlineChevronDown } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import { getPortalLoginUrl } from "@/config/portalConfig";
import { usePortalInfo } from "../../pages/permissions/usePortalInfo";
import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// TYPES
// =====================================================

interface HeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;

  isMobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
}

interface SearchResults {
  products: GlobalSearchProduct[];
  admins: GlobalSearchAdmin[];
  users: GlobalSearchUser[];
  total_results: number;
}

// =====================================================
// HELPERS
// =====================================================

const getInitials = (name?: string) => {
  if (!name) return "A";

  const parts = name
    .trim()
    .split(" ")
    .filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return parts[0].slice(0, 2).toUpperCase();
};

/**
 * Role slug ko readable label me convert karo
 * e.g. "warehouse-manager" => "Warehouse Manager"
 */
const formatRoleLabel = (slug: string): string => {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

// =====================================================
// HEADER
// =====================================================

const Header = ({
  isSidebarOpen = true,
  onToggleSidebar,
  isMobileSidebarOpen = false,
  onToggleMobileSidebar,
}: HeaderProps) => {
  const navigate = useNavigate();

  // ===================================================
  // ✅ PORTAL INFO (URL + API combined)
  // ===================================================

  const {
    portalName,
    warehouseName,
    warehouseCode,
    isWarehousePortal,
  } = usePortalInfo();

  // ===================================================
  // ✅ PERMISSIONS (role ke liye)
  // ===================================================

  const { primaryRole, roles: adminRoles } = usePermissions();

  // ===================================================
  // ✅ DYNAMIC ROLE LABEL
  // ===================================================

  const roleLabel = useMemo(() => {
    if (primaryRole && adminRoles.length > 0) {
      const matched = adminRoles.find(
        (r) => r.slug === primaryRole,
      );

      if (matched?.name) {
        return matched.name;
      }
    }

    if (primaryRole) {
      return formatRoleLabel(primaryRole);
    }

    if (portalName) {
      return portalName;
    }

    return "Administrator";
  }, [primaryRole, adminRoles, portalName]);

  // ===================================================
  // ADMIN
  // ===================================================

  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ===================================================
  // SEARCH
  // ===================================================

  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const [searchResults, setSearchResults] = useState<SearchResults>({
    products: [],
    admins: [],
    users: [],
    total_results: 0,
  });

  // ===================================================
  // REFS
  // ===================================================

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchRequestRef = useRef(0);

  // ===================================================
  // FETCH ADMIN
  // ===================================================

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setIsLoading(true);

      const response = await adminApi.me();
      const adminData = response.data?.data?.admin;

      if (adminData) {
        setAdmin(adminData);

        localStorage.setItem(
          "adminData",
          JSON.stringify(adminData),
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch admin profile:",
        error,
      );

      const storedAdmin =
        localStorage.getItem("adminData");

      if (storedAdmin) {
        try {
          setAdmin(JSON.parse(storedAdmin));
        } catch (error) {
          console.error(
            "Invalid stored admin data:",
            error,
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ===================================================
  // OUTSIDE CLICK
  // ===================================================

  useEffect(() => {
    const handleOutsideClick = (
      event: MouseEvent,
    ) => {
      const target = event.target as Node;

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(target)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  // ===================================================
  // PRODUCT IMAGE
  // ===================================================

  const getProductImage = (
    product: GlobalSearchProduct,
  ): string | null => {
    if (product.image) {
      return product.image;
    }

    if (product.product_image) {
      return product.product_image;
    }

    if (product.thumbnail) {
      return product.thumbnail;
    }

    if (
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      const first = product.images[0];

      if (typeof first === "string") {
        return first;
      }

      return first?.image || first?.url || null;
    }

    return null;
  };

  // ===================================================
  // USER / ADMIN IMAGE
  // ===================================================

  const getProfileImage = (
    person:
      | GlobalSearchUser
      | GlobalSearchAdmin
      | null
      | undefined,
  ) => {
    if (!person) {
      return null;
    }

    return (
      person.profile_picture ||
      person.profile_image ||
      null
    );
  };

  // ===================================================
  // SEARCH API
  // ===================================================

  const performGlobalSearch = useCallback(
    async (value: string) => {
      const trimmedValue = value.trim();

      if (!trimmedValue) {
        setIsSearchOpen(false);

        setSearchResults({
          products: [],
          admins: [],
          users: [],
          total_results: 0,
        });

        return;
      }

      const requestId = ++searchRequestRef.current;

      try {
        setIsSearchLoading(true);
        setIsSearchOpen(true);

        const response =
          await headerApi.globalSearch({
            search: trimmedValue,
          });

        if (requestId !== searchRequestRef.current) {
          return;
        }

        const data = response.data?.data;

        setSearchResults({
          products: data?.products || [],
          admins: data?.admins || [],
          users: data?.users || [],
          total_results: data?.total_results || 0,
        });
      } catch (error) {
        console.error("Global search failed:", error);

        setSearchResults({
          products: [],
          admins: [],
          users: [],
          total_results: 0,
        });
      } finally {
        if (requestId === searchRequestRef.current) {
          setIsSearchLoading(false);
        }
      }
    },
    [],
  );

  // ===================================================
  // SEARCH DEBOUNCE
  // ===================================================

  useEffect(() => {
    const value = search.trim();

    if (!value) {
      setIsSearchOpen(false);

      setSearchResults({
        products: [],
        admins: [],
        users: [],
        total_results: 0,
      });

      return;
    }

    const timer = setTimeout(() => {
      performGlobalSearch(value);
    }, 350);

    return () => clearTimeout(timer);
  }, [search, performGlobalSearch]);

  // ===================================================
  // CLEAR SEARCH
  // ===================================================

  const clearSearch = () => {
    searchRequestRef.current += 1;

    setSearch("");
    setIsSearchOpen(false);

    setSearchResults({
      products: [],
      admins: [],
      users: [],
      total_results: 0,
    });
  };

  // ===================================================
  // SEARCH NAVIGATION
  // ===================================================

  const goToSearchResult = (
    type: "product" | "admin" | "user",
    item:
      | GlobalSearchProduct
      | GlobalSearchAdmin
      | GlobalSearchUser,
  ) => {
    setSearch("");
    setIsSearchOpen(false);

    if (type === "product") {
      const product = item as GlobalSearchProduct;

      navigate("/inventory/products", {
        state: { product },
      });

      return;
    }

    if (type === "admin") {
      const searchAdmin = item as GlobalSearchAdmin;

      navigate("/RoleManagement/addmember", {
        state: { admin: searchAdmin },
      });

      return;
    }

    if (type === "user") {
      const user = item as GlobalSearchUser;

      navigate("/UserManagement", {
        state: { user },
      });
    }
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = async () => {
    try {
      const loginUrl = getPortalLoginUrl();

      console.log(
        "Current path:",
        window.location.pathname,
      );

      console.log("Logout redirect:", loginUrl);

      try {
        await adminApi.logout();
      } catch (error) {
        console.error("Logout API failed:", error);
      }

      localStorage.clear();
      sessionStorage.clear();

      document.cookie
        .split(";")
        .forEach((cookie) => {
          const cookieName = cookie
            .split("=")[0]
            .trim();

          if (cookieName) {
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${window.location.pathname}`;
          }
        });

      setIsDropdownOpen(false);

      setSearch("");
      setIsSearchOpen(false);

      setSearchResults({
        products: [],
        admins: [],
        users: [],
        total_results: 0,
      });

      window.location.href = loginUrl;
    } catch (error) {
      console.error("Logout failed:", error);

      localStorage.clear();
      sessionStorage.clear();

      window.location.href = getPortalLoginUrl();
    }
  };

  // ===================================================
  // PROFILE
  // ===================================================

  const toggleDropdown = () => {
    setIsDropdownOpen((previous) => !previous);
  };

  // ===================================================
  // SEARCH STATE
  // ===================================================

  const hasResults =
    searchResults.products.length > 0 ||
    searchResults.admins.length > 0 ||
    searchResults.users.length > 0;

  const totalSearchItems =
    searchResults.products.length +
    searchResults.admins.length +
    searchResults.users.length;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <header
      className={`
        fixed
        top-0
        right-0
        z-[9999]
        flex
        h-[64px]
        w-full
        items-center
        justify-between
        border-b
        border-black/[0.06]
        bg-white/95
        px-3
        shadow-[0_2px_12px_rgba(0,0,0,0.04)]
        backdrop-blur-xl
        transition-all
        duration-300
        sm:px-4
        md:px-5

        ${
          isSidebarOpen
            ? "md:left-[260px] md:w-[calc(100%-260px)]"
            : "md:left-[76px] md:w-[calc(100%-76px)]"
        }
      `}
    >
      {/* ===================================================
          LEFT
      =================================================== */}

      <div className="flex shrink-0 items-center">
        {/* DESKTOP SIDEBAR BUTTON */}

        <button
          type="button"
          onClick={onToggleSidebar}
          className="
            hidden
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            text-gray-500
            transition-all
            duration-200
            hover:bg-gray-100
            hover:text-gray-900
            md:flex
          "
          aria-label={
            isSidebarOpen
              ? "Collapse sidebar"
              : "Expand sidebar"
          }
        >
          {isSidebarOpen ? (
            <FiX size={20} />
          ) : (
            <FiMenu size={20} />
          )}
        </button>

        {/* MOBILE SIDEBAR BUTTON */}

        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            text-gray-500
            transition-all
            hover:bg-gray-100
            hover:text-gray-900
            md:hidden
          "
          aria-label={
            isMobileSidebarOpen
              ? "Close menu"
              : "Open menu"
          }
        >
          {isMobileSidebarOpen ? (
            <FiX size={20} />
          ) : (
            <FiMenu size={20} />
          )}
        </button>
      </div>

      {/* ===================================================
          SEARCH
      =================================================== */}

      <div
        ref={searchRef}
        className="
          relative
          mx-2
          min-w-0
          max-w-[620px]
          flex-1
          sm:mx-3
          md:mx-6
        "
      >
        <div className="group relative">
          {/* SEARCH ICON */}

          <div
            className="
              absolute
              left-3.5
              top-1/2
              z-10
              -translate-y-1/2
              text-gray-400
              transition-colors
              group-focus-within:text-primary
            "
          >
            <FiSearch size={16} />
          </div>

          {/* INPUT */}

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            onFocus={() => {
              if (search.trim()) {
                setIsSearchOpen(true);
              }
            }}
            placeholder="Search products, users, admins..."
            autoComplete="off"
            className="
              h-[40px]
              w-full
              rounded-xl
              border
              border-gray-200
              bg-gray-50/80
              pl-10
              pr-16
              text-[13px]
              text-gray-800
              outline-none
              transition-all
              duration-200
              placeholder:text-gray-400
              hover:border-gray-300
              focus:border-primary/40
              focus:bg-white
              focus:ring-4
              focus:ring-primary/10
            "
          />

          {/* SHORTCUT */}

          {!search && (
            <div
              className="
                absolute
                right-2.5
                top-1/2
                hidden
                -translate-y-1/2
                items-center
                gap-1
                rounded-md
                border
                border-gray-200
                bg-white
                px-1.5
                py-0.5
                text-[9px]
                font-medium
                text-gray-400
                shadow-sm
                sm:flex
              "
            >
              <FiCommand size={9} />
              <span>K</span>
            </div>
          )}

          {/* LOADER */}

          {isSearchLoading && (
            <FiLoader
              className="
                absolute
                right-3.5
                top-1/2
                -translate-y-1/2
                animate-spin
                text-primary
              "
              size={16}
            />
          )}

          {/* CLEAR */}

          {!isSearchLoading && search && (
            <button
              type="button"
              onClick={clearSearch}
              className="
                absolute
                right-2.5
                top-1/2
                flex
                h-6
                w-6
                -translate-y-1/2
                items-center
                justify-center
                rounded-md
                text-gray-400
                transition
                hover:bg-gray-100
                hover:text-gray-700
              "
              aria-label="Clear search"
            >
              <IoCloseOutline size={16} />
            </button>
          )}
        </div>

        {/* ===================================================
            SEARCH RESULTS PANEL
        =================================================== */}

        {isSearchOpen && (
          <div
            className="
              absolute
              left-0
              right-0
              top-[48px]
              z-[10000]
              overflow-hidden
              rounded-xl
              border
              border-gray-200
              bg-white
              shadow-[0_16px_45px_rgba(0,0,0,0.12)]
            "
          >
            {/* LOADING */}

            {isSearchLoading && !hasResults && (
              <div className="px-5 py-7 text-center">
                <div
                  className="
                    mx-auto
                    mb-2.5
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-lg
                    bg-primary/10
                    text-primary
                  "
                >
                  <FiLoader
                    size={18}
                    className="animate-spin"
                  />
                </div>

                <p className="text-[13px] font-semibold text-gray-800">
                  Searching...
                </p>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  Looking across products, users and admins
                </p>
              </div>
            )}

            {/* NO RESULTS */}

            {!isSearchLoading &&
              search.trim() &&
              !hasResults && (
                <div className="px-5 py-8 text-center">
                  <div
                    className="
                      mx-auto
                      mb-2.5
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-gray-100
                      text-gray-400
                    "
                  >
                    <FiSearch size={19} />
                  </div>

                  <p className="text-[13px] font-semibold text-gray-800">
                    No results found
                  </p>

                  <p className="mt-0.5 text-[11px] text-gray-400">
                    Try a different name, email or product
                  </p>
                </div>
              )}

            {/* =================================================
                RESULTS
            ================================================= */}

            {hasResults && (
              <div className="max-h-[72vh] overflow-y-auto">
                {/* TOP BAR */}

                <div
                  className="
                    sticky
                    top-0
                    z-10
                    flex
                    items-center
                    justify-between
                    gap-3
                    border-b
                    border-gray-100
                    bg-white/95
                    px-3.5
                    py-2.5
                    backdrop-blur
                  "
                >
                  <div>
                    <p className="text-[12.5px] font-bold text-gray-900">
                      Search Results
                    </p>

                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {totalSearchItems} matching result
                      {totalSearchItems !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div
                    className="
                      max-w-[45%]
                      truncate
                      rounded-md
                      bg-primary/10
                      px-2
                      py-1
                      text-[9.5px]
                      font-semibold
                      text-primary
                    "
                  >
                    {search.trim()}
                  </div>
                </div>

                {/* PRODUCTS */}

                {searchResults.products.length > 0 && (
                  <section className="border-b border-gray-100 py-1.5">
                    <div className="flex items-center justify-between px-3.5 py-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="
                            flex
                            h-6
                            w-6
                            items-center
                            justify-center
                            rounded-md
                            bg-blue-50
                            text-blue-600
                          "
                        >
                          <FiPackage size={12} />
                        </div>

                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-700">
                          Products
                        </p>
                      </div>

                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[8.5px] font-semibold text-gray-500">
                        {searchResults.products.length}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      {searchResults.products.map(
                        (product) => {
                          const image =
                            getProductImage(product);

                          const name =
                            product.name ||
                            product.title ||
                            "Unnamed Product";

                          return (
                            <button
                              key={`product-${product.id}`}
                              type="button"
                              onClick={() =>
                                goToSearchResult(
                                  "product",
                                  product,
                                )
                              }
                              className="
                                group
                                flex
                                w-full
                                items-center
                                gap-2.5
                                px-3.5
                                py-2
                                text-left
                                transition-all
                                hover:bg-gray-50
                              "
                            >
                              <div
                                className="
                                  relative
                                  h-9
                                  w-9
                                  shrink-0
                                  overflow-hidden
                                  rounded-lg
                                  border
                                  border-gray-100
                                  bg-gray-50
                                "
                              >
                                {image ? (
                                  <img
                                    src={image}
                                    alt={name}
                                    className="
                                      h-full
                                      w-full
                                      object-cover
                                      transition-transform
                                      duration-300
                                      group-hover:scale-105
                                    "
                                    onError={(e) => {
                                      e.currentTarget.style.display =
                                        "none";
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                                    <FiPackage size={15} />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p
                                  className="
                                    truncate
                                    text-[12.5px]
                                    font-semibold
                                    text-gray-800
                                    group-hover:text-primary
                                  "
                                >
                                  {name}
                                </p>

                                {product.slug && (
                                  <p className="mt-0.5 truncate text-[9.5px] text-gray-400">
                                    {product.slug}
                                  </p>
                                )}
                              </div>

                              <div
                                className="
                                  flex
                                  h-6
                                  w-6
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-md
                                  text-gray-300
                                  transition-all
                                  group-hover:bg-primary/10
                                  group-hover:text-primary
                                "
                              >
                                <FiChevronRight size={13} />
                              </div>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </section>
                )}

                {/* ADMINS */}

                {searchResults.admins.length > 0 && (
                  <section className="border-b border-gray-100 py-1.5">
                    <div className="flex items-center justify-between px-3.5 py-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="
                            flex
                            h-6
                            w-6
                            items-center
                            justify-center
                            rounded-md
                            bg-violet-50
                            text-violet-600
                          "
                        >
                          <FiShield size={12} />
                        </div>

                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-700">
                          Admins
                        </p>
                      </div>

                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[8.5px] font-semibold text-gray-500">
                        {searchResults.admins.length}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      {searchResults.admins.map(
                        (searchAdmin) => {
                          const image =
                            getProfileImage(searchAdmin);

                          const roles =
                            searchAdmin.roles || [];

                          const permissionCount =
                            roles.reduce(
                              (total, role) =>
                                total +
                                (role.permissions
                                  ?.length || 0),
                              0,
                            );

                          return (
                            <button
                              key={`admin-${searchAdmin.id}`}
                              type="button"
                              onClick={() =>
                                goToSearchResult(
                                  "admin",
                                  searchAdmin,
                                )
                              }
                              className="
                                group
                                flex
                                w-full
                                items-start
                                gap-2.5
                                px-3.5
                                py-2.5
                                text-left
                                transition-all
                                hover:bg-gray-50
                              "
                            >
                              <div
                                className="
                                  h-9
                                  w-9
                                  shrink-0
                                  overflow-hidden
                                  rounded-full
                                  bg-gradient-to-br
                                  from-violet-500
                                  to-primary
                                  shadow-sm
                                  ring-2
                                  ring-white
                                "
                              >
                                {image ? (
                                  <img
                                    src={image}
                                    alt={searchAdmin.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                                    {getInitials(
                                      searchAdmin.name,
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p
                                    className="
                                      truncate
                                      text-[12.5px]
                                      font-semibold
                                      text-gray-800
                                      group-hover:text-primary
                                    "
                                  >
                                    {searchAdmin.name}
                                  </p>

                                  <span
                                    className="
                                      shrink-0
                                      rounded
                                      bg-violet-50
                                      px-1
                                      py-0.5
                                      text-[7.5px]
                                      font-bold
                                      uppercase
                                      tracking-wide
                                      text-violet-600
                                    "
                                  >
                                    Admin
                                  </span>
                                </div>

                                <div className="mt-1 flex items-center gap-1">
                                  <FiMail
                                    size={10}
                                    className="shrink-0 text-gray-400"
                                  />

                                  <p className="truncate text-[10px] text-gray-400">
                                    {searchAdmin.email}
                                  </p>
                                </div>

                                {roles.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {roles
                                      .slice(0, 3)
                                      .map((role) => (
                                        <span
                                          key={role.id}
                                          className="
                                            rounded
                                            bg-gray-100
                                            px-1.5
                                            py-0.5
                                            text-[7.5px]
                                            font-medium
                                            text-gray-500
                                          "
                                        >
                                          {role.name}
                                        </span>
                                      ))}

                                    {roles.length > 3 && (
                                      <span className="px-0.5 text-[7.5px] font-medium text-gray-400">
                                        +{roles.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                )}

                                {permissionCount > 0 && (
                                  <p className="mt-1 text-[8.5px] font-medium text-gray-400">
                                    {permissionCount} permission
                                    {permissionCount !== 1
                                      ? "s"
                                      : ""}
                                  </p>
                                )}
                              </div>

                              <div
                                className="
                                  mt-1.5
                                  flex
                                  h-6
                                  w-6
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-md
                                  text-gray-300
                                  transition-all
                                  group-hover:bg-primary/10
                                  group-hover:text-primary
                                "
                              >
                                <FiChevronRight size={13} />
                              </div>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </section>
                )}

                {/* USERS */}

                {searchResults.users.length > 0 && (
                  <section className="py-1.5">
                    <div className="flex items-center justify-between px-3.5 py-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="
                            flex
                            h-6
                            w-6
                            items-center
                            justify-center
                            rounded-md
                            bg-emerald-50
                            text-emerald-600
                          "
                        >
                          <FiUser size={12} />
                        </div>

                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-700">
                          Users
                        </p>
                      </div>

                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[8.5px] font-semibold text-gray-500">
                        {searchResults.users.length}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      {searchResults.users.map(
                        (user) => {
                          const image =
                            getProfileImage(user);

                          return (
                            <button
                              key={`user-${user.id}`}
                              type="button"
                              onClick={() =>
                                goToSearchResult(
                                  "user",
                                  user,
                                )
                              }
                              className="
                                group
                                flex
                                w-full
                                items-start
                                gap-2.5
                                px-3.5
                                py-2.5
                                text-left
                                transition-all
                                hover:bg-gray-50
                              "
                            >
                              <div
                                className="
                                  h-9
                                  w-9
                                  shrink-0
                                  overflow-hidden
                                  rounded-full
                                  bg-gradient-to-br
                                  from-emerald-400
                                  to-emerald-600
                                "
                              >
                                {image ? (
                                  <img
                                    src={image}
                                    alt={user.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                                    {getInitials(user.name)}
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p
                                  className="
                                    truncate
                                    text-[12.5px]
                                    font-semibold
                                    text-gray-800
                                    group-hover:text-primary
                                  "
                                >
                                  {user.name}
                                </p>

                                <div className="mt-1 flex items-center gap-1">
                                  <FiMail
                                    size={10}
                                    className="shrink-0 text-gray-400"
                                  />

                                  <p className="truncate text-[10px] text-gray-400">
                                    {user.email}
                                  </p>
                                </div>
                              </div>

                              <div
                                className="
                                  mt-1
                                  flex
                                  h-6
                                  w-6
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-md
                                  text-gray-300
                                  transition-all
                                  group-hover:bg-primary/10
                                  group-hover:text-primary
                                "
                              >
                                <FiChevronRight size={13} />
                              </div>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </section>
                )}

                {/* FOOTER */}

                <div
                  className="
                    border-t
                    border-gray-100
                    bg-gray-50/70
                    px-3.5
                    py-2
                  "
                >
                  <p className="text-center text-[8.5px] text-gray-400">
                    Click any result to open its details
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================================================
          RIGHT
      =================================================== */}

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        {/* NOTIFICATION */}

        <Link to="/notifications">
          <button
            type="button"
            className="
              relative
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-gray-500
              transition-all
              hover:bg-gray-100
              hover:text-gray-900
            "
            aria-label="Notifications"
          >
            <IoNotificationsOutline size={19} />

            <span
              className="
                absolute
                right-[8px]
                top-[7px]
                h-1.5
                w-1.5
                rounded-full
                bg-red-500
                ring-2
                ring-white
              "
            />
          </button>
        </Link>

        {/* SETTINGS */}

        <Link
          to="/SettingsManagement"
          className="hidden md:block"
        >
          <button
            type="button"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-gray-500
              transition-all
              hover:bg-gray-100
              hover:text-gray-900
            "
            aria-label="Settings"
          >
            <IoSettingsOutline size={18} />
          </button>
        </Link>

        {/* DIVIDER */}

        <div
          className="
            mx-1
            hidden
            h-6
            w-px
            bg-gray-200
            md:block
          "
        />

        {/* =================================================
            PROFILE
        ================================================= */}

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={toggleDropdown}
            className="
              group
              flex
              items-center
              gap-1.5
              rounded-lg
              px-1
              py-1
              transition-all
              hover:bg-gray-100
              focus:outline-none
            "
            aria-label="Profile menu"
          >
            {/* AVATAR */}

            <div
              className="
                relative
                h-8
                w-8
                shrink-0
                overflow-hidden
                rounded-full
                bg-gradient-to-br
                from-primary
                to-primary/70
                ring-2
                ring-primary/10
                transition-all
                group-hover:ring-primary/25
              "
            >
              {isLoading ? (
                <div className="flex h-full w-full items-center justify-center">
                  <FiLoader
                    size={13}
                    className="animate-spin text-white"
                  />
                </div>
              ) : admin?.profile_image ? (
                <img
                  src={admin.profile_image}
                  alt={admin.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                  {getInitials(admin?.name)}
                </div>
              )}
            </div>

            {/* NAME + ROLE */}

            <div
              className="
                hidden
                min-w-0
                max-w-[140px]
                text-left
                sm:block
                md:max-w-[170px]
              "
            >
              <p
                className="
                  truncate
                  text-[11.5px]
                  font-bold
                  leading-4
                  text-gray-800
                "
              >
                {isLoading
                  ? "Loading..."
                  : admin?.name || "Administrator"}
              </p>

              <p
                className="
                  hidden
                  truncate
                  text-[9px]
                  leading-3
                  text-gray-400
                  lg:block
                "
                title={roleLabel}
              >
                {roleLabel}
              </p>
            </div>

            {/* ARROW */}

            <HiOutlineChevronDown
              className={`
                shrink-0
                text-[14px]
                text-gray-400
                transition-transform
                duration-200
                ${isDropdownOpen ? "rotate-180" : ""}
              `}
            />
          </button>

          {/* =================================================
              PROFILE DROPDOWN
          ================================================= */}

          {isDropdownOpen && (
            <div
              className="
                absolute
                right-0
                top-[46px]
                z-[10001]
                w-[300px]
                max-w-[calc(100vw-20px)]
                overflow-hidden
                rounded-xl
                border
                border-gray-200
                bg-white
                shadow-[0_16px_50px_rgba(0,0,0,0.14)]
              "
            >
              {/* HEADER */}

              <div
                className="
                  bg-gradient-to-br
                  from-primary/[0.08]
                  via-white
                  to-gray-50
                  px-3.5
                  py-3.5
                "
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="
                      h-11
                      w-11
                      shrink-0
                      overflow-hidden
                      rounded-xl
                      bg-gradient-to-br
                      from-primary
                      to-primary/70
                      ring-2
                      ring-primary/10
                    "
                  >
                    {admin?.profile_image ? (
                      <img
                        src={admin.profile_image}
                        alt={admin.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[13px] font-bold text-white">
                        {getInitials(admin?.name)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-gray-900">
                      {admin?.name || "Administrator"}
                    </p>

                    <p className="mt-0.5 truncate text-[10px] text-gray-400">
                      {admin?.email || "admin@example.com"}
                    </p>

                    {/* ✅ DYNAMIC ROLE + PORTAL */}

                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span
                        className="
                          inline-flex
                          items-center
                          gap-1
                          rounded
                          bg-primary/10
                          px-1.5
                          py-0.5
                          text-[8.5px]
                          font-bold
                          uppercase
                          tracking-wide
                          text-primary
                        "
                      >
                        <FiShield size={8} />
                        {roleLabel}
                      </span>

                      {isWarehousePortal &&
                        warehouseName && (
                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1
                              truncate
                              rounded
                              bg-emerald-50
                              px-1.5
                              py-0.5
                              text-[8.5px]
                              font-semibold
                              text-emerald-700
                            "
                            title={`${warehouseName}${
                              warehouseCode
                                ? ` (${warehouseCode})`
                                : ""
                            }`}
                          >
                            {warehouseName}
                            {warehouseCode &&
                              ` (${warehouseCode})`}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ROLES */}

              {Array.isArray((admin as any)?.roles) &&
                (admin as any).roles.length > 0 && (
                  <div className="border-t border-gray-100 px-3.5 py-2.5">
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className="
                          flex
                          h-6
                          w-6
                          items-center
                          justify-center
                          rounded-md
                          bg-violet-50
                          text-violet-600
                        "
                      >
                        <FiShield size={11} />
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-gray-800">
                          Roles & Permissions
                        </p>

                        <p className="text-[8.5px] text-gray-400">
                          Access assigned to this admin
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {(admin as any).roles.map(
                        (role: any, index: number) => (
                          <div
                            key={role.id ?? index}
                            className="
                              rounded-lg
                              border
                              border-gray-100
                              bg-gray-50
                              px-2.5
                              py-2
                            "
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-[11px] font-semibold text-gray-800">
                                {role.name}
                              </p>

                              {role.slug && (
                                <span className="shrink-0 text-[7.5px] text-gray-400">
                                  {role.slug}
                                </span>
                              )}
                            </div>

                            {role.description && (
                              <p className="mt-0.5 line-clamp-2 text-[8.5px] leading-3.5 text-gray-400">
                                {role.description}
                              </p>
                            )}

                            {Array.isArray(
                              role.permissions,
                            ) &&
                              role.permissions.length >
                                0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {role.permissions
                                    .slice(0, 5)
                                    .map(
                                      (permission: any) => (
                                        <span
                                          key={
                                            permission.id
                                          }
                                          className="
                                            rounded
                                            bg-white
                                            px-1.5
                                            py-0.5
                                            text-[7.5px]
                                            font-medium
                                            text-gray-500
                                            ring-1
                                            ring-gray-200
                                          "
                                        >
                                          {permission.name}
                                        </span>
                                      ),
                                    )}

                                  {role.permissions.length >
                                    5 && (
                                    <span
                                      className="
                                        rounded
                                        bg-primary/10
                                        px-1.5
                                        py-0.5
                                        text-[7.5px]
                                        font-semibold
                                        text-primary
                                      "
                                    >
                                      +
                                      {role.permissions
                                        .length - 5}{" "}
                                      more
                                    </span>
                                  )}
                                </div>
                              )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* MENU */}

              <div className="border-t border-gray-100 p-1.5">
                <Link to="/UpdateProfile">
                  <button
                    type="button"
                    onClick={() =>
                      setIsDropdownOpen(false)
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-2.5
                      rounded-lg
                      px-2.5
                      py-2
                      text-left
                      text-[12.5px]
                      text-gray-700
                      transition
                      hover:bg-gray-50
                      hover:text-gray-900
                    "
                  >
                    <span
                      className="
                        flex
                        h-7
                        w-7
                        items-center
                        justify-center
                        rounded-md
                        bg-gray-100
                        text-gray-500
                      "
                    >
                      <IoPersonOutline size={14} />
                    </span>

                    <span className="flex-1">
                      My Profile
                    </span>

                    <FiChevronRight
                      size={13}
                      className="text-gray-300"
                    />
                  </button>
                </Link>

                <Link to="/SettingsManagement">
                  <button
                    type="button"
                    onClick={() =>
                      setIsDropdownOpen(false)
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-2.5
                      rounded-lg
                      px-2.5
                      py-2
                      text-left
                      text-[12.5px]
                      text-gray-700
                      transition
                      hover:bg-gray-50
                      hover:text-gray-900
                    "
                  >
                    <span
                      className="
                        flex
                        h-7
                        w-7
                        items-center
                        justify-center
                        rounded-md
                        bg-gray-100
                        text-gray-500
                      "
                    >
                      <IoSettingsOutline size={14} />
                    </span>

                    <span className="flex-1">
                      Settings
                    </span>

                    <FiChevronRight
                      size={13}
                      className="text-gray-300"
                    />
                  </button>
                </Link>

                <div className="my-1 border-t border-gray-100" />

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleLogout();
                  }}
                  className="
                    flex
                    w-full
                    items-center
                    gap-2.5
                    rounded-lg
                    px-2.5
                    py-2
                    text-left
                    text-[12.5px]
                    text-red-500
                    transition
                    hover:bg-red-50
                  "
                >
                  <span
                    className="
                      flex
                      h-7
                      w-7
                      items-center
                      justify-center
                      rounded-md
                      bg-red-50
                    "
                  >
                    <IoLogOutOutline size={14} />
                  </span>

                  <span className="flex-1">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;