import {
  useState,
  useEffect,
  useRef,
  useCallback,
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

        sessionStorage.setItem(
          "adminData",
          JSON.stringify(adminData)
        );
      }
    } catch (error) {
      console.error("Failed to fetch admin profile:", error);

      const storedAdmin = sessionStorage.getItem("adminData");

      if (storedAdmin) {
        try {
          setAdmin(JSON.parse(storedAdmin));
        } catch (error) {
          console.error("Invalid stored admin data:", error);
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
    const handleOutsideClick = (event: MouseEvent) => {
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

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // ===================================================
  // PRODUCT IMAGE
  // ===================================================

  const getProductImage = (
    product: GlobalSearchProduct
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
      | undefined
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

        const response = await headerApi.globalSearch({
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
    []
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
  // SEARCH NAVIGATION - FIXED
  // ===================================================

  const goToSearchResult = (
    type: "product" | "admin" | "user",
    item:
      | GlobalSearchProduct
      | GlobalSearchAdmin
      | GlobalSearchUser
  ) => {
    setSearch("");
    setIsSearchOpen(false);

    // =================================================
    // PRODUCT
    // Full product object sent through location.state
    // =================================================

    if (type === "product") {
      const product = item as GlobalSearchProduct;

      navigate("/inventory/products", {
        state: {
          product,
        },
      });

      return;
    }

    // =================================================
    // ADMIN
    // Full admin object sent through location.state
    // =================================================

    if (type === "admin") {
      const searchAdmin = item as GlobalSearchAdmin;

      navigate("/RoleManagement/addmember", {
        state: {
          admin: searchAdmin,
        },
      });

      return;
    }

    // =================================================
    // USER
    // Full user object sent through location.state
    // =================================================

    if (type === "user") {
      const user = item as GlobalSearchUser;

      navigate("/UserManagement", {
        state: {
          user,
        },
      });
    }
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = async () => {
    try {
      await adminApi.logout();

      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminData");
      sessionStorage.removeItem("adminPermissions");
      sessionStorage.removeItem("adminRoles");

      window.location.href = `${import.meta.env.BASE_URL}login`;
    } catch (error) {
      console.error("Logout failed:", error);

      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminData");
      sessionStorage.removeItem("adminPermissions");
      sessionStorage.removeItem("adminRoles");

      window.location.href = `${import.meta.env.BASE_URL}login`;
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
        h-[72px]
        w-full
        flex
        items-center
        justify-between
        px-3
        sm:px-4
        md:px-6
        bg-white/95
        backdrop-blur-xl
        border-b
        border-black/[0.06]
        shadow-[0_4px_20px_rgba(0,0,0,0.035)]
        transition-all
        duration-300

        ${
          isSidebarOpen
            ? "md:left-[280px] md:w-[calc(100%-280px)]"
            : "md:left-[90px] md:w-[calc(100%-90px)]"
        }
      `}
    >
      {/* ===================================================
          LEFT
      =================================================== */}

      <div className="flex items-center shrink-0">
        {/* DESKTOP SIDEBAR BUTTON */}

        <button
          type="button"
          onClick={onToggleSidebar}
          className="
            hidden
            md:flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            text-gray-500
            hover:text-gray-900
            hover:bg-gray-100
            transition-all
            duration-200
          "
          aria-label={
            isSidebarOpen
              ? "Collapse sidebar"
              : "Expand sidebar"
          }
        >
          {isSidebarOpen ? (
            <FiX size={23} />
          ) : (
            <FiMenu size={23} />
          )}
        </button>

        {/* MOBILE SIDEBAR BUTTON */}

        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="
            flex
            md:hidden
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            text-gray-500
            hover:text-gray-900
            hover:bg-gray-100
            transition-all
          "
          aria-label={
            isMobileSidebarOpen
              ? "Close menu"
              : "Open menu"
          }
        >
          {isMobileSidebarOpen ? (
            <FiX size={23} />
          ) : (
            <FiMenu size={23} />
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
          flex-1
          max-w-[680px]
          mx-2
          sm:mx-4
          md:mx-8
          min-w-0
        "
      >
        <div className="relative group">
          {/* SEARCH ICON */}

          <div
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              z-10
              text-gray-400
              group-focus-within:text-primary
              transition-colors
            "
          >
            <FiSearch size={18} />
          </div>

          {/* INPUT */}

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => {
              if (search.trim()) {
                setIsSearchOpen(true);
              }
            }}
            placeholder="Search products, users, admins..."
            autoComplete="off"
            className="
              w-full
              h-[44px]
              rounded-2xl
              border
              border-gray-200
              bg-gray-50/80
              pl-11
              pr-20
              text-sm
              text-gray-800
              placeholder:text-gray-400
              outline-none
              transition-all
              duration-200
              focus:bg-white
              focus:border-primary/40
              focus:ring-4
              focus:ring-primary/10
              hover:border-gray-300
            "
          />

          {/* SHORTCUT */}

          {!search && (
            <div
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                hidden
                sm:flex
                items-center
                gap-1
                rounded-lg
                border
                border-gray-200
                bg-white
                px-2
                py-1
                text-[10px]
                font-medium
                text-gray-400
                shadow-sm
              "
            >
              <FiCommand size={10} />
              <span>K</span>
            </div>
          )}

          {/* LOADER */}

          {isSearchLoading && (
            <FiLoader
              className="
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                animate-spin
                text-primary
              "
              size={18}
            />
          )}

          {/* CLEAR */}

          {!isSearchLoading && search && (
            <button
              type="button"
              onClick={clearSearch}
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                h-7
                w-7
                rounded-lg
                flex
                items-center
                justify-center
                text-gray-400
                hover:text-gray-700
                hover:bg-gray-100
                transition
              "
              aria-label="Clear search"
            >
              <IoCloseOutline size={18} />
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
              top-[52px]
              overflow-hidden
              rounded-2xl
              border
              border-gray-200
              bg-white
              shadow-[0_20px_55px_rgba(0,0,0,0.12)]
              z-[10000]
            "
          >
            {/* LOADING */}

            {isSearchLoading && !hasResults && (
              <div className="px-5 py-8 text-center">
                <div
                  className="
                    mx-auto
                    mb-3
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-primary/10
                    text-primary
                  "
                >
                  <FiLoader
                    size={20}
                    className="animate-spin"
                  />
                </div>

                <p className="text-sm font-semibold text-gray-800">
                  Searching...
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Looking across products, users and admins
                </p>
              </div>
            )}

            {/* NO RESULTS */}

            {!isSearchLoading &&
              search.trim() &&
              !hasResults && (
                <div className="px-5 py-9 text-center">
                  <div
                    className="
                      mx-auto
                      mb-3
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-2xl
                      bg-gray-100
                      text-gray-400
                    "
                  >
                    <FiSearch size={21} />
                  </div>

                  <p className="text-sm font-semibold text-gray-800">
                    No results found
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
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
                    px-4
                    py-3
                    backdrop-blur
                  "
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Search Results
                    </p>

                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {totalSearchItems} matching result
                      {totalSearchItems !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div
                    className="
                      max-w-[45%]
                      truncate
                      rounded-lg
                      bg-primary/10
                      px-2.5
                      py-1.5
                      text-[10px]
                      font-semibold
                      text-primary
                    "
                  >
                    {search.trim()}
                  </div>
                </div>

                {/* =================================================
                    PRODUCTS
                ================================================= */}

                {searchResults.products.length > 0 && (
                  <section className="border-b border-gray-100 py-2">
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        px-4
                        py-2
                      "
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-lg
                            bg-blue-50
                            text-blue-600
                          "
                        >
                          <FiPackage size={14} />
                        </div>

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-700">
                            Products
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[9px] font-semibold text-gray-500">
                        {searchResults.products.length}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      {searchResults.products.map((product) => {
                        const image = getProductImage(product);

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
                                product
                              )
                            }
                            className="
                              group
                              flex
                              w-full
                              items-center
                              gap-3
                              px-4
                              py-2.5
                              text-left
                              transition-all
                              hover:bg-gray-50
                            "
                          >
                            {/* IMAGE */}

                            <div
                              className="
                                relative
                                h-11
                                w-11
                                shrink-0
                                overflow-hidden
                                rounded-xl
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
                                  <FiPackage size={17} />
                                </div>
                              )}
                            </div>

                            {/* CONTENT */}

                            <div className="min-w-0 flex-1">
                              <p
                                className="
                                  truncate
                                  text-sm
                                  font-semibold
                                  text-gray-800
                                  group-hover:text-primary
                                "
                              >
                                {name}
                              </p>

                              {product.slug && (
                                <p className="mt-0.5 truncate text-[10px] text-gray-400">
                                  {product.slug}
                                </p>
                              )}
                            </div>

                            <div
                              className="
                                flex
                                h-7
                                w-7
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                text-gray-300
                                transition-all
                                group-hover:bg-primary/10
                                group-hover:text-primary
                              "
                            >
                              <FiChevronRight size={15} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* =================================================
                    ADMINS
                ================================================= */}

                {searchResults.admins.length > 0 && (
                  <section className="border-b border-gray-100 py-2">
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        px-4
                        py-2
                      "
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-lg
                            bg-violet-50
                            text-violet-600
                          "
                        >
                          <FiShield size={14} />
                        </div>

                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-700">
                          Admins
                        </p>
                      </div>

                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[9px] font-semibold text-gray-500">
                        {searchResults.admins.length}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      {searchResults.admins.map((searchAdmin) => {
                        const image =
                          getProfileImage(searchAdmin);

                        const roles =
                          searchAdmin.roles || [];

                        const permissionCount =
                          roles.reduce(
                            (total, role) =>
                              total +
                              (role.permissions?.length || 0),
                            0
                          );

                        return (
                          <button
                            key={`admin-${searchAdmin.id}`}
                            type="button"
                            onClick={() =>
                              goToSearchResult(
                                "admin",
                                searchAdmin
                              )
                            }
                            className="
                              group
                              flex
                              w-full
                              items-start
                              gap-3
                              px-4
                              py-3
                              text-left
                              transition-all
                              hover:bg-gray-50
                            "
                          >
                            {/* IMAGE */}

                            <div
                              className="
                                h-11
                                w-11
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
                                  className="
                                    h-full
                                    w-full
                                    object-cover
                                  "
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                                  {getInitials(
                                    searchAdmin.name
                                  )}
                                </div>
                              )}
                            </div>

                            {/* INFO */}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p
                                  className="
                                    truncate
                                    text-sm
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
                                    rounded-md
                                    bg-violet-50
                                    px-1.5
                                    py-0.5
                                    text-[8px]
                                    font-bold
                                    uppercase
                                    tracking-wide
                                    text-violet-600
                                  "
                                >
                                  Admin
                                </span>
                              </div>

                              <div className="mt-1 flex items-center gap-1.5">
                                <FiMail
                                  size={11}
                                  className="shrink-0 text-gray-400"
                                />

                                <p
                                  className="
                                    truncate
                                    text-[11px]
                                    text-gray-400
                                  "
                                >
                                  {searchAdmin.email}
                                </p>
                              </div>

                              {/* ROLES */}

                              {roles.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {roles
                                    .slice(0, 3)
                                    .map((role) => (
                                      <span
                                        key={role.id}
                                        className="
                                          rounded-md
                                          bg-gray-100
                                          px-1.5
                                          py-0.5
                                          text-[8px]
                                          font-medium
                                          text-gray-500
                                        "
                                      >
                                        {role.name}
                                      </span>
                                    ))}

                                  {roles.length > 3 && (
                                    <span className="px-1 text-[8px] font-medium text-gray-400">
                                      +
                                      {roles.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}

                              {permissionCount > 0 && (
                                <p className="mt-1 text-[9px] font-medium text-gray-400">
                                  {permissionCount} permission
                                  {permissionCount !== 1
                                    ? "s"
                                    : ""}
                                </p>
                              )}
                            </div>

                            <div
                              className="
                                mt-2
                                flex
                                h-7
                                w-7
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                text-gray-300
                                transition-all
                                group-hover:bg-primary/10
                                group-hover:text-primary
                              "
                            >
                              <FiChevronRight size={15} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* =================================================
                    USERS
                ================================================= */}

                {searchResults.users.length > 0 && (
                  <section className="py-2">
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        px-4
                        py-2
                      "
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-lg
                            bg-emerald-50
                            text-emerald-600
                          "
                        >
                          <FiUser size={14} />
                        </div>

                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-700">
                          Users
                        </p>
                      </div>

                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[9px] font-semibold text-gray-500">
                        {searchResults.users.length}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      {searchResults.users.map((user) => {
                        const image = getProfileImage(user);

                        return (
                          <button
                            key={`user-${user.id}`}
                            type="button"
                            onClick={() =>
                              goToSearchResult(
                                "user",
                                user
                              )
                            }
                            className="
                              group
                              flex
                              w-full
                              items-start
                              gap-3
                              px-4
                              py-3
                              text-left
                              transition-all
                              hover:bg-gray-50
                            "
                          >
                            {/* IMAGE */}

                            <div
                              className="
                                h-11
                                w-11
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
                                  className="
                                    h-full
                                    w-full
                                    object-cover
                                  "
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                                  {getInitials(user.name)}
                                </div>
                              )}
                            </div>

                            {/* INFO */}

                            <div className="min-w-0 flex-1">
                              <p
                                className="
                                  truncate
                                  text-sm
                                  font-semibold
                                  text-gray-800
                                  group-hover:text-primary
                                "
                              >
                                {user.name}
                              </p>

                              <div className="mt-1 flex items-center gap-1.5">
                                <FiMail
                                  size={11}
                                  className="shrink-0 text-gray-400"
                                />

                                <p
                                  className="
                                    truncate
                                    text-[11px]
                                    text-gray-400
                                  "
                                >
                                  {user.email}
                                </p>
                              </div>
                            </div>

                            <div
                              className="
                                mt-1
                                flex
                                h-7
                                w-7
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                text-gray-300
                                transition-all
                                group-hover:bg-primary/10
                                group-hover:text-primary
                              "
                            >
                              <FiChevronRight size={15} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* FOOTER */}

                <div
                  className="
                    border-t
                    border-gray-100
                    bg-gray-50/70
                    px-4
                    py-2.5
                  "
                >
                  <p className="text-center text-[9px] text-gray-400">
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

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* NOTIFICATION */}

        <Link to="/notifications">
          <button
            type="button"
            className="
              relative
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              text-gray-500
              transition-all
              hover:bg-gray-100
              hover:text-gray-900
            "
            aria-label="Notifications"
          >
            <IoNotificationsOutline size={21} />

            <span
              className="
                absolute
                right-[9px]
                top-[8px]
                h-2
                w-2
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
          to="/ChangePassword"
          className="hidden md:block"
        >
          <button
            type="button"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              text-gray-500
              transition-all
              hover:bg-gray-100
              hover:text-gray-900
            "
            aria-label="Settings"
          >
            <IoSettingsOutline size={20} />
          </button>
        </Link>

        {/* DIVIDER */}

        <div
          className="
            mx-1
            hidden
            h-7
            w-px
            bg-gray-200
            md:block
          "
        />

        {/* =================================================
            PROFILE
        ================================================= */}

        <div
          ref={dropdownRef}
          className="relative"
        >
          <button
            type="button"
            onClick={toggleDropdown}
            className="
              group
              flex
              items-center
              gap-2
              rounded-xl
              px-1.5
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
                h-9
                w-9
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
                    size={15}
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
                <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-white">
                  {getInitials(admin?.name)}
                </div>
              )}
            </div>

            {/* NAME */}

            <div
              className="
                hidden
                min-w-0
                max-w-[150px]
                text-left
                sm:block
                md:max-w-[180px]
              "
            >
              <p
                className="
                  truncate
                  text-[12px]
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
              >
                Administrator
              </p>
            </div>

            {/* ARROW */}

            <HiOutlineChevronDown
              className={`
                shrink-0
                text-[16px]
                text-gray-400
                transition-transform
                duration-200
                ${
                  isDropdownOpen
                    ? "rotate-180"
                    : ""
                }
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
                top-[52px]
                w-[320px]
                max-w-[calc(100vw-20px)]
                overflow-hidden
                rounded-2xl
                border
                border-gray-200
                bg-white
                shadow-[0_20px_60px_rgba(0,0,0,0.14)]
                z-[10001]
              "
            >
              {/* HEADER */}

              <div
                className="
                  bg-gradient-to-br
                  from-primary/[0.08]
                  via-white
                  to-gray-50
                  px-4
                  py-4
                "
              >
                <div className="flex items-center gap-3">
                  {/* IMAGE */}

                  <div
                    className="
                      h-12
                      w-12
                      shrink-0
                      overflow-hidden
                      rounded-2xl
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
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                        {getInitials(admin?.name)}
                      </div>
                    )}
                  </div>

                  {/* ADMIN */}

                  <div className="min-w-0 flex-1">
                    <p
                      className="
                        truncate
                        text-sm
                        font-bold
                        text-gray-900
                      "
                    >
                      {admin?.name || "Administrator"}
                    </p>

                    <p
                      className="
                        mt-0.5
                        truncate
                        text-[11px]
                        text-gray-400
                      "
                    >
                      {admin?.email || "admin@example.com"}
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  ROLES
              ================================================= */}

              {Array.isArray((admin as any)?.roles) &&
                (admin as any).roles.length > 0 && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className="
                          flex
                          h-7
                          w-7
                          items-center
                          justify-center
                          rounded-lg
                          bg-violet-50
                          text-violet-600
                        "
                      >
                        <FiShield size={13} />
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-gray-800">
                          Roles & Permissions
                        </p>

                        <p className="text-[9px] text-gray-400">
                          Access assigned to this admin
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(admin as any).roles.map(
                        (role: any, index: number) => (
                          <div
                            key={role.id ?? index}
                            className="
                              rounded-xl
                              border
                              border-gray-100
                              bg-gray-50
                              px-3
                              py-2.5
                            "
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-semibold text-gray-800">
                                {role.name}
                              </p>

                              {role.slug && (
                                <span className="shrink-0 text-[8px] text-gray-400">
                                  {role.slug}
                                </span>
                              )}
                            </div>

                            {role.description && (
                              <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-gray-400">
                                {role.description}
                              </p>
                            )}

                            {Array.isArray(role.permissions) &&
                              role.permissions.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {role.permissions
                                    .slice(0, 5)
                                    .map(
                                      (
                                        permission: any
                                      ) => (
                                        <span
                                          key={
                                            permission.id
                                          }
                                          className="
                                            rounded-md
                                            bg-white
                                            px-1.5
                                            py-1
                                            text-[8px]
                                            font-medium
                                            text-gray-500
                                            ring-1
                                            ring-gray-200
                                          "
                                        >
                                          {
                                            permission.name
                                          }
                                        </span>
                                      )
                                    )}

                                  {role.permissions.length >
                                    5 && (
                                    <span
                                      className="
                                        rounded-md
                                        bg-primary/10
                                        px-1.5
                                        py-1
                                        text-[8px]
                                        font-semibold
                                        text-primary
                                      "
                                    >
                                      +
                                      {role.permissions.length -
                                        5}{" "}
                                      more
                                    </span>
                                  )}
                                </div>
                              )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* =================================================
                  MENU
              ================================================= */}

              <div className="border-t border-gray-100 p-1.5">
                {/* PROFILE */}

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
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      text-left
                      text-sm
                      text-gray-700
                      transition
                      hover:bg-gray-50
                      hover:text-gray-900
                    "
                  >
                    <span
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        bg-gray-100
                        text-gray-500
                      "
                    >
                      <IoPersonOutline size={16} />
                    </span>

                    <span className="flex-1">
                      My Profile
                    </span>

                    <FiChevronRight
                      size={15}
                      className="text-gray-300"
                    />
                  </button>
                </Link>

                {/* SETTINGS */}

                <Link to="/ChangePassword">
                  <button
                    type="button"
                    onClick={() =>
                      setIsDropdownOpen(false)
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      text-left
                      text-sm
                      text-gray-700
                      transition
                      hover:bg-gray-50
                      hover:text-gray-900
                    "
                  >
                    <span
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        bg-gray-100
                        text-gray-500
                      "
                    >
                      <IoSettingsOutline size={16} />
                    </span>

                    <span className="flex-1">
                      Settings
                    </span>

                    <FiChevronRight
                      size={15}
                      className="text-gray-300"
                    />
                  </button>
                </Link>

                {/* LOGOUT */}

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
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    text-red-500
                    transition
                    hover:bg-red-50
                  "
                >
                  <span
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      bg-red-50
                    "
                  >
                    <IoLogOutOutline size={16} />
                  </span>

                  <span className="flex-1">
                    Logout
                  </span>
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