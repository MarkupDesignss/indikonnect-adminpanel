import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import { toast } from "react-hot-toast";

import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiEdit3,
  FiPlus,
  FiMinus,
  FiAlertCircle,
} from "react-icons/fi";

import warehouseStocksApi, {
  WarehouseProduct,
} from "@/api/endpoints/warehouseStocks";

import { usePermissions } from "@/pages/permissions/usePermissions";

// =====================================================
// STOCK STATUS META
// =====================================================

const STOCK_STATUS_META = {
  in_stock: {
    label: "In Stock",
    color: "text-[#1E3A8A]",
    bg: "bg-[#EAF1FF]",
    border: "border-[#1E3A8A]/25",
    icon: FiCheckCircle,
  },

  low_stock: {
    label: "Low Stock",
    color: "text-[#8A6D16]",
    bg: "bg-[#FEF9C3]",
    border: "border-[#FACC15]/40",
    icon: FiAlertTriangle,
  },

  out_of_stock: {
    label: "Out of Stock",
    color: "text-[#C23B32]",
    bg: "bg-[#FBEAEA]",
    border: "border-[#C23B32]/25",
    icon: FiXCircle,
  },
} as const;

type StockStatus =
  keyof typeof STOCK_STATUS_META;

// =====================================================
// EDITED ROW
// =====================================================

interface EditedRow {
  operation: "add" | "subtract";
  quantity: number | undefined;
}

interface EditedQty {
  [productId: number]:
    | EditedRow
    | undefined;
}

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
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: {
    y: 12,
    opacity: 0,
  },

  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 110,
      damping: 16,
    },
  },
};

// =====================================================
// PERMISSION LOADING
// =====================================================

const PermissionLoading: React.FC =
  () => {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] p-4 font-poppins">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#1E3A8A] shadow-sm">
            <FiRefreshCw
              size={23}
              className="animate-spin"
            />
          </div>

          <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
            Checking permissions...
          </p>

          <p className="mt-1 text-[10px] text-[#8C97B2]">
            Verifying warehouse inventory
            access.
          </p>
        </div>
      </div>
    );
  };

// =====================================================
// ACCESS DENIED
// =====================================================

const AccessDenied: React.FC =
  () => {
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
            You don't have permission
            to access the Warehouse
            Inventory module.
          </p>

          <div className="mt-5 rounded-xl border border-[#C23B32]/15 bg-[#FBEAEA] px-4 py-3 text-[10px] font-semibold text-[#C23B32]">
            Contact your administrator
            to request access.
          </div>
        </div>
      </div>
    );
  };

// =====================================================
// MAIN
// =====================================================

const Inventorywarehouse =
  () => {
    // =================================================
    // WAREHOUSE
    // =================================================

    const warehouseId = 1;

    // =================================================
    // PERMISSIONS
    //
    // API:
    //
    // warehouse_inventory:
    // [
    //   "view",
    //   "update"
    // ]
    //
    // Therefore:
    //
    // warehouse_inventory.view
    // warehouse_inventory.update
    // =================================================

    const {
      hasPermission,
      isSuperAdmin,
      loading:
        permissionsLoading,
    } = usePermissions();

    // =================================================
    // VIEW PERMISSION
    // =================================================

    const canViewInventory =
      useMemo(
        () =>
          isSuperAdmin ||
          hasPermission(
            "warehouse_inventory.view",
          ),
        [
          isSuperAdmin,
          hasPermission,
        ],
      );

    // =================================================
    // UPDATE PERMISSION
    // =================================================

    const canUpdateInventory =
      useMemo(
        () =>
          isSuperAdmin ||
          hasPermission(
            "warehouse_inventory.update",
          ),
        [
          isSuperAdmin,
          hasPermission,
        ],
      );

    // =================================================
    // STATE
    // =================================================

    const [
      products,
      setProducts,
    ] = useState<
      WarehouseProduct[]
    >([]);

    const [
      warehouseName,
      setWarehouseName,
    ] = useState<string>("");

    const [
      isLoading,
      setIsLoading,
    ] = useState(true);

    const [
      isSaving,
      setIsSaving,
    ] = useState(false);

    const [
      page,
      setPage,
    ] = useState(1);

    const [
      perPage,
    ] = useState(25);

    const [
      totalPages,
      setTotalPages,
    ] = useState(1);

    const [
      total,
      setTotal,
    ] = useState(0);

    const [
      search,
      setSearch,
    ] = useState("");

    const [
      editedQty,
      setEditedQty,
    ] = useState<EditedQty>({});

    // =================================================
    // FETCH PRODUCTS
    // =================================================

    const fetchProducts =
      async () => {
        try {
          setIsLoading(true);

          const res =
            await warehouseStocksApi.getByWarehouse(
              warehouseId,
              {
                page,
                per_page:
                  perPage,
              },
            );

          if (res.data) {
            setProducts(
              res.data.data ?? [],
            );

            setWarehouseName(
              res.data
                .warehouse
                ?.name ?? "",
            );

            setTotal(
              res.data
                .pagination
                ?.total ?? 0,
            );

            setTotalPages(
              res.data
                .pagination
                ?.last_page ?? 1,
            );

            setEditedQty({});
          }
        } catch (err: any) {
          console.error(
            "Warehouse inventory fetch error:",
            err,
          );

          toast.error(
            err?.response
              ?.data?.message ||
              "Failed to load warehouse inventory",
          );
        } finally {
          setIsLoading(false);
        }
      };

    // =================================================
    // FETCH ONLY AFTER PERMISSION CHECK
    // =================================================

    useEffect(() => {
      if (permissionsLoading) {
        return;
      }

      if (canViewInventory) {
        fetchProducts();
      } else {
        setIsLoading(false);
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      permissionsLoading,
      canViewInventory,
      warehouseId,
      page,
      perPage,
    ]);

    // =================================================
    // SEARCH
    // =================================================

    const filteredProducts =
      useMemo(() => {
        if (!search.trim()) {
          return products;
        }

        const q =
          search
            .toLowerCase()
            .trim();

        return products.filter(
          (p) =>
            p.name
              ?.toLowerCase()
              .includes(q) ||
            p.product_code
              ?.toLowerCase()
              .includes(q) ||
            p.brand?.title
              ?.toLowerCase()
              .includes(q) ||
            p.category?.title
              ?.toLowerCase()
              .includes(q) ||
            p.subcategory?.name
              ?.toLowerCase()
              .includes(q),
        );
      }, [
        products,
        search,
      ]);

    // =================================================
    // STATUS COUNTS
    // =================================================

    const inStockCount =
      useMemo(
        () =>
          products.filter(
            (p) =>
              p.warehouse_stock
                ?.stock_status ===
              "in_stock",
          ).length,
        [products],
      );

    const lowStockCount =
      useMemo(
        () =>
          products.filter(
            (p) =>
              p.warehouse_stock
                ?.stock_status ===
              "low_stock",
          ).length,
        [products],
      );

    const outOfStockCount =
      useMemo(
        () =>
          products.filter(
            (p) =>
              p.warehouse_stock
                ?.stock_status ===
              "out_of_stock",
          ).length,
        [products],
      );

    // =================================================
    // STOCK STATUS
    // =================================================

    const getStockStatus = (
      product: WarehouseProduct,
    ): StockStatus => {
      const status =
        product
          .warehouse_stock
          ?.stock_status;

      if (
        status === "in_stock" ||
        status === "low_stock" ||
        status === "out_of_stock"
      ) {
        return status;
      }

      return "out_of_stock";
    };

    // =================================================
    // CURRENCY
    // =================================================

    const formatCurrency = (
      value: string | number,
    ) => {
      const num =
        typeof value ===
        "string"
          ? parseFloat(value)
          : value;

      if (isNaN(num)) {
        return "—";
      }

      return `₹${num.toLocaleString(
        "en-IN",
      )}`;
    };

    // =================================================
    // OPERATION CHANGE
    // =================================================

    const handleOperationChange =
      (
        productId: number,
        operation:
          | "add"
          | "subtract",
      ) => {
        if (
          !canUpdateInventory
        ) {
          toast.error(
            "You don't have permission to update inventory.",
          );
          return;
        }

        setEditedQty(
          (prev) => {
            const current =
              prev[productId];

            return {
              ...prev,

              [productId]: {
                operation,
                quantity:
                  current?.quantity,
              },
            };
          },
        );
      };

    // =================================================
    // QUANTITY CHANGE
    // =================================================

    const handleQtyChange = (
      productId: number,
      value: string,
    ) => {
      if (
        !canUpdateInventory
      ) {
        toast.error(
          "You don't have permission to update inventory.",
        );
        return;
      }

      const num =
        value === ""
          ? undefined
          : Math.max(
              0,
              Number(value),
            );

      setEditedQty(
        (prev) => {
          const current =
            prev[productId];

          if (
            !current &&
            num === undefined
          ) {
            const copy = {
              ...prev,
            };

            delete copy[
              productId
            ];

            return copy;
          }

          return {
            ...prev,

            [productId]: {
              operation:
                current?.operation ??
                "add",

              quantity: num,
            },
          };
        },
      );
    };

    // =================================================
    // VALID EDITS
    // =================================================

    const validEdits =
      useMemo(() => {
        return Object.entries(
          editedQty,
        ).filter(
          ([, value]) =>
            value &&
            value.quantity !==
              undefined &&
            value.quantity > 0,
        );
      }, [editedQty]);

    const hasEdits =
      validEdits.length > 0;

    const editCount =
      validEdits.length;

    // =================================================
    // SAVE ALL
    // =================================================

    const handleSaveAll =
      async () => {
        if (
          !canUpdateInventory
        ) {
          toast.error(
            "You don't have permission to update inventory.",
          );
          return;
        }

        if (!hasEdits) {
          toast.error(
            "No valid changes to save",
          );
          return;
        }

        for (const [
          ,
          row,
        ] of validEdits) {
          if (!row) {
            continue;
          }

          if (
            !row.quantity ||
            row.quantity <= 0
          ) {
            toast.error(
              "Quantity must be greater than 0",
            );
            return;
          }
        }

        setIsSaving(true);

        let successCount = 0;
        let failCount = 0;

        try {
          for (const [
            pidStr,
            row,
          ] of validEdits) {
            const pid =
              Number(pidStr);

            if (!row) {
              continue;
            }

            try {
              const res =
                await warehouseStocksApi.updateStock(
                  warehouseId,
                  {
                    product_id:
                      pid,

                    operation:
                      row.operation,

                    quantity:
                      row.quantity ??
                      0,
                  },
                );

              if (res?.data) {
                successCount++;
              } else {
                failCount++;
              }
            } catch (err) {
              console.error(
                `Failed to update product ${pid}:`,
                err,
              );

              failCount++;
            }
          }

          if (
            successCount > 0
          ) {
            toast.success(
              `${successCount} product${
                successCount > 1
                  ? "s"
                  : ""
              } updated successfully!`,
            );
          }

          if (
            failCount > 0
          ) {
            toast.error(
              `${failCount} product${
                failCount > 1
                  ? "s"
                  : ""
              } failed to update.`,
            );
          }

          setEditedQty({});

          await fetchProducts();
        } catch (err: any) {
          console.error(
            "Bulk save error:",
            err,
          );

          toast.error(
            err?.response
              ?.data?.message ||
              "Failed to update inventory",
          );
        } finally {
          setIsSaving(false);
        }
      };

    // =================================================
    // RESET
    // =================================================

    const handleReset = () => {
      if (
        !canUpdateInventory
      ) {
        return;
      }

      setEditedQty({});

      toast.success(
        "Changes discarded",
      );
    };

    // =================================================
    // PAGINATION
    // =================================================

    const handlePageChange =
      (nextPage: number) => {
        if (
          nextPage < 1 ||
          nextPage > totalPages
        ) {
          return;
        }

        setPage(nextPage);
      };

    // =================================================
    // PERMISSION LOADING
    // =================================================

    if (
      permissionsLoading
    ) {
      return (
        <PermissionLoading />
      );
    }

    // =================================================
    // ACCESS DENIED
    // =================================================

    if (
      !canViewInventory
    ) {
      return (
        <AccessDenied />
      );
    }

    // =================================================
    // RENDER
    // =================================================

    return (
      <motion.div
        className="min-h-screen bg-[#F5F8FF] p-4 font-poppins sm:p-5 lg:p-6"
        variants={
          containerVariants
        }
        initial="hidden"
        animate="visible"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <motion.div
          variants={
            itemVariants
          }
          className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
        >
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />

              <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#2563EB]">
                Inventory Management
              </span>
            </div>

            <h1 className="text-[28px] font-bold tracking-tight text-[#0F1B3D] sm:text-[32px]">
              Inventory Update
            </h1>

            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#4A5778]">
              {warehouseName
                ? `Add or subtract stock quantities for products at ${warehouseName}.`
                : "Add or subtract stock quantities for products in this warehouse."}
            </p>
          </div>

          {/* STATUS */}

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded-xl border border-[#1E3A8A]/10 bg-white px-4 py-2.5 shadow-sm">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8C97B2]">
                Total
              </div>

              <div className="mt-0.5 text-lg font-bold text-[#0F1B3D]">
                {total}
              </div>
            </div>

            <div className="rounded-xl border border-[#1E3A8A]/10 bg-white px-4 py-2.5 shadow-sm">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#2563EB]">
                In Stock
              </div>

              <div className="mt-0.5 text-lg font-bold text-[#0F1B3D]">
                {inStockCount}
              </div>
            </div>

            <div className="rounded-xl border border-[#FACC15]/25 bg-white px-4 py-2.5 shadow-sm">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8A6D16]">
                Low
              </div>

              <div className="mt-0.5 text-lg font-bold text-[#8A6D16]">
                {lowStockCount}
              </div>
            </div>

            <div className="rounded-xl border border-[#C23B32]/15 bg-white px-4 py-2.5 shadow-sm">
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#C23B32]">
                Out
              </div>

              <div className="mt-0.5 text-lg font-bold text-[#C23B32]">
                {outOfStockCount}
              </div>
            </div>
          </div>
        </motion.div>

        {/* =================================================
            SEARCH
        ================================================= */}

        <motion.div
          variants={
            itemVariants
          }
          className="relative mb-5 overflow-hidden rounded-[22px] border border-[#E3E9F5] bg-white p-4 shadow-[0_8px_30px_rgba(30,58,138,0.06)] sm:p-5"
        >
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#60A5FA] via-[#2563EB] to-[#1E3A8A]" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-[560px]">
              <FiSearch
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1E3A8A]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value,
                  )
                }
                placeholder="Search products..."
                className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] pl-10 pr-4 text-xs text-[#0F1B3D] outline-none transition-all placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/10"
              />
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={
                  fetchProducts
                }
                disabled={
                  isLoading
                }
                whileHover={{
                  y: -1,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#1E3A8A]/15 bg-[#EAF1FF] px-4 text-xs font-bold text-[#1E3A8A] shadow-sm transition hover:bg-[#DBEAFE] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiRefreshCw
                  size={14}
                  className={
                    isLoading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* =================================================
            EDIT BANNER
        ================================================= */}

        <AnimatePresence>
          {hasEdits &&
            canUpdateInventory && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                }}
                className="mb-4 flex flex-col items-start justify-between gap-3 rounded-[22px] border border-[#1E3A8A]/15 bg-gradient-to-br from-[#EAF1FF] to-white px-4 py-3.5 shadow-[0_8px_30px_rgba(30,58,138,0.06)] md:flex-row md:items-center sm:px-5"
              >
                <div className="flex items-center gap-2.5 text-[12px] text-[#1E3A8A]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A8A]">
                    <FiEdit3
                      className="text-white"
                      size={14}
                    />
                  </div>

                  <div>
                    <span className="font-bold">
                      {editCount}{" "}
                      change
                      {editCount >
                      1
                        ? "s"
                        : ""}{" "}
                      pending
                    </span>

                    <p className="text-[10px] text-[#4A5778]">
                      Review and save
                      your stock updates
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={
                      handleReset
                    }
                    disabled={
                      isSaving
                    }
                    className="rounded-xl border border-[#1E3A8A]/15 bg-white px-4 py-2.5 text-xs font-bold text-[#4A5778] shadow-sm transition hover:bg-[#F5F8FF] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Discard
                  </button>

                  <motion.button
                    type="button"
                    onClick={
                      handleSaveAll
                    }
                    disabled={
                      isSaving
                    }
                    whileHover={{
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.97,
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.55)] transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />

                        Saving...
                      </>
                    ) : (
                      <>
                        <FiEdit3
                          size={14}
                        />

                        Save Changes
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* =================================================
            TABLE
        ================================================= */}

        <motion.div
          variants={
            itemVariants
          }
          className="relative overflow-hidden rounded-[22px] border border-[#E3E9F5] bg-white shadow-[0_8px_30px_rgba(30,58,138,0.06)]"
        >
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#60A5FA] via-[#2563EB] to-[#1E3A8A]" />

          <div className="pt-[3px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiRefreshCw
                    size={22}
                    className="animate-spin"
                  />
                </div>

                <p className="text-sm font-bold text-[#0F1B3D]">
                  Loading inventory...
                </p>

                <p className="text-[10px] text-[#8C97B2]">
                  Fetching warehouse
                  stock data.
                </p>
              </div>
            ) : filteredProducts.length ===
              0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF1FF]">
                  <FiPackage className="text-[28px] text-[#1E3A8A]" />
                </div>

                <h3 className="text-sm font-bold text-[#0F1B3D]">
                  No products found
                </h3>

                <p className="text-xs text-[#4A5778]">
                  {search
                    ? "Try a different search term"
                    : "This warehouse has no products yet"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] table-fixed border-collapse">
                    <colgroup>
                      <col className="w-[22%]" />
                      <col className="w-[9%]" />
                      <col className="w-[12%]" />
                      <col className="w-[10%]" />
                      <col className="w-[10%]" />
                      <col className="w-[13%]" />
                      <col className="w-[9%]" />
                      <col className="w-[15%]" />
                    </colgroup>

                    <thead>
                      <tr className="border-b border-[#D8E2F0] bg-[#F8FAFF]">
                        <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
                          Product
                        </th>

                        <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
                          Code
                        </th>

                        <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
                          Category
                        </th>

                        <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
                          Brand
                        </th>

                        <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
                          Price
                        </th>

                        <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
                          Status
                        </th>

                        <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
                          Current
                        </th>

                        <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#4A5778]">
                          Update Stock
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProducts.map(
                        (
                          product,
                          idx,
                        ) => {
                          const status =
                            getStockStatus(
                              product,
                            );

                          const meta =
                            STOCK_STATUS_META[
                              status
                            ];

                          const StatusIcon =
                            meta.icon;

                          const stockQty =
                            product
                              .warehouse_stock
                              ?.total_quantity ??
                            0;

                          const row =
                            editedQty[
                              product.id
                            ];

                          const operation =
                            row?.operation ??
                            "add";

                          const newQty =
                            row?.quantity;

                          const isEdited =
                            row !==
                              undefined &&
                            newQty !==
                              undefined &&
                            newQty > 0;

                          return (
                            <motion.tr
                              key={
                                product.id
                              }
                              initial={{
                                opacity: 0,
                                y: 6,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                              }}
                              transition={{
                                delay:
                                  idx *
                                  0.02,
                              }}
                              className={`border-b border-[#E3E9F5] last:border-b-0 transition-colors ${
                                isEdited
                                  ? "bg-[#FFFCF2]"
                                  : "hover:bg-[#FAFBFF]"
                              }`}
                            >
                              {/* PRODUCT */}

                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-[#E3E9F5] bg-[#F5F8FF]">
                                    {product.primary_image_url ? (
                                      <img
                                        src={
                                          product.primary_image_url
                                        }
                                        alt={
                                          product.name
                                        }
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[#8C97B2]">
                                        <FiPackage className="text-[16px]" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-bold text-[#0F1B3D]">
                                      {
                                        product.name
                                      }
                                    </p>

                                    <p className="mt-0.5 truncate text-[11px] text-[#8C97B2]">
                                      {product
                                        .subcategory
                                        ?.name ||
                                        "—"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* CODE */}

                              <td className="px-3 py-2.5">
                                <span className="font-mono text-[11px] text-[#4A5778]">
                                  {
                                    product.product_code
                                  }
                                </span>
                              </td>

                              {/* CATEGORY */}

                              <td className="px-3 py-2.5">
                                <span className="truncate text-[12px] text-[#0F1B3D]">
                                  {product
                                    .category
                                    ?.title ||
                                    "—"}
                                </span>
                              </td>

                              {/* BRAND */}

                              <td className="px-3 py-2.5">
                                <span className="truncate text-[12px] text-[#0F1B3D]">
                                  {product
                                    .brand
                                    ?.title ||
                                    "—"}
                                </span>
                              </td>

                              {/* PRICE */}

                              <td className="px-3 py-2.5 text-right">
                                <p className="text-[12px] font-semibold text-[#0F1B3D]">
                                  {formatCurrency(
                                    product.retail_price,
                                  )}
                                </p>

                                <p className="text-[10px] text-[#8C97B2] line-through">
                                  {formatCurrency(
                                    product.retail_mrp,
                                  )}
                                </p>
                              </td>

                              {/* STATUS */}

                              <td className="px-3 py-2.5 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-bold ${meta.bg} ${meta.color} ${meta.border}`}
                                >
                                  <StatusIcon className="text-[11px]" />

                                  {
                                    meta.label
                                  }
                                </span>
                              </td>

                              {/* CURRENT */}

                              <td className="px-3 py-2.5 text-center">
                                <span
                                  className={`inline-flex min-w-[34px] items-center justify-center rounded-lg px-2 py-1 text-[12px] font-bold ${meta.bg} ${meta.color}`}
                                >
                                  {
                                    stockQty
                                  }
                                </span>
                              </td>

                              {/* UPDATE */}

                              <td className="px-3 py-2.5">
                                {canUpdateInventory ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <div className="flex items-center rounded-lg border border-[#D8E2F0] bg-white p-0.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOperationChange(
                                            product.id,
                                            "add",
                                          )
                                        }
                                        className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                                          operation ===
                                          "add"
                                            ? "bg-[#1E3A8A] text-white shadow-sm"
                                            : "text-[#4A5778] hover:bg-[#F5F8FF]"
                                        }`}
                                        title="Add stock"
                                      >
                                        <FiPlus
                                          size={
                                            13
                                          }
                                        />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOperationChange(
                                            product.id,
                                            "subtract",
                                          )
                                        }
                                        className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                                          operation ===
                                          "subtract"
                                            ? "bg-[#C23B32] text-white shadow-sm"
                                            : "text-[#4A5778] hover:bg-[#F5F8FF]"
                                        }`}
                                        title="Subtract stock"
                                      >
                                        <FiMinus
                                          size={
                                            13
                                          }
                                        />
                                      </button>
                                    </div>

                                    <input
                                      type="number"
                                      min={0}
                                      value={
                                        newQty ??
                                        ""
                                      }
                                      onChange={(
                                        e,
                                      ) =>
                                        handleQtyChange(
                                          product.id,
                                          e
                                            .target
                                            .value,
                                        )
                                      }
                                      placeholder="0"
                                      className={`w-16 rounded-lg border px-2 py-1.5 text-center text-[12px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 ${
                                        isEdited
                                          ? operation ===
                                            "add"
                                            ? "border-[#1E3A8A] bg-[#EAF1FF] text-[#1E3A8A]"
                                            : "border-[#C23B32] bg-[#FBEAEA] text-[#C23B32]"
                                          : "border-[#D8E2F0] bg-white text-[#0F1B3D] focus:border-[#1E3A8A]"
                                      }`}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-[9px] font-semibold text-[#8C97B2]">
                                    No update
                                    access
                                  </span>
                                )}
                              </td>
                            </motion.tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}

                {totalPages >
                  1 && (
                  <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E3E9F5] px-5 py-4 md:flex-row">
                    <p className="text-[11px] text-[#4A5778]">
                      Page{" "}
                      <span className="font-bold text-[#0F1B3D]">
                        {page}
                      </span>{" "}
                      of{" "}
                      <span className="font-bold text-[#0F1B3D]">
                        {totalPages}
                      </span>{" "}
                      •{" "}
                      <span className="font-bold text-[#0F1B3D]">
                        {total}
                      </span>{" "}
                      total
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={
                          page ===
                          1
                        }
                        onClick={() =>
                          handlePageChange(
                            page -
                              1,
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E3A8A]/15 bg-white text-[#4A5778] transition hover:bg-[#EAF1FF] hover:text-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FiChevronLeft />
                      </button>

                      <button
                        type="button"
                        disabled={
                          page ===
                          totalPages
                        }
                        onClick={() =>
                          handlePageChange(
                            page +
                              1,
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E3A8A]/15 bg-white text-[#4A5778] transition hover:bg-[#EAF1FF] hover:text-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        <div className="h-5" />
      </motion.div>
    );
  };

export default Inventorywarehouse;