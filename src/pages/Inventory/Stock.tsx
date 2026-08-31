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
  FiBox,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

import GlobalModal from "@/components/common/GlobalModal";
import { productApi } from "../../api/endpoints/product";
import { Product } from "@/types/product";

// =====================================================
// THEME
// =====================================================

const theme = {
  cream: "#faf8f3",
  white: "#ffffff",
  dark: "#2f2a22",
  text: "#2a2620",
  secondary: "#786f60",
  muted: "#a89a7d",
  gold: "#b8902e",
  lightGold: "#d4af52",
  darkGold: "#8f6d1d",
};

// =====================================================
// ANIMATION
// =====================================================

const containerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 14,
    },
  },
};

// =====================================================
// TYPES
// =====================================================

type StockFilter =
  | "all"
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

interface StockUpdatePayload {
  stock_quantity: number;
}

// =====================================================
// STAT CARD
// =====================================================

interface InventoryStatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  accentClass: string;
}

const InventoryStatCard: React.FC<
  InventoryStatCardProps
> = ({
  title,
  value,
  subtitle,
  icon,
  accentClass,
}) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{
        y: -4,
        boxShadow:
          "0 16px 30px -18px rgba(140,105,25,0.30)",
      }}
      className="group relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white p-5 shadow-sm transition-all duration-300"
    >
      {/* Top accent */}

      <div
        className={`absolute left-0 top-0 h-1 w-full ${accentClass}`}
      />

      {/* Decorative circles */}

      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#d4af52]/20" />

      <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full border border-[#b8902e]/10" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.10em] text-[#a89a7d]">
            {title}
          </p>

          <motion.p
            initial={{
              scale: 0.8,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            className="mt-2 text-3xl font-bold text-[#2a2620]"
          >
            {value.toLocaleString("en-IN")}
          </motion.p>

          <p className="mt-1 text-xs text-[#786f60]">
            {subtitle}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e] shadow-sm">
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// STOCK BADGE
// =====================================================

interface StockBadgeProps {
  stock: number;
  threshold: number;
}

const StockBadge: React.FC<StockBadgeProps> = ({
  stock,
  threshold,
}) => {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c98d83]/25 bg-[#fff8f6] px-3 py-1.5 text-xs font-bold text-[#b46055]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#b46055]" />
        Out of Stock
      </span>
    );
  }

  if (stock <= threshold) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9a441]/30 bg-[#fff8e8] px-3 py-1.5 text-xs font-bold text-[#a06f13]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#d9a441]" />
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8902e]/25 bg-[#f8f3e5] px-3 py-1.5 text-xs font-bold text-[#8f6d1d]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />
      In Stock
    </span>
  );
};

// =====================================================
// UPDATE STOCK MODAL
// =====================================================

interface UpdateStockModalProps {
  open: boolean;
  product: Product | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (
    payload: StockUpdatePayload
  ) => void;
}

const UpdateStockModal: React.FC<
  UpdateStockModalProps
> = ({
  open,
  product,
  loading,
  onClose,
  onSubmit,
}) => {
  const [quantity, setQuantity] =
    useState(0);

  useEffect(() => {
    if (product) {
      setQuantity(
        Number(
          product.stock_quantity || 0
        )
      );
    }
  }, [product]);

  if (!open || !product) {
    return null;
  }

  const threshold = Number(
    product.low_stock_threshold || 0
  );

  const increase = () => {
    setQuantity((prev) => prev + 1);
  };

  const decrease = () => {
    setQuantity((prev) =>
      Math.max(0, prev - 1)
    );
  };

  const handleQuantityChange = (
    value: string
  ) => {
    if (value === "") {
      setQuantity(0);
      return;
    }

    const parsed = Number(value);

    if (
      Number.isNaN(parsed) ||
      parsed < 0
    ) {
      return;
    }

    setQuantity(
      Math.floor(parsed)
    );
  };

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    onSubmit({
      stock_quantity: quantity,
    });
  };

  return (
    <GlobalModal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={!loading}
    >
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
        {/* Accent */}

        <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

        {/* Header */}

        <div className="flex items-start justify-between gap-4 border-b border-[#b8902e]/10 px-5 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">
                Inventory Management
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#2a2620]">
              Update Stock
            </h2>

            <p className="mt-1 text-xs text-[#a89a7d]">
              Change the available inventory quantity
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e]/10 disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}

        <form onSubmit={handleSubmit}>
          <div className="p-5">
            {/* Product */}

            <div className="flex items-center gap-4 rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
              {product.images?.[0]?.image_url ? (
                <img
                  src={
                    product.images[0]
                      .image_url
                  }
                  alt={product.name}
                  className="h-16 w-16 rounded-xl border border-[#b8902e]/15 bg-white object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-white text-[#b8902e]">
                  <FiImage size={22} />
                </div>
              )}

              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-[#2a2620]">
                  {product.name}
                </h3>

                <p className="mt-1 text-xs text-[#a89a7d]">
                  SKU:{" "}
                  {product.product_code ||
                    "N/A"}
                </p>

                <div className="mt-2">
                  <StockBadge
                    stock={Number(
                      product.stock_quantity ||
                        0
                    )}
                    threshold={threshold}
                  />
                </div>
              </div>
            </div>

            {/* Quantity */}

            <div className="mt-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
                Stock Quantity
              </label>

              <div className="flex items-center gap-3">
                {/* Minus */}

                <button
                  type="button"
                  onClick={
                    decrease
                  }
                  disabled={
                    loading ||
                    quantity <= 0
                  }
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition hover:border-[#b8902e]/40 hover:bg-[#b8902e]/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiMinus size={18} />
                </button>

                {/* Input */}

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(e) =>
                    handleQuantityChange(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  className="h-14 flex-1 rounded-xl border border-[#b8902e]/25 bg-white text-center text-xl font-bold text-[#2a2620] outline-none transition focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/15"
                />

                {/* Plus */}

                <button
                  type="button"
                  onClick={
                    increase
                  }
                  disabled={loading}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white shadow-md shadow-[#b8902e]/20 transition hover:from-[#c49b3a] hover:to-[#8f6d1d] disabled:opacity-50"
                >
                  <FiPlus size={18} />
                </button>
              </div>
            </div>

            {/* Quick Quantities */}

            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6b6152]">
                Quick Update
              </p>

              <div className="flex flex-wrap gap-2">
                {[0, 5, 10, 20, 50, 100].map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setQuantity(
                          value
                        )
                      }
                      disabled={loading}
                      className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                        quantity ===
                        value
                          ? "border-[#b8902e] bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/15"
                          : "border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
                      }`}
                    >
                      {value}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Current / New */}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                  Current Stock
                </p>

                <p className="mt-1 text-xl font-bold text-[#2a2620]">
                  {Number(
                    product.stock_quantity ||
                      0
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-[#b8902e]/20 bg-[#fffaf0] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a06f13]">
                  New Stock
                </p>

                <p className="mt-1 text-xl font-bold text-[#8f6d1d]">
                  {quantity}
                </p>
              </div>
            </div>

            {/* Threshold */}

            <div className="mt-4 rounded-xl border border-[#b8902e]/10 bg-white p-3">
              <p className="text-xs text-[#786f60]">
                Low stock threshold:{" "}
                <span className="font-bold text-[#8f6d1d]">
                  {threshold}
                </span>
              </p>
            </div>
          </div>

          {/* Footer */}

          <div className="flex justify-end gap-3 border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#b8902e]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#786f60] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3] hover:text-[#8f6d1d] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition hover:from-[#a8841c] hover:to-[#795b14] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FiRefreshCw
                    size={15}
                    className="animate-spin"
                  />
                  Updating...
                </>
              ) : (
                <>
                  <FiCheckCircle
                    size={15}
                  />
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
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [stockUpdating, setStockUpdating] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [stockFilter, setStockFilter] =
    useState<StockFilter>("all");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [updateModalOpen, setUpdateModalOpen] =
    useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // FETCH PRODUCTS
  // ===================================================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response =
        await productApi.getProducts();

      setProducts(
        response.data?.data ?? []
      );
    } catch (error: any) {
      console.error(
        "Fetch inventory products error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to fetch inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ===================================================
  // INVENTORY METRICS
  // ===================================================

  const metrics = useMemo(() => {
    const totalProducts =
      products.length;

    const inStock = products.filter(
      (product) =>
        Number(
          product.stock_quantity || 0
        ) > 0 &&
        Number(
          product.stock_quantity || 0
        ) >
          Number(
            product.low_stock_threshold ||
              0
          )
    ).length;

    const lowStock = products.filter(
      (product) => {
        const stock = Number(
          product.stock_quantity || 0
        );

        const threshold = Number(
          product.low_stock_threshold ||
            0
        );

        return (
          stock > 0 &&
          stock <= threshold
        );
      }
    ).length;

    const outOfStock =
      products.filter(
        (product) =>
          Number(
            product.stock_quantity || 0
          ) <= 0
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

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const stock = Number(
            product.stock_quantity ||
              0
          );

          const threshold =
            Number(
              product.low_stock_threshold ||
                0
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
              matchesFilter =
                stock >
                threshold;
              break;

            case "low_stock":
              matchesFilter =
                stock > 0 &&
                stock <=
                  threshold;
              break;

            case "out_of_stock":
              matchesFilter =
                stock <= 0;
              break;

            default:
              matchesFilter = true;
          }

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      products,
      search,
      stockFilter,
    ]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredProducts.length /
        ITEMS_PER_PAGE
    )
  );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedProducts =
    filteredProducts.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE
    );

  const startEntry =
    filteredProducts.length === 0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex +
      ITEMS_PER_PAGE,
    filteredProducts.length
  );

  // ===================================================
  // SEARCH
  // ===================================================

  const handleSearch = (
    value: string
  ) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // ===================================================
  // FILTER
  // ===================================================

  const handleFilterChange = (
    filter: StockFilter
  ) => {
    setStockFilter(filter);
    setCurrentPage(1);
  };

  // ===================================================
  // OPEN UPDATE STOCK
  // ===================================================

  const handleOpenStockUpdate = (
    product: Product
  ) => {
    setSelectedProduct(product);
    setUpdateModalOpen(true);
  };

  // ===================================================
  // UPDATE STOCK
  // ===================================================

  const handleUpdateStock = async (
    payload: StockUpdatePayload
  ) => {
    if (!selectedProduct) {
      return;
    }

    try {
      setStockUpdating(true);

      /*
       * Using existing product update API.
       * stock_quantity is sent as FormData.
       *
       * If your backend has a dedicated
       * inventory/stock endpoint, only this
       * API call needs to be changed.
       */

      const formData =
        new FormData();

      formData.append(
        "stock_quantity",
        String(
          payload.stock_quantity
        )
      );

      const response =
        await productApi.updateProduct(
          selectedProduct.id,
          formData
        );

      await fetchProducts();

      setUpdateModalOpen(false);
      setSelectedProduct(null);

      toast.success(
        response?.data?.message ||
          "Stock updated successfully."
      );
    } catch (error: any) {
      console.error(
        "Update stock error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update stock."
      );
    } finally {
      setStockUpdating(false);
    }
  };

  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeUpdateModal = () => {
    if (stockUpdating) return;

    setUpdateModalOpen(false);
    setSelectedProduct(null);
  };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    await fetchProducts();

    toast.success(
      "Inventory refreshed."
    );
  };

  // ===================================================
  // PAGINATION
  // ===================================================

  const handlePageChange = (
    page: number
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
        (_, index) =>
          index + 1
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
  // RENDER
  // ===================================================

  return (
    <>
      <motion.div
        className="min-h-screen bg-[#faf8f3] p-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
        >
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#b8902e]" />

              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8902e]">
                Inventory Management
              </span>
            </div>

            <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#2a2620] sm:text-[30px]">
              Stock Management
            </h1>

            <p className="mt-1 text-sm text-[#786f60]">
              Monitor product inventory and update
              stock quantities from one place.
            </p>
          </div>

          {/* Refresh */}

          <motion.button
            type="button"
            onClick={
              handleRefresh
            }
            disabled={loading}
            whileHover={{
              y: -2,
            }}
            whileTap={{
              scale: 0.97,
            }}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-sm font-semibold text-[#8f6d1d] shadow-sm transition hover:border-[#b8902e]/35 hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </motion.button>
        </motion.div>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <motion.div
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          variants={containerVariants}
        >
          <InventoryStatCard
            title="Total Products"
            value={

              metrics.totalProducts
            }
            subtitle="Products in catalog"
            icon={
              <FiPackage size={21} />
            }
            accentClass="bg-gradient-to-r from-[#d4af52] to-[#8f6d1d]"
          />

          <InventoryStatCard
            title="In Stock"
            value={
              metrics.inStock
            }
            subtitle="Healthy inventory"
            icon={
              <FiCheckCircle
                size={21}
              />
            }
            accentClass="bg-gradient-to-r from-[#e0b85d] to-[#a8841c]"
          />

          <InventoryStatCard
            title="Low Stock"
            value={
              metrics.lowStock
            }
            subtitle="Needs attention"
            icon={
              <FiAlertTriangle
                size={21}
              />
            }
            accentClass="bg-gradient-to-r from-[#e8c97a] to-[#b8902e]"
          />

          <InventoryStatCard
            title="Out of Stock"
            value={
              metrics.outOfStock
            }
            subtitle="Requires restocking"
            icon={
              <FiXCircle size={21} />
            }
            accentClass="bg-gradient-to-r from-[#c49b3a] to-[#806319]"
          />
        </motion.div>

        {/* =================================================
            MAIN INVENTORY CARD
        ================================================= */}

        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm"
        >
          {/* Accent */}

          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

          {/* =================================================
              TOOLBAR
          ================================================= */}

          <div className="border-b border-[#b8902e]/10 p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              {/* Search */}

              <div className="relative w-full xl:max-w-[560px]">
                <FiSearch
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8841c]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    handleSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search products by name, SKU or code..."
                  className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-11 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSearch("")
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89a7d] hover:text-[#8f6d1d]"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>

              {/* Filter Buttons */}

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
                ].map(
                  (filter) => (
                    <button
                      key={
                        filter.key
                      }
                      type="button"
                      onClick={() =>
                        handleFilterChange(
                          filter.key
                        )
                      }
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                        stockFilter ===
                        filter.key
                          ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/20"
                          : "border border-[#b8902e]/15 bg-[#faf8f3] text-[#786f60] hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

     

          {/* =================================================
              DESKTOP TABLE
          ================================================= */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="bg-[#2f2a22]">
                  <th className="w-[70px] px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    S.No.
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Product
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    SKU
                  </th>

                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Category
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Current Stock
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Threshold
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Stock Status
                  </th>

                  <th className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
                          <FiPackage
                            size={22}
                          />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#2a2620]">
                          Loading inventory...
                        </p>

                        <p className="mt-1 text-xs text-[#a89a7d]">
                          Fetching current product stock.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedProducts.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                          <FiPackage
                            size={24}
                          />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#2a2620]">
                          No products found
                        </p>

                        <p className="mt-1 text-xs text-[#a89a7d]">
                          Try another search or
                          stock filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map(
                    (
                      product,
                      index
                    ) => {
                      const stock =
                        Number(
                          product.stock_quantity ||
                            0
                        );

                      const threshold =
                        Number(
                          product.low_stock_threshold ||
                            0
                        );

                      return (
                        <tr
                          key={
                            product.id
                          }
                          className="group border-b border-[#b8902e]/10 bg-white transition-all hover:bg-[#faf8f3]"
                        >
                          {/* S.NO */}

                          <td className="px-5 py-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-xs font-bold text-[#8f6d1d]">
                              {startIndex +
                                index +
                                1}
                            </span>
                          </td>

                          {/* PRODUCT */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {product.images?.find(
                                (
                                  image
                                ) =>
                                  image.is_primary ===
                                  true
                              )?.image_url ||
                              product
                                .images?.[0]
                                ?.image_url ? (
                                <img
                                  src={
                                    product.images?.find(
                                      (
                                        image
                                      ) =>
                                        image.is_primary ===
                                        true
                                    )
                                      ?.image_url ||
                                    product
                                      .images?.[0]
                                      ?.image_url
                                  }
                                  alt={
                                    product.name
                                  }
                                  className="h-12 w-12 rounded-xl border border-[#b8902e]/15 object-cover"
                                />
                              ) : (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#b8902e]">
                                  <FiImage
                                    size={
                                      18
                                    }
                                  />
                                </div>
                              )}

                              <div className="max-w-[230px]">
                                <p className="truncate text-sm font-bold text-[#2a2620]">
                                  {
                                    product.name
                                  }
                                </p>

                                <p className="mt-1 truncate text-xs text-[#a89a7d]">
                                  {product.description ||
                                    "No description available"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}

                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-[#faf8f3] px-3 py-1.5 text-xs font-semibold text-[#786f60]">
                              {product.product_code ||
                                "N/A"}
                            </span>
                          </td>

                          {/* CATEGORY */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#d4af52]" />

                              <span className="text-sm font-medium text-[#4a4436]">
                                {product
                                  .category
                                  ?.name ||
                                  "-"}
                              </span>
                            </div>
                          </td>

                          {/* STOCK */}

                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex min-w-[58px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-bold ${
                                stock <= 0
                                  ? "border-[#c98d83]/25 bg-[#fff8f6] text-[#b46055]"
                                  : stock <=
                                    threshold
                                  ? "border-[#d9a441]/30 bg-[#fff8e8] text-[#a06f13]"
                                  : "border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d]"
                              }`}
                            >
                              {stock}
                            </span>
                          </td>

                          {/* THRESHOLD */}

                          <td className="px-5 py-4 text-center">
                            <span className="text-xs font-semibold text-[#786f60]">
                              {threshold}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4 text-center">
                            <StockBadge
                              stock={
                                stock
                              }
                              threshold={
                                threshold
                              }
                            />
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">
                            <div className="flex justify-center">
                              <motion.button
                                type="button"
                                whileHover={{
                                  scale: 1.04,
                                }}
                                whileTap={{
                                  scale: 0.96,
                                }}
                                onClick={() =>
                                  handleOpenStockUpdate(
                                    product
                                  )
                                }
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a8841c] hover:to-[#795b14]"
                              >
                                <FiEdit2
                                  size={
                                    14
                                  }
                                />

                                Update Stock
                              </motion.button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              MOBILE CARDS
          ================================================= */}

          <div className="block lg:hidden">
            {loading ? (
              <div className="flex flex-col items-center px-5 py-16">
                <FiLoaderIcon />
                <p className="mt-3 text-sm font-bold text-[#2a2620]">
                  Loading inventory...
                </p>
              </div>
            ) : paginatedProducts.length ===
              0 ? (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                  <FiPackage
                    size={24}
                  />
                </div>

                <p className="mt-4 text-sm font-bold text-[#2a2620]">
                  No products found
                </p>

                <p className="mt-1 text-xs text-[#a89a7d]">
                  Try adjusting your filters.
                </p>
              </div>
            ) : (
              paginatedProducts.map(
                (
                  product,
                  index
                ) => {
                  const stock =
                    Number(
                      product.stock_quantity ||
                        0
                    );

                  const threshold =
                    Number(
                      product.low_stock_threshold ||
                        0
                    );

                  const primaryImage =
                    product.images?.find(
                      (image) =>
                        image.is_primary ===
                        true
                    ) ||
                    product.images?.[0];

                  return (
                    <div
                      key={
                        product.id
                      }
                      className="border-b border-[#b8902e]/10 bg-white p-4"
                    >
                      <div className="flex items-start gap-3">
                        {primaryImage?.image_url ? (
                          <img
                            src={
                              primaryImage.image_url
                            }
                            alt={
                              product.name
                            }
                            className="h-14 w-14 shrink-0 rounded-xl border border-[#b8902e]/15 object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                            <FiImage
                              size={
                                20
                              }
                            />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#2a2620]">
                                {
                                  product.name
                                }
                              </p>

                              <p className="mt-1 text-xs text-[#a89a7d]">
                                SKU:{" "}
                                {product.product_code ||
                                  "N/A"}
                              </p>
                            </div>

                            <span className="shrink-0 rounded-lg bg-[#faf8f3] px-2 py-1 text-[10px] font-bold text-[#8f6d1d]">
                              #
                              {startIndex +
                                index +
                                1}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <StockBadge
                              stock={
                                stock
                              }
                              threshold={
                                threshold
                              }

                            />

                            <span className="rounded-full border border-[#b8902e]/15 bg-[#faf8f3] px-3 py-1 text-[10px] font-bold text-[#786f60]">
                              Threshold:{" "}
                              {
                                threshold
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                            Current Stock
                          </p>

                          <p className="mt-1 text-xl font-bold text-[#8f6d1d]">
                            {stock}
                          </p>
                        </div>

                        <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                            Category
                          </p>

                          <p className="mt-1 truncate text-sm font-bold text-[#4a4436]">
                            {product
                              .category
                              ?.name ||
                              "-"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenStockUpdate(
                            product
                          )
                        }
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-3 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15"
                      >
                        <FiEdit2
                          size={
                            15
                          }
                        />

                        Update Stock
                      </button>
                    </div>
                  );
                }
              )
            )}
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {filteredProducts.length >
            0 && (
            <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-4 py-4 sm:px-5">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-[#8b8171]">
                  Showing{" "}
                  <span className="font-bold text-[#4a4436]">
                    {startEntry}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#4a4436]">
                    {endEntry}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#4a4436]">
                    {
                      filteredProducts.length
                    }
                  </span>{" "}
                  entries
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      1
                    }
                    onClick={() =>
                      handlePageChange(
                        currentPage -
                          1
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft
                      size={
                        17
                      }
                    />
                  </button>

                  {paginationPages.map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          handlePageChange(
                            page
                          )
                        }
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${
                          currentPage ===
                          page
                            ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white shadow-md shadow-[#b8902e]/20"
                            : "text-[#786f60] hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() =>
                      handlePageChange(
                        currentPage +
                          1
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight
                      size={
                        17
                      }
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* =================================================
          UPDATE STOCK MODAL
      ================================================= */}

      <UpdateStockModal
        open={updateModalOpen}
        product={selectedProduct}
        loading={stockUpdating}
        onClose={
          closeUpdateModal
        }
        onSubmit={
          handleUpdateStock
        }
      />
    </>
  );
};

// =====================================================
// LOADER HELPER
// =====================================================

const FiLoaderIcon = () => (
  <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
    <FiRefreshCw
      size={22}
      className="animate-spin"
    />
  </div>
);

export default Stock;