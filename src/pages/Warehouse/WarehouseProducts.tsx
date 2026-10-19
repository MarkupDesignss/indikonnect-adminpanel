import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
  FiBox,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiPercent,
  FiAward,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";

import warehouseStocksApi, {
  WarehouseProduct,
} from "@/api/endpoints/warehouseStocks";

import logoApi from "@/api/endpoints/logoApi";

import { usePermissions } from "@/pages/permissions/usePermissions";

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

// =====================================================
// TYPES
// =====================================================

const STOCK_STATUS_META = {
  in_stock: {
    label: "In Stock",
    color: "text-[#2D6FE8]",
    bg: "bg-[#EAF3FF]",
    border: "border-[#2D6FE8]/25",
    icon: FiCheckCircle,
  },

  low_stock: {
    label: "Low Stock",
    color: "text-[#A16207]",
    bg: "bg-[#FEF9C3]",
    border: "border-[#FACC15]/40",
    icon: FiAlertTriangle,
  },

  out_of_stock: {
    label: "Out of Stock",
    color: "text-[#C23B32]",
    bg: "bg-[#FEF2F2]",
    border: "border-[#C23B32]/25",
    icon: FiXCircle,
  },
} as const;

type StockStatus = keyof typeof STOCK_STATUS_META;

// =====================================================
// HELPER COMPONENTS
// =====================================================

const StatBadge = ({
  icon: Icon,
  value,
  color = "text-[#2D6FE8]",
  bg = "bg-[#EAF3FF]",
}: {
  icon: any;
  value: string | number;
  color?: string;
  bg?: string;
}) => (
  <div
    className={`flex items-center gap-1.5 rounded-lg border border-transparent ${bg} px-2.5 py-1.5`}
  >
    <Icon className={`text-[13px] ${color}`} />

    <span className="text-[11px] font-semibold text-[#111827]">
      {value}
    </span>
  </div>
);

// =====================================================
// LOGO LOADING STATE
// Same-file component — content area only
// =====================================================

interface PermissionLoadingProps {
  logoUrl: string | null;
}

const PermissionLoading: React.FC<PermissionLoadingProps> = ({
  logoUrl,
}) => {
  const [displayLogo, setDisplayLogo] = useState(
    logoUrl || DEFAULT_LOGO_URL,
  );

  useEffect(() => {
    setDisplayLogo(logoUrl || DEFAULT_LOGO_URL);
  }, [logoUrl]);

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center overflow-hidden rounded-xl bg-[#F4F8FD] p-6 font-poppins">
      <motion.img
        key={displayLogo}
        src={displayLogo}
        alt="IndieKonnect Logo"
        referrerPolicy="no-referrer"
        className="block max-h-[120px] max-w-[240px] object-contain"
        initial={{
          opacity: 0.6,
          scale: 0.96,
        }}
        animate={{
          opacity: [0.8, 1, 0.8],
          scale: [0.98, 1, 0.98],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        onError={() => {
          if (displayLogo !== DEFAULT_LOGO_URL) {
            setDisplayLogo(DEFAULT_LOGO_URL);
          }
        }}
      />
    </div>
  );
};

// =====================================================
// ACCESS DENIED
// =====================================================

const AccessDenied: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
      <div className="w-full max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-[0_8px_30px_rgba(45,111,232,0.08)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
          <FiAlertCircle size={26} />
        </div>

        <h2 className="text-lg font-bold text-[#111827]">
          Access Denied
        </h2>

        <p className="mt-2 text-sm text-[#6B7280]">
          You don't have permission to access the Warehouse Products module.
        </p>

        <div className="mt-5 rounded-xl border border-[#C23B32]/15 bg-[#FEF2F2] px-4 py-3 text-[10px] font-semibold text-[#C23B32]">
          Contact your administrator to request access.
        </div>
      </div>
    </div>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const WarehouseProducts = () => {
  const { warehouseId: paramWarehouseId } = useParams<{
    warehouseId: string;
  }>();

  // ===================================================
  // WAREHOUSE ID
  // ===================================================

  const warehouseId = Number(paramWarehouseId) || 1;

  // ===================================================
  // PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  // ===================================================
  // VIEW PERMISSION
  // ===================================================

  const canViewWarehouseProducts = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("warehouse_product.view"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // INITIAL LOADING STATES
  // ===================================================

  const [initialDataLoading, setInitialDataLoading] =
    useState(true);

  const [logoLoading, setLogoLoading] =
    useState(true);

  const [logoUrl, setLogoUrl] = useState<string>(
    DEFAULT_LOGO_URL,
  );

  // Track the first products request separately from refreshes.
  const hasStartedInitialFetch = useRef(false);

  // ===================================================
  // STATE
  // ===================================================

  const [products, setProducts] = useState<WarehouseProduct[]>([]);

  const [warehouseName, setWarehouseName] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);

  const [perPage] = useState(25);

  const [search, setSearch] = useState("");

  const [totalPages, setTotalPages] = useState(1);

  const [total, setTotal] = useState(0);

  // ===================================================
  // FETCH LOGO
  // ===================================================

  useEffect(() => {
    let isMounted = true;

    const fetchLogo = async () => {
      try {
        const response = await logoApi.getLogo();
        const responseData = response?.data as any;

        const receivedLogo =
          responseData?.data?.logo ||
          responseData?.logo ||
          responseData?.data?.data?.logo ||
          responseData?.data?.data?.data?.logo;

        if (
          isMounted &&
          typeof receivedLogo === "string" &&
          receivedLogo.trim()
        ) {
          setLogoUrl(receivedLogo.trim());
        }
      } catch (error) {
        console.error("Fetch logo error:", error);

        // Keep the default logo if the logo API fails.
        if (isMounted) {
          setLogoUrl(DEFAULT_LOGO_URL);
        }
      } finally {
        if (isMounted) {
          setLogoLoading(false);
        }
      }
    };

    void fetchLogo();

    return () => {
      isMounted = false;
    };
  }, []);

  // ===================================================
  // FETCH PRODUCTS
  // ===================================================

  const fetchProducts = useCallback(
    async (isInitialLoad = false) => {
      try {
        setIsLoading(true);

        const res = await warehouseStocksApi.getByWarehouse(
          warehouseId,
          {
            page,
            per_page: perPage,
          },
        );

        if (res.data) {
          setProducts(res.data.data ?? []);

          setWarehouseName(
            res.data.warehouse?.name ?? "",
          );

          setTotal(
            res.data.pagination?.total ?? 0,
          );

          setTotalPages(
            Math.max(
              res.data.pagination?.last_page ?? 1,
              1,
            ),
          );
        }
      } catch (err: any) {
        console.error(
          "Warehouse products fetch error:",
          err,
        );

        toast.error(
          err?.response?.data?.message ||
            "Failed to load warehouse products",
        );
      } finally {
        setIsLoading(false);

        // Only the first request releases initial-page loading.
        // Refresh and pagination keep using the table spinner.
        if (isInitialLoad) {
          setInitialDataLoading(false);
        }
      }
    },
    [warehouseId, page, perPage],
  );

  // ===================================================
  // FETCH AFTER PERMISSION CHECK
  // ===================================================

  useEffect(() => {
    if (permissionsLoading) {
      return;
    }

    if (!canViewWarehouseProducts) {
      setIsLoading(false);
      setInitialDataLoading(false);
      return;
    }

    const isInitialLoad = !hasStartedInitialFetch.current;

    hasStartedInitialFetch.current = true;

    void fetchProducts(isInitialLoad);
  }, [
    permissionsLoading,
    canViewWarehouseProducts,
    fetchProducts,
  ]);

  // ===================================================
  // COMBINED INITIAL LOADING
  // ===================================================

  const pageLoading =
    permissionsLoading ||
    logoLoading ||
    initialDataLoading;

  // ===================================================
  // CLIENT-SIDE SEARCH
  // ===================================================

  const filteredProducts = useMemo(() => {
    if (!search.trim()) {
      return products;
    }

    const q = search.toLowerCase().trim();

    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.product_code?.toLowerCase().includes(q) ||
        p.brand?.title?.toLowerCase().includes(q) ||
        p.category?.title?.toLowerCase().includes(q) ||
        p.subcategory?.name?.toLowerCase().includes(q),
    );
  }, [products, search]);

  // ===================================================
  // HELPERS
  // ===================================================

  const formatCurrency = (
    value: string | number,
  ) => {
    const num =
      typeof value === "string"
        ? parseFloat(value)
        : value;

    if (isNaN(num)) {
      return "—";
    }

    return `₹${num.toLocaleString("en-IN")}`;
  };

  const getStockStatus = (
    product: WarehouseProduct,
  ): StockStatus => {
    const status = product.warehouse_stock?.stock_status;

    if (
      status === "in_stock" ||
      status === "low_stock" ||
      status === "out_of_stock"
    ) {
      return status;
    }

    return "out_of_stock";
  };

  // ===================================================
  // LOGO LOADING STATE
  // ===================================================

  if (pageLoading) {
    return <PermissionLoading logoUrl={logoUrl} />;
  }

  // ===================================================
  // ACCESS DENIED
  // ===================================================

  if (!canViewWarehouseProducts) {
    return <AccessDenied />;
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen bg-white p-4 font-poppins md:p-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />

            <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />

            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#2D6FE8]">
              Warehouse Management
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#2D6FE8]/15 bg-[#EAF3FF]">
              <FiBox className="text-[20px] text-[#2D6FE8]" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#111827] md:text-2xl">
                All Products
              </h1>

              <p className="mt-0.5 text-xs text-[#6B7280] md:text-sm">
                {warehouseName
                  ? `Warehouse: ${warehouseName}`
                  : "Warehouse inventory"}

                {total > 0 &&
                  ` • ${total} product${total > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH */}

        <div className="relative w-full md:w-[320px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2D6FE8]" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] py-2.5 pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#6B7280] outline-none transition-colors focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
          />
        </div>
      </div>

      {/* =================================================
          STATS
      ================================================= */}

      {!isLoading && products.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <StatBadge
            icon={FiPackage}
            value={`${total} Total`}
            bg="bg-[#EAF3FF]"
            color="text-[#2D6FE8]"
          />

          <StatBadge
            icon={FiCheckCircle}
            value={`${
              products.filter(
                (p) => getStockStatus(p) === "in_stock",
              ).length
            } In Stock`}
            bg="bg-[#EAF3FF]"
            color="text-[#2D6FE8]"
          />

          <StatBadge
            icon={FiAlertTriangle}
            value={`${
              products.filter(
                (p) => getStockStatus(p) === "low_stock",
              ).length
            } Low Stock`}
            bg="bg-[#FEF9C3]"
            color="text-[#A16207]"
          />

          <StatBadge
            icon={FiXCircle}
            value={`${
              products.filter(
                (p) => getStockStatus(p) === "out_of_stock",
              ).length
            } Out of Stock`}
            bg="bg-[#FEF2F2]"
            color="text-[#C23B32]"
          />
        </div>
      )}

      {/* =================================================
          TABLE CARD
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white shadow-[0_4px_20px_rgba(45,111,232,0.06)]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FiRefreshCw
                size={22}
                className="animate-spin"
              />
            </div>

            <p className="text-sm font-semibold text-[#111827]">
              Loading products...
            </p>

            <p className="text-[10px] text-[#6B7280]">
              Fetching warehouse product data.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF3FF]">
              <FiPackage className="text-[28px] text-[#2D6FE8]" />
            </div>

            <h3 className="text-base font-semibold text-[#111827]">
              No products found
            </h3>

            <p className="text-sm text-[#6B7280]">
              {search
                ? "Try a different search term"
                : "This warehouse has no products yet"}
            </p>
          </div>
        ) : (
          <>
            {/* TABLE */}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-[55px]" />
                  <col className="w-[24%]" />
                  <col className="w-[9%]" />
                  <col className="w-[14%]" />
                  <col className="w-[13%]" />
                  <col className="w-[10%]" />
                  <col className="w-[9%]" />
                  <col className="w-[14%]" />
                </colgroup>

                <thead>
                  <tr className="bg-[#4F8FF7]">
                    <th className="rounded-tl-xl px-3 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                      S.No.
                    </th>

                    <th className="px-3 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                      Product
                    </th>

                    <th className="px-3 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                      Code
                    </th>

                    <th className="px-3 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                      Brand / Category
                    </th>

                    <th className="px-3 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                      Pricing
                    </th>

                    <th className="px-3 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                      Commission
                    </th>

                    <th className="px-3 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                      Stock
                    </th>

                    <th className="rounded-tr-xl px-3 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product, idx) => {
                    const status = getStockStatus(product);
                    const meta = STOCK_STATUS_META[status];
                    const StatusIcon = meta.icon;

                    const stockQty =
                      product.warehouse_stock?.total_quantity ?? 0;

                    return (
                      <motion.tr
                        key={product.id}
                        initial={{
                          opacity: 0,
                          y: 6,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          delay: idx * 0.02,
                        }}
                        className="border-b border-[#DCE6F2] transition-colors last:border-b-0 hover:bg-[#F8FBFF]"
                      >
                        {/* S.NO. */}

                        <td className="px-3 py-2.5 align-top">
                          <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF3FF] text-[10px] font-bold text-[#2D6FE8]">
                            {idx + 1}
                          </span>
                        </td>

                        {/* PRODUCT */}

                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F4F8FD]">
                              {product.primary_image_url ? (
                                <img
                                  src={product.primary_image_url}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#6B7280]">
                                  <FiPackage className="text-[16px]" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-bold text-[#111827]">
                                {product.name}
                              </p>

                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className="truncate text-[11px] text-[#6B7280]">
                                  {product.subcategory?.name || "—"}
                                </span>

                                {product.is_trending && (
                                  <span className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-full border border-[#FACC15]/40 bg-[#FEF9C3] px-1.5 py-0.5 text-[9px] font-semibold text-[#A16207]">
                                    <FiTrendingUp className="text-[8px]" />
                                    Trending
                                  </span>
                                )}

                                {product.is_deal_of_the_day && (
                                  <span className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-full border border-[#FACC15]/40 bg-[#FEF9C3] px-1.5 py-0.5 text-[9px] font-semibold text-[#A16207]">
                                    <FiPercent className="text-[8px]" />
                                    Deal
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CODE */}

                        <td className="px-3 py-2.5">
                          <span className="font-mono text-[11px] text-[#6B7280]">
                            {product.product_code}
                          </span>
                        </td>

                        {/* BRAND / CATEGORY */}

                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="truncate text-[12px] font-medium text-[#111827]">
                              {product.brand?.title || "—"}
                            </span>

                            <span className="truncate text-[11px] text-[#6B7280]">
                              {product.category?.title || "—"}
                            </span>
                          </div>
                        </td>

                        {/* PRICING */}

                        <td className="px-3 py-2.5 text-right">
                          <p className="text-[12px] font-semibold text-[#111827]">
                            {formatCurrency(product.retail_price)}
                          </p>

                          <p className="text-[10px] text-[#6B7280] line-through">
                            {formatCurrency(product.retail_mrp)}
                          </p>
                        </td>

                        {/* COMMISSION */}

                        <td className="px-3 py-2.5 text-right">
                          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[#2D6FE8]/15 bg-[#EAF3FF] px-2 py-1 text-[11px] font-semibold text-[#2D6FE8]">
                            <FiAward className="text-[10px]" />

                            {formatCurrency(product.commission_value)}
                          </span>
                        </td>

                        {/* STOCK */}

                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-flex min-w-[38px] items-center justify-center rounded-lg px-2 py-1 text-[12px] font-bold ${meta.bg} ${meta.color}`}
                          >
                            {stockQty}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold ${meta.bg} ${meta.color} ${meta.border}`}
                          >
                            <StatusIcon className="text-[11px]" />

                            {meta.label}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}

            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-[#DCE6F2] px-4 py-4 md:flex-row">
                <p className="text-[11px] text-[#6B7280]">
                  Page{" "}
                  <span className="font-bold text-[#111827]">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#111827]">
                    {totalPages}
                  </span>{" "}
                  •{" "}
                  <span className="font-bold text-[#111827]">
                    {total}
                  </span>{" "}
                  total
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 1 || isLoading}
                    onClick={() =>
                      setPage((p) => Math.max(1, p - 1))
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#6B7280] transition hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FiChevronLeft />
                  </button>

                  <button
                    type="button"
                    disabled={page === totalPages || isLoading}
                    onClick={() =>
                      setPage((p) =>
                        Math.min(totalPages, p + 1),
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#6B7280] transition hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WarehouseProducts;