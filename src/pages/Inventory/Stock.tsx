import React, { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiPackage,
  FiAlertTriangle,
  FiXCircle,
  FiCheckCircle,
  FiEdit2,
  FiPlus,
  FiMinus,
  FiX,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiImage,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";
import { productApi } from "../../api/endpoints/product";
import { stockApi } from "../../api/endpoints/stockApi";
import { Product } from "@/types/product";

// ✅ PERMISSIONS
import { usePermissions } from "../permissions/usePermissions";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 16,
    },
  },
};

// =====================================================
// TYPES
// =====================================================

type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

interface StockUpdatePayload {
  operation: "add" | "subtract";
  stock_quantity: number;
}

// =====================================================
// PERMISSION LOADING STATE
// =====================================================

const PermissionLoadingState: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
      <div className="w-full max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
          <FiRefreshCw size={24} className="animate-spin" />
        </div>

        <h2 className="mt-5 text-base font-bold text-[#111827]">
          Checking permissions...
        </h2>

        <p className="mt-2 text-sm text-[#6B7280]">
          Please wait while we verify your access.
        </p>
      </div>
    </div>
  );
};

// =====================================================
// STAT CARD — BLUE/YELLOW THEME
// =====================================================

interface InventoryStatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  accentClass: string;
  tileClass?: string;
  tileIconClass?: string;
}

const InventoryStatCard: React.FC<InventoryStatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentClass,
  tileClass = "bg-[#EAF3FF]",
  tileIconClass = "text-[#2D6FE8]",
}) => {
  return (
    <motion.div
      variants={itemVariants}
      className="group relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white p-5 transition-colors"
    >
      <div className={`absolute left-0 top-0 h-1 w-full ${accentClass}`} />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.10em] text-[#6B7280]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-semibold text-[#111827]">
            {value.toLocaleString("en-IN")}
          </p>

          <p className="mt-1 text-xs text-[#6B7280]">{subtitle}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tileClass} ${tileIconClass}`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// STOCK BADGE — BLUE/YELLOW THEME
// =====================================================

interface StockBadgeProps {
  stock: number;
  threshold: number;
}

const StockBadge: React.FC<StockBadgeProps> = ({ stock, threshold }) => {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C23B32]/20 bg-[#FEF2F2] px-3 py-1.5 text-xs font-semibold text-[#C23B32]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#C23B32]" />
        Out of Stock
      </span>
    );
  }

  if (stock <= threshold) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FACC15]/40 bg-[#FEF9C3] px-3 py-1.5 text-xs font-semibold text-[#A16207]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2D6FE8]/20 bg-[#EAF3FF] px-3 py-1.5 text-xs font-semibold text-[#2D6FE8]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
      In Stock
    </span>
  );
};

// =====================================================
// UPDATE STOCK MODAL — BLUE/YELLOW THEME
// =====================================================

interface UpdateStockModalProps {
  open: boolean;
  product: Product | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: StockUpdatePayload) => void;
}

const UpdateStockModal: React.FC<UpdateStockModalProps> = ({
  open,
  product,
  loading,
  onClose,
  onSubmit,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [operation, setOperation] = useState<"add" | "subtract">("add");

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setOperation("add");
    }
  }, [product]);

  if (!open || !product) return null;

  const currentStock = Number(product.stock_quantity || 0);
  const threshold = Number(product.low_stock_threshold || 0);

  const previewStock =
    operation === "add"
      ? currentStock + quantity
      : Math.max(0, currentStock - quantity);

  const increase = () => setQuantity((prev) => prev + 1);

  const decrease = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleQuantityChange = (value: string) => {
    if (value === "") {
      setQuantity(1);
      return;
    }

    const parsed = Number(value);

    if (Number.isNaN(parsed) || parsed < 1) return;

    setQuantity(Math.floor(parsed));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      toast.error("Stock quantity must be greater than 0.");
      return;
    }

    if (operation === "subtract" && quantity > currentStock) {
      toast.error(
        `You cannot subtract more than current stock (${currentStock}).`,
      );
      return;
    }

    onSubmit({
      operation,
      stock_quantity: quantity,
    });
  };

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="relative w-full max-w-[500px] overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white font-poppins">
        {/* TOP ACCENT */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#1E40AF]" />

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-[#DCE6F2] px-5 py-4">
          <div>
            <div className="mb-0.5 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#2D6FE8]">
                Inventory Management
              </span>
            </div>

            <h2 className="text-lg font-semibold text-[#111827]">
              Update Stock
            </h2>

            <p className="mt-0.5 text-[11px] text-[#6B7280]">
              Add or subtract stock from available inventory
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:opacity-50"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            {/* PRODUCT */}
            <div className="flex items-center gap-3 rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-3">
              {product.images?.[0]?.image_url ? (
                <img
                  src={product.images[0].image_url}
                  alt={product.name}
                  className="h-14 w-14 rounded-lg border border-[#DCE6F2] bg-white object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8]">
                  <FiImage size={20} />
                </div>
              )}

              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-[#111827]">
                  {product.name}
                </h3>

                <p className="mt-0.5 text-[11px] text-[#6B7280]">
                  SKU: {product.product_code || "N/A"}
                </p>

                <div className="mt-1.5">
                  <StockBadge
                    stock={currentStock}
                    threshold={threshold}
                  />
                </div>
              </div>
            </div>

            {/* OPERATION */}
            <div className="mt-4">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                Stock Operation
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOperation("add")}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                    operation === "add"
                      ? "border-[#2D6FE8] bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white"
                      : "border-[#DCE6F2] bg-[#F4F8FD] text-[#111827] hover:border-[#4F8FF7] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                  }`}
                >
                  <FiPlus size={15} />
                  Add Stock
                </button>

                <button
                  type="button"
                  onClick={() => setOperation("subtract")}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                    operation === "subtract"
                      ? "border-[#2D6FE8] bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white"
                      : "border-[#DCE6F2] bg-[#F4F8FD] text-[#111827] hover:border-[#4F8FF7] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                  }`}
                >
                  <FiMinus size={15} />
                  Subtract Stock
                </button>
              </div>
            </div>

            {/* QUANTITY */}
            <div className="mt-4">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                Quantity
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={decrease}
                  disabled={loading || quantity <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] text-[#2D6FE8] transition hover:border-[#4F8FF7] hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiMinus size={16} />
                </button>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) =>
                    handleQuantityChange(e.target.value)
                  }
                  disabled={loading}
                  className="h-11 flex-1 rounded-lg border border-[#DCE6F2] bg-white text-center text-lg font-bold text-[#111827] outline-none transition focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10"
                />

                <button
                  type="button"
                  onClick={increase}
                  disabled={loading}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  <FiPlus size={16} />
                </button>
              </div>
            </div>

            {/* QUICK QUANTITIES */}
            <div className="mt-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                Quick Update
              </p>

              <div className="flex flex-wrap gap-1.5">
                {[1, 5, 10, 20, 50, 100].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setQuantity(value)}
                    disabled={loading}
                    className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                      quantity === value
                        ? "border-[#2D6FE8] bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white"
                        : "border-[#DCE6F2] bg-[#F4F8FD] text-[#111827] hover:border-[#4F8FF7] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* CURRENT / CHANGE / NEW */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                  Current
                </p>

                <p className="mt-0.5 text-lg font-bold text-[#111827]">
                  {currentStock}
                </p>
              </div>

              <div className="rounded-lg border border-[#DCE6F2] bg-white p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#6B7280]">
                  {operation === "add" ? "Adding" : "Subtracting"}
                </p>

                <p className="mt-0.5 text-lg font-bold text-[#2D6FE8]">
                  {operation === "add" ? `+${quantity}` : `-${quantity}`}
                </p>
              </div>

              <div className="rounded-lg border border-[#2D6FE8]/20 bg-gradient-to-br from-[#EAF3FF] to-[#DCEAFF] p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[#2D6FE8]">
                  New Stock
                </p>

                <p className="mt-0.5 text-lg font-bold text-[#1E3A8A]">
                  {previewStock}
                </p>
              </div>
            </div>

            {/* THRESHOLD + API INFO */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[#DCE6F2] bg-white p-2.5">
                <p className="text-[10px] text-[#6B7280]">
                  Low stock threshold:{" "}
                  <span className="font-bold text-[#2D6FE8]">
                    {threshold}
                  </span>
                </p>
              </div>

              <div className="rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] p-2.5">
                <p className="text-[10px] text-[#6B7280]">
                  Operation:{" "}
                  <span className="font-bold text-[#2D6FE8]">
                    {operation}
                  </span>
                  {" • "}
                  Qty:{" "}
                  <span className="font-bold text-[#2D6FE8]">
                    {quantity}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2.5 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-[#DCE6F2] bg-white px-4 py-2 text-xs font-semibold text-[#111827] transition hover:bg-[#F4F8FD] hover:text-[#2D6FE8] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FiRefreshCw
                    size={14}
                    className="animate-spin"
                  />
                  Updating...
                </>
              ) : (
                <>
                  <FiCheckCircle size={14} />
                  Update Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// INVENTORY PAGE
// =====================================================

const Stock: React.FC = () => {
  // ===================================================
  // ✅ PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewStock = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("stock") ||
      hasModuleAccess("product") ||
      hasPermission("stock.view") ||
      hasPermission("product.view"),
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  const canUpdateStock = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("stock.update") ||
      hasPermission("product.update"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // STATE
  // ===================================================

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockUpdating, setStockUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] =
    useState<StockFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH PRODUCTS
  // ===================================================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await productApi.getProducts();

      setProducts(response.data?.data ?? []);
    } catch (error: any) {
      console.error("Fetch inventory products error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to fetch inventory.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading && canViewStock) {
      fetchProducts();
    }
  }, [permissionsLoading, canViewStock]);

  // ===================================================
  // INVENTORY METRICS
  // ===================================================

  const metrics = useMemo(() => {
    const totalProducts = products.length;

    const inStock = products.filter((product) => {
      const stock = Number(product.stock_quantity || 0);
      const threshold = Number(
        product.low_stock_threshold || 0,
      );

      return stock > 0 && stock > threshold;
    }).length;

    const lowStock = products.filter((product) => {
      const stock = Number(product.stock_quantity || 0);
      const threshold = Number(
        product.low_stock_threshold || 0,
      );

      return stock > 0 && stock <= threshold;
    }).length;

    const outOfStock = products.filter(
      (product) =>
        Number(product.stock_quantity || 0) <= 0,
    ).length;

    return {
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
    };
  }, [products]);

  // ===================================================
  // SEARCH + FILTER
  // ===================================================

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const stock = Number(product.stock_quantity || 0);
      const threshold = Number(
        product.low_stock_threshold || 0,
      );

      const matchesSearch =
        !query ||
        [
          product.name,
          product.product_code,
          product.slug,
          product.description,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      let matchesFilter = true;

      switch (stockFilter) {
        case "in_stock":
          matchesFilter = stock > threshold;
          break;

        case "low_stock":
          matchesFilter =
            stock > 0 && stock <= threshold;
          break;

        case "out_of_stock":
          matchesFilter = stock <= 0;
          break;

        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesFilter;
    });
  }, [products, search, stockFilter]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredProducts.length / ITEMS_PER_PAGE,
    ),
  );

  const startIndex =
    (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const startEntry =
    filteredProducts.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredProducts.length,
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (
    filter: StockFilter,
  ) => {
    setStockFilter(filter);
    setCurrentPage(1);
  };

  const handleOpenStockUpdate = (
    product: Product,
  ) => {
    setSelectedProduct(product);
    setUpdateModalOpen(true);
  };

  // ===================================================
  // UPDATE STOCK
  // ===================================================

  const handleUpdateStock = async (
    payload: StockUpdatePayload,
  ) => {
    if (!selectedProduct) return;

    try {
      setStockUpdating(true);

      const response =
        await stockApi.updateStock({
          product_id: selectedProduct.id,
          operation: payload.operation,
          stock_quantity:
            payload.stock_quantity,
        });

      await fetchProducts();

      setUpdateModalOpen(false);
      setSelectedProduct(null);

      toast.success(
        response?.data?.message ||
          "Stock updated successfully.",
      );
    } catch (error: any) {
      console.error("Update stock error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update stock.",
      );
    } finally {
      setStockUpdating(false);
    }
  };

  const closeUpdateModal = () => {
    if (stockUpdating) return;

    setUpdateModalOpen(false);
    setSelectedProduct(null);
  };

  const handleRefresh = async () => {
    await fetchProducts();
    toast.success("Inventory refreshed.");
  };

  const handlePageChange = (
    page: number,
  ) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
  };

  const getPaginationPages = () => {
    if (totalPages <= 5) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1,
      );
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (
      currentPage >=
      totalPages - 2
    ) {
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  };

  const paginationPages =
    getPaginationPages();

  // ===================================================
  // ✅ LOADING STATE
  // ===================================================

  if (permissionsLoading) {
    return <PermissionLoadingState />;
  }

  // ===================================================
  // ✅ ACCESS DENIED
  // ===================================================

  if (!canViewStock) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
            <FiAlertTriangle size={26} />
          </div>

          <h2 className="text-lg font-bold text-[#111827]">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-[#6B7280]">
            You don't have permission to access this
            section.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      <motion.div
        className="min-h-screen bg-white p-4 font-poppins"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* HEADER */}
        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
        >
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#4F8FF7]" />
              <div className="h-2 w-2 rounded-full bg-[#FACC15]" />
              <div className="h-2 w-2 rounded-full bg-[#2D6FE8]" />

              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2D6FE8]">
                Inventory Management
              </span>
            </div>

            <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
              Stock Management
            </h1>

            <p className="mt-0.5 text-sm text-[#111827]">
              Monitor product inventory and update stock
              quantities from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              size={16}
              className={
                loading ? "animate-spin" : ""
              }
            />

            Refresh
          </button>
        </motion.div>

        {/* STAT CARDS */}
        <motion.div
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          variants={containerVariants}
        >
          <InventoryStatCard
            title="Total Products"
            value={metrics.totalProducts}
            subtitle="Products in catalog"
            icon={<FiPackage size={21} />}
            accentClass="bg-[#2D6FE8]"
            tileClass="bg-[#EAF3FF]"
            tileIconClass="text-[#2D6FE8]"
          />

          <InventoryStatCard
            title="In Stock"
            value={metrics.inStock}
            subtitle="Healthy inventory"
            icon={<FiCheckCircle size={21} />}
            accentClass="bg-[#4F8FF7]"
            tileClass="bg-[#EAF3FF]"
            tileIconClass="text-[#2D6FE8]"
          />

          <InventoryStatCard
            title="Low Stock"
            value={metrics.lowStock}
            subtitle="Needs attention"
            icon={<FiAlertTriangle size={21} />}
            accentClass="bg-[#FACC15]"
            tileClass="bg-[#FEF9C3]"
            tileIconClass="text-[#A16207]"
          />

          <InventoryStatCard
            title="Out of Stock"
            value={metrics.outOfStock}
            subtitle="Requires restocking"
            icon={<FiXCircle size={21} />}
            accentClass="bg-[#C23B32]"
            tileClass="bg-[#FEF2F2]"
            tileIconClass="text-[#C23B32]"
          />
        </motion.div>

        {/* MAIN INVENTORY CARD */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white"
        >
       
          {/* TOOLBAR */}
          <div className="border-b border-[#DCE6F2] p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-[560px]">
                <FiSearch
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    handleSearch(e.target.value)
                  }
                  placeholder="Search products by name, SKU or code..."
                  className="h-12 w-full rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] pl-11 pr-11 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSearch("")
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#2D6FE8]"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  {
                    key: "all" as StockFilter,
                    label: "All",
                  },
                  {
                    key: "in_stock" as StockFilter,
                    label: "In Stock",
                  },
                  {
                    key: "low_stock" as StockFilter,
                    label: "Low Stock",
                  },
                  {
                    key: "out_of_stock" as StockFilter,
                    label: "Out of Stock",
                  },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() =>
                      handleFilterChange(
                        filter.key,
                      )
                    }
                    className={`rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors ${
                      stockFilter === filter.key
                        ? "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)]"
                        : "border border-[#DCE6F2] bg-[#F4F8FD] text-[#111827] hover:border-[#4F8FF7] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto lg:block rounded-2xl">
            <table className="w-full min-w-[1100px] border-collapse ">
              <thead>
                <tr className="bg-[#4F8FF7]">
                  <th className="w-[70px] px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    S.No.
                  </th>

                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    Product
                  </th>

                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    SKU
                  </th>

                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                    Category
                  </th>

                  <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                    Current Stock
                  </th>

                  <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                    Threshold
                  </th>

                  <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                    Stock Status
                  </th>

                  {canUpdateStock && (
                    <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                      Action
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={
                        canUpdateStock
                          ? 8
                          : 7
                      }
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <FiLoaderIcon />

                        <p className="mt-4 text-sm font-semibold text-[#111827]">
                          Loading inventory...
                        </p>

                        <p className="mt-1 text-xs text-[#6B7280]">
                          Fetching current product
                          stock.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedProducts.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={
                        canUpdateStock
                          ? 8
                          : 7
                      }
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                          <FiPackage size={24} />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-[#111827]">
                          No products found
                        </p>

                        <p className="mt-1 text-xs text-[#6B7280]">
                          Try another search or
                          stock filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map(
                    (product, index) => {
                      const stock = Number(
                        product.stock_quantity ||
                          0,
                      );

                      const threshold =
                        Number(
                          product.low_stock_threshold ||
                            0,
                        );

                      const primaryImage =
                        product.images?.find(
                          (image) =>
                            image.is_primary ===
                            true,
                        ) ||
                        product.images?.[0];

                      return (
                        <tr
                          key={product.id}
                          className="border-b border-[#DCE6F2] bg-white transition-colors hover:bg-[#F8FBFF]"
                        >
                          <td className="px-4 py-3.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF3FF] text-xs font-bold text-[#2D6FE8]">
                              {startIndex +
                                index +
                                1}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              {primaryImage?.image_url ? (
                                <img
                                  src={
                                    primaryImage.image_url
                                  }
                                  alt={product.name}
                                  className="h-11 w-11 rounded-lg border border-[#DCE6F2] object-cover"
                                />
                              ) : (
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#DCE6F2] bg-[#EAF3FF] text-[#2D6FE8]">
                                  <FiImage size={18} />
                                </div>
                              )}

                              <div className="max-w-[230px]">
                                <p className="truncate text-sm font-semibold text-[#111827]">
                                  {product.name}
                                </p>

                                <p className="mt-1 truncate text-xs text-[#6B7280]">
                                  {product.description ||
                                    "No description available"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="rounded-lg bg-[#F4F8FD] px-3 py-1.5 text-xs font-semibold text-[#111827]">
                              {product.product_code ||
                                "N/A"}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />

                              <span className="text-sm font-medium text-[#111827]">
                                {product.category
                                  ?.name || "-"}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex min-w-[58px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-bold ${
                                stock <= 0
                                  ? "border-[#C23B32]/20 bg-[#FEF2F2] text-[#C23B32]"
                                  : stock <=
                                      threshold
                                    ? "border-[#FACC15]/40 bg-[#FEF9C3] text-[#A16207]"
                                    : "border-[#2D6FE8]/20 bg-[#EAF3FF] text-[#2D6FE8]"
                              }`}
                            >
                              {stock}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className="text-xs font-semibold text-[#111827]">
                              {threshold}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <StockBadge
                              stock={stock}
                              threshold={threshold}
                            />
                          </td>

                          {canUpdateStock && (
                            <td className="px-4 py-3.5">
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenStockUpdate(
                                      product,
                                    )
                                  }
                                  className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)] transition hover:-translate-y-0.5"
                                >
                                  <FiEdit2 size={14} />
                                  Update Stock
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="block lg:hidden">
            {loading ? (
              <div className="flex flex-col items-center px-5 py-16">
                <FiLoaderIcon />

                <p className="mt-3 text-sm font-semibold text-[#111827]">
                  Loading inventory...
                </p>
              </div>
            ) : paginatedProducts.length ===
              0 ? (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                  <FiPackage size={24} />
                </div>

                <p className="mt-4 text-sm font-semibold text-[#111827]">
                  No products found
                </p>

                <p className="mt-1 text-xs text-[#6B7280]">
                  Try adjusting your filters.
                </p>
              </div>
            ) : (
              paginatedProducts.map(
                (product, index) => {
                  const stock = Number(
                    product.stock_quantity || 0,
                  );

                  const threshold = Number(
                    product.low_stock_threshold ||
                      0,
                  );

                  const primaryImage =
                    product.images?.find(
                      (image) =>
                        image.is_primary ===
                        true,
                    ) ||
                    product.images?.[0];

                  return (
                    <div
                      key={product.id}
                      className="border-b border-[#DCE6F2] bg-white p-4"
                    >
                      <div className="flex items-start gap-3">
                        {primaryImage?.image_url ? (
                          <img
                            src={
                              primaryImage.image_url
                            }
                            alt={product.name}
                            className="h-14 w-14 shrink-0 rounded-lg border border-[#DCE6F2] object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
                            <FiImage size={20} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#111827]">
                                {product.name}
                              </p>

                              <p className="mt-1 text-xs text-[#6B7280]">
                                SKU:{" "}
                                {product.product_code ||
                                  "N/A"}
                              </p>
                            </div>

                            <span className="shrink-0 rounded-lg bg-[#EAF3FF] px-2 py-1 text-[10px] font-bold text-[#2D6FE8]">
                              #
                              {startIndex +
                                index +
                                1}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <StockBadge
                              stock={stock}
                              threshold={threshold}
                            />

                            <span className="rounded-full border border-[#DCE6F2] bg-[#F4F8FD] px-3 py-1 text-[10px] font-semibold text-[#111827]">
                              Threshold:{" "}
                              {threshold}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                            Current Stock
                          </p>

                          <p className="mt-1 text-xl font-bold text-[#2D6FE8]">
                            {stock}
                          </p>
                        </div>

                        <div className="rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                            Category
                          </p>

                          <p className="mt-1 truncate text-sm font-semibold text-[#111827]">
                            {product.category
                              ?.name || "-"}
                          </p>
                        </div>
                      </div>

                      {canUpdateStock && (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenStockUpdate(
                              product,
                            )
                          }
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-4 py-3 text-sm font-semibold text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)] transition hover:-translate-y-0.5"
                        >
                          <FiEdit2 size={15} />
                          Update Stock
                        </button>
                      )}
                    </div>
                  );
                },
              )
            )}
          </div>

          {/* PAGINATION */}
          {filteredProducts.length > 0 && (
            <div className="border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-4 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-[#6B7280]">
                  Showing{" "}
                  <span className="font-bold text-[#111827]">
                    {startEntry}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#111827]">
                    {endEntry}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#111827]">
                    {filteredProducts.length}
                  </span>{" "}
                  entries
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      handlePageChange(
                        currentPage - 1,
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft size={17} />
                  </button>

                  {paginationPages.map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          handlePageChange(page)
                        }
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-colors ${
                          currentPage === page
                            ? "bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white shadow-[0_6px_14px_-6px_rgba(45,111,232,0.5)]"
                            : "text-[#111827] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() =>
                      handlePageChange(
                        currentPage + 1,
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* UPDATE STOCK MODAL — PERMISSION BASED */}
      {canUpdateStock && (
        <UpdateStockModal
          open={updateModalOpen}
          product={selectedProduct}
          loading={stockUpdating}
          onClose={closeUpdateModal}
          onSubmit={handleUpdateStock}
        />
      )}
    </>
  );
};

// =====================================================
// LOADER HELPER
// =====================================================

const FiLoaderIcon = () => (
  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
    <FiRefreshCw
      size={22}
      className="animate-spin"
    />
  </div>
);

export default Stock;