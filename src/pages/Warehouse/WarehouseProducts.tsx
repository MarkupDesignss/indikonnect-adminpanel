import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

import { usePermissions } from "@/pages/permissions/usePermissions";

// =====================================================
// TYPES & CONSTANTS
// =====================================================

const STOCK_STATUS_META = {
  in_stock: {
    label: "In Stock",
    color: "text-[#1E3A8A]",
    bg: "bg-[#EAF1FF]",
    border: "border-[#C7D7F7]",
    icon: FiCheckCircle,
  },
  low_stock: {
    label: "Low Stock",
    color: "text-[#8A6D16]",
    bg: "bg-[#FEF9C3]",
    border: "border-[#FDE68A]",
    icon: FiAlertTriangle,
  },
  out_of_stock: {
    label: "Out of Stock",
    color: "text-[#C23B32]",
    bg: "bg-[#FBEAEA]",
    border: "border-[#F1C6C3]",
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
  color = "text-[#1E3A8A]",
  bg = "bg-[#EAF1FF]",
}: {
  icon: any;
  value: string | number;
  color?: string;
  bg?: string;
}) => (
  <div
    className={`flex items-center gap-1.5 rounded-lg ${bg} px-2.5 py-1.5`}
  >
    <Icon className={`text-[13px] ${color}`} />
    <span className="text-[11px] font-semibold text-[#0F1B3D]">
      {value}
    </span>
  </div>
);

const PermissionLoading: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] p-4 font-poppins">
      <div className="flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#1E3A8A] shadow-sm">
          <FiRefreshCw size={23} className="animate-spin" />
        </div>

        <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
          Checking permissions...
        </p>

        <p className="mt-1 text-[10px] text-[#8C97B2]">
          Verifying warehouse access.
        </p>
      </div>
    </div>
  );
};

const AccessDenied: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] p-4 font-poppins">
      <div className="max-w-md rounded-2xl border border-[#E3E9F5] bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
          <FiAlertCircle size={26} />
        </div>

        <h2 className="text-lg font-bold text-[#0F1B3D]">
          Access Denied
        </h2>

        <p className="mt-2 text-sm text-[#6B7896]">
          You don't have permission to access the warehouse module.
        </p>

        <div className="mt-5 rounded-xl border border-[#C23B32]/15 bg-[#FBEAEA] px-4 py-3 text-[10px] font-semibold text-[#C23B32]">
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
  const navigate = useNavigate();
  const { warehouseId: paramWarehouseId } = useParams<{
    warehouseId: string;
  }>();

  const warehouseId = Number(paramWarehouseId) || 1;

  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [warehouseName, setWarehouseName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // =====================================================
  // PERMISSIONS
  // =====================================================

  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewWarehouseProducts = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("warehouse") ||
      hasModuleAccess("inventory") ||
      hasPermission("warehouse.view") ||
      hasPermission("inventory.view"),
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  // =====================================================
  // FETCH
  // =====================================================

  const fetchProducts = async () => {
    try {
      setIsLoading(true);

      const res = await warehouseStocksApi.getByWarehouse(warehouseId, {
        page,
        per_page: perPage,
      });

      if (res.data) {
        setProducts(res.data.data ?? []);
        setWarehouseName(res.data.warehouse?.name ?? "");
        setTotal(res.data.pagination?.total ?? 0);
        setTotalPages(res.data.pagination?.last_page ?? 1);
      }
    } catch (err: any) {
      console.error("Warehouse products fetch error:", err);

      toast.error(
        err?.response?.data?.message || "Failed to load warehouse products",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (permissionsLoading) {
      return;
    }

    if (canViewWarehouseProducts) {
      fetchProducts();
    } else {
      setIsLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    permissionsLoading,
    canViewWarehouseProducts,
    warehouseId,
    page,
    perPage,
  ]);

  // =====================================================
  // CLIENT-SIDE SEARCH
  // =====================================================

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;

    const q = search.toLowerCase().trim();

    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.product_code.toLowerCase().includes(q) ||
        p.brand?.title?.toLowerCase().includes(q) ||
        p.category?.title?.toLowerCase().includes(q) ||
        p.subcategory?.name?.toLowerCase().includes(q),
    );
  }, [products, search]);

  // =====================================================
  // HELPERS
  // =====================================================

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(num)) return "—";

    return `₹${num.toLocaleString("en-IN")}`;
  };

  const getStockStatus = (product: WarehouseProduct): StockStatus => {
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

  // =====================================================
  // PERMISSION LOADING
  // =====================================================

  if (permissionsLoading) {
    return <PermissionLoading />;
  }

  // =====================================================
  // ACCESS DENIED
  // =====================================================

  if (!canViewWarehouseProducts) {
    return <AccessDenied />;
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[#F5F8FF] p-4 font-poppins md:p-6">
      {/* ── HEADER ── */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF1FF]">
              <FiBox className="text-[20px] text-[#1E3A8A]" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#0F1B3D] md:text-2xl">
                All Products
              </h1>

              <p className="mt-0.5 text-xs text-[#6B7896] md:text-sm">
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
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97B2]" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="
              w-full rounded-xl border border-[#D8E2F0] bg-white
              py-2.5 pl-10 pr-4 text-sm text-[#0F1B3D]
              placeholder:text-[#8C97B2]
              focus:border-[#1E3A8A] focus:outline-none
              transition-colors
            "
          />
        </div>
      </div>

      {/* ── STATS ROW ── */}
      {!isLoading && products.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <StatBadge
            icon={FiPackage}
            value={`${total} Total`}
            bg="bg-[#EAF1FF]"
            color="text-[#1E3A8A]"
          />

          <StatBadge
            icon={FiCheckCircle}
            value={`${
              products.filter(
                (p) => getStockStatus(p) === "in_stock",
              ).length
            } In Stock`}
            bg="bg-[#EAF1FF]"
            color="text-[#1E3A8A]"
          />

          <StatBadge
            icon={FiAlertTriangle}
            value={`${
              products.filter(
                (p) => getStockStatus(p) === "low_stock",
              ).length
            } Low Stock`}
            bg="bg-[#FEF9C3]"
            color="text-[#8A6D16]"
          />

          <StatBadge
            icon={FiXCircle}
            value={`${
              products.filter(
                (p) => getStockStatus(p) === "out_of_stock",
              ).length
            } Out of Stock`}
            bg="bg-[#FBEAEA]"
            color="text-[#C23B32]"
          />
        </div>
      )}

      {/* ── TABLE CARD ── */}
      <div className="overflow-hidden rounded-2xl border border-[#D8E2F0] bg-white shadow-[0_2px_12px_rgba(30,58,138,0.06)]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent" />

            <p className="text-sm text-[#6B7896]">
              Loading products...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF1FF]">
              <FiPackage className="text-[28px] text-[#1E3A8A]" />
            </div>

            <h3 className="text-base font-semibold text-[#0F1B3D]">
              No products found
            </h3>

            <p className="text-sm text-[#6B7896]">
              {search
                ? "Try a different search term"
                : "This warehouse has no products yet"}
            </p>
          </div>
        ) : (
          <>
            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-[26%]" />
                  <col className="w-[9%]" />
                  <col className="w-[15%]" />
                  <col className="w-[14%]" />
                  <col className="w-[11%]" />
                  <col className="w-[10%]" />
                  <col className="w-[15%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-[#E3E9F5] bg-[#F7F9FD]">
                    <th className="px-3 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7896]">
                      Product
                    </th>

                    <th className="px-3 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7896]">
                      Code
                    </th>

                    <th className="px-3 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7896]">
                      Brand / Category
                    </th>

                    <th className="px-3 py-3.5 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7896]">
                      Pricing
                    </th>

                    <th className="px-3 py-3.5 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7896]">
                      Commission
                    </th>

                    <th className="px-3 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7896]">
                      Stock
                    </th>

                    <th className="px-3 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7896]">
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
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="
                          border-b border-[#E3E9F5] last:border-b-0
                          transition-colors hover:bg-[#F8FAFF]
                        "
                      >
                        {/* PRODUCT */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-[#D8E2F0] bg-[#F5F8FF]">
                              {product.primary_image_url ? (
                                <img
                                  src={product.primary_image_url}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#8C97B2]">
                                  <FiPackage className="text-[16px]" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[#0F1B3D]">
                                {product.name}
                              </p>

                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className="truncate text-[11px] text-[#8C97B2]">
                                  {product.subcategory?.name || "—"}
                                </span>

                                {product.is_trending && (
                                  <span className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-full bg-[#FEF9C3] px-1.5 py-0.5 text-[9px] font-semibold text-[#8A6D16]">
                                    <FiTrendingUp className="text-[8px]" />
                                    Trending
                                  </span>
                                )}

                                {product.is_deal_of_the_day && (
                                  <span className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-full bg-[#FFF4C2] px-1.5 py-0.5 text-[9px] font-semibold text-[#8A6D16]">
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
                          <span className="font-mono text-xs text-[#6B7896]">
                            {product.product_code}
                          </span>
                        </td>

                        {/* BRAND / CATEGORY */}
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="truncate text-sm font-medium text-[#0F1B3D]">
                              {product.brand?.title || "—"}
                            </span>

                            <span className="truncate text-[11px] text-[#8C97B2]">
                              {product.category?.title || "—"}
                            </span>
                          </div>
                        </td>

                        {/* PRICING */}
                        <td className="px-3 py-2.5 text-right">
                          <p className="text-sm font-semibold text-[#0F1B3D]">
                            {formatCurrency(product.retail_price)}
                          </p>

                          <p className="text-[10px] text-[#8C97B2] line-through">
                            {formatCurrency(product.retail_mrp)}
                          </p>
                        </td>

                        {/* COMMISSION */}
                        <td className="px-3 py-2.5 text-right">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#EAF1FF] px-2 py-1 text-xs font-semibold text-[#1E3A8A]">
                            <FiAward className="text-[10px]" />
                            {formatCurrency(product.commission_value)}
                          </span>
                        </td>

                        {/* STOCK */}
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`
                              inline-flex min-w-[38px] items-center justify-center
                              rounded-lg px-2 py-1 text-sm font-bold
                              ${meta.bg} ${meta.color}
                            `}
                          >
                            {stockQty}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`
                              inline-flex items-center gap-1
                              rounded-full border px-2 py-1
                              whitespace-nowrap text-[10px] font-semibold
                              ${meta.bg} ${meta.color} ${meta.border}
                            `}
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

            {/* ── PAGINATION ── */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E3E9F5] px-4 py-4 md:flex-row">
                <p className="text-xs text-[#6B7896]">
                  Page <span className="font-semibold">{page}</span> of{" "}
                  <span className="font-semibold">{totalPages}</span> •{" "}
                  <span className="font-semibold">{total}</span> total
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() =>
                      setPage((p) => Math.max(1, p - 1))
                    }
                    className="
                      flex h-9 w-9 items-center justify-center
                      rounded-lg border border-[#D8E2F0] bg-white
                      text-[#6B7896] transition
                      hover:bg-[#EAF1FF] hover:text-[#1E3A8A]
                      disabled:cursor-not-allowed disabled:opacity-40
                    "
                  >
                    <FiChevronLeft />
                  </button>

                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() =>
                      setPage((p) =>
                        Math.min(totalPages, p + 1),
                      )
                    }
                    className="
                      flex h-9 w-9 items-center justify-center
                      rounded-lg border border-[#D8E2F0] bg-white
                      text-[#6B7896] transition
                      hover:bg-[#EAF1FF] hover:text-[#1E3A8A]
                      disabled:cursor-not-allowed disabled:opacity-40
                    "
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