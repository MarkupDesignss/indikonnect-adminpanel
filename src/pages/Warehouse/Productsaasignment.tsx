
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  RefreshCw,
  Package,
  Warehouse as WarehouseIcon,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  AlertCircle,
  Boxes,
  SlidersHorizontal,
} from "lucide-react";

import { toast } from "react-hot-toast";

import {
  productApi,
  Product,
} from "../../api/endpoints/product";

import warehousesApi, {
  Warehouse,
} from "../../api/endpoints/warehouse";

import logoApi from "../../api/endpoints/logoApi";

import { usePermissions } from "../permissions/usePermissions";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

const PER_PAGE = 12;
const API_PER_PAGE = 100;

// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (
  value: string | number | undefined,
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "₹0";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return `₹${value}`;
  }

  return `₹${numericValue.toLocaleString("en-IN")}`;
};

const getProductImage = (product: Product) => {
  return (
    product.primary_image_url ||
    product.primary_image ||
    product.images?.find((img: any) => img.is_primary)?.image_url ||
    product.images?.[0]?.image_url ||
    ""
  );
};

/**
 * Product status is different from stock status.
 *
 * API response may not contain a `status` field.
 * In that case, use is_published and stock_status.
 */
const getProductStatus = (product: Product): string => {
  const item = product as any;

  const apiStatus = String(item.status || "").toLowerCase();

  if (
    ["active", "inactive", "draft"].includes(apiStatus)
  ) {
    return apiStatus;
  }

  if (
    item.is_published === true ||
    Number(item.is_published) === 1
  ) {
    return "active";
  }

  // API response example:
  // is_published: false
  // stock_status: "draft"
  if (
    String(item.stock_status || "").toLowerCase() === "draft"
  ) {
    return "draft";
  }

  return "inactive";
};

/**
 * Normalize stock status using actual available quantity.
 *
 * Priority:
 * 1. Out of stock
 * 2. Inactive
 * 3. Low stock
 * 4. In stock
 */
const getProductStockStatus = (
  product: Product,
): string => {
  const item = product as any;

  const apiStockStatus = String(
    item.stock_status || "",
  ).toLowerCase();

  const quantity = Number(
    item.stock_quantity ??
      item.stock_movement?.available_stock ??
      0,
  );

  const lowStockThreshold = Number(
    item.low_stock_threshold ?? 0,
  );

  if (
    apiStockStatus === "out_of_stock" ||
    quantity <= 0
  ) {
    return "out_of_stock";
  }

  if (apiStockStatus === "inactive") {
    return "inactive";
  }

  if (
    apiStockStatus === "low_stock" ||
    (lowStockThreshold > 0 &&
      quantity <= lowStockThreshold)
  ) {
    return "low_stock";
  }

  if (
    apiStockStatus === "active" ||
    quantity > 0
  ) {
    return "active";
  }

  return "inactive";
};

// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({
  product,
}: {
  product: Product;
}) => {
  const status = getProductStatus(product);

  const configMap: Record<
    string,
    {
      label: string;
      className: string;
    }
  > = {
    active: {
      label: "Active",
      className:
        "bg-[#EAF3FF] text-[#2D6FE8] border-[#2D6FE8]/20",
    },

    inactive: {
      label: "Inactive",
      className:
        "bg-[#F4F8FD] text-[#6B7280] border-[#DCE6F2]",
    },

    draft: {
      label: "Draft",
      className:
        "bg-[#FEF9C3] text-[#A16207] border-[#FACC15]/40",
    },
  };

  const config = configMap[status] || {
    label: status || "Unknown",
    className:
      "bg-[#F4F8FD] text-[#6B7280] border-[#DCE6F2]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
};

// =====================================================
// STOCK BADGE
// =====================================================

const StockBadge = ({
  product,
}: {
  product: Product;
}) => {
  const status = getProductStockStatus(product);

  const configMap: Record<
    string,
    {
      label: string;
      className: string;
    }
  > = {
    active: {
      label: "In Stock",
      className:
        "bg-[#EAF3FF] text-[#2D6FE8] border-[#2D6FE8]/20",
    },

    low_stock: {
      label: "Low Stock",
      className:
        "bg-[#FEF9C3] text-[#A16207] border-[#FACC15]/40",
    },

    inactive: {
      label: "Inactive",
      className:
        "bg-[#F4F8FD] text-[#6B7280] border-[#DCE6F2]",
    },

    out_of_stock: {
      label: "Out of Stock",
      className:
        "bg-[#FEF2F2] text-[#C23B32] border-[#C23B32]/20",
    },
  };

  const config = configMap[status] || {
    label: status || "Unknown",
    className:
      "bg-[#F4F8FD] text-[#6B7280] border-[#DCE6F2]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
};

// =====================================================
// PAGE
// =====================================================

const Productsaasignment: React.FC = () => {
  // ===================================================
  // PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewProducts = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("warehouse") ||
      hasModuleAccess("product") ||
      hasPermission("warehouse.view") ||
      hasPermission("product.view"),
    [
      isSuperAdmin,
      hasModuleAccess,
      hasPermission,
    ],
  );

  const canAssignProducts = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("warehouse.update") ||
      hasPermission("warehouse.assign") ||
      hasPermission("product.update"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // INITIAL LOADING
  // ===================================================

  const [initialDataLoading, setInitialDataLoading] =
    useState(true);

  const [logoLoading, setLogoLoading] =
    useState(true);

  const [logoUrl, setLogoUrl] = useState<string>(
    DEFAULT_LOGO_URL,
  );

  // ===================================================
  // PRODUCTS
  // ===================================================

  // Products currently visible in the table.
  const [products, setProducts] = useState<Product[]>([]);

  // Complete filtered product list.
  // Used when applying filters across all API pages.
  const [filteredProducts, setFilteredProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<string>("all");

  const [stockFilter, setStockFilter] =
    useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);

  const [lastPage, setLastPage] = useState(1);

  const [totalProducts, setTotalProducts] = useState(0);

  // ===================================================
  // SELECTION
  // ===================================================

  const [selectionMode, setSelectionMode] =
    useState(false);

  const [selectedProducts, setSelectedProducts] =
    useState<Product[]>([]);

  // ===================================================
  // WAREHOUSE MODAL
  // ===================================================

  const [assignModalOpen, setAssignModalOpen] =
    useState(false);

  const [warehouseLoading, setWarehouseLoading] =
    useState(false);

  const [warehouses, setWarehouses] =
    useState<Warehouse[]>([]);

  const [selectedWarehouseId, setSelectedWarehouseId] =
    useState<number | "">("");

  const [assignLoading, setAssignLoading] =
    useState(false);

  const [selectedVariants, setSelectedVariants] =
    useState<Record<number, number | null>>({});

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
  // FILTER HELPERS
  // ===================================================

  const applyProductFilters = useCallback(
    (productList: Product[]) => {
      return productList.filter((product) => {
        const matchesStatus =
          statusFilter === "all" ||
          getProductStatus(product) === statusFilter;

        const matchesStock =
          stockFilter === "all" ||
          getProductStockStatus(product) === stockFilter;

        return matchesStatus && matchesStock;
      });
    },
    [statusFilter, stockFilter],
  );

  // ===================================================
  // FETCH PRODUCTS
  // ===================================================

  const fetchProducts = useCallback(
    async (isInitialLoad = false) => {
      try {
        setLoading(true);

        const filtersActive =
          statusFilter !== "all" ||
          stockFilter !== "all";

        let productList: Product[] = [];

        // -------------------------------------------------
        // FILTER MODE
        // Fetch all search-result pages first.
        // Then apply both filters locally.
        // -------------------------------------------------

        if (filtersActive) {
          const firstResponse =
            await productApi.getProducts({
              page: 1,
              per_page: API_PER_PAGE,

              ...(search.trim()
                ? { search: search.trim() }
                : {}),
            });

          const firstData = firstResponse?.data;

          const firstProducts = Array.isArray(firstData?.data)
            ? firstData.data
            : [];

          productList = [...firstProducts];

          const apiLastPage = Math.max(
            Number(firstData?.pagination?.last_page || 1),
            1,
          );

          // Fetch remaining pages if API returns more than 100.
          if (apiLastPage > 1) {
            const remainingPages = Array.from(
              { length: apiLastPage - 1 },
              (_, index) => index + 2,
            );

            const remainingResponses = await Promise.all(
              remainingPages.map((page) =>
                productApi.getProducts({
                  page,
                  per_page: API_PER_PAGE,

                  ...(search.trim()
                    ? { search: search.trim() }
                    : {}),
                }),
              ),
            );

            remainingResponses.forEach((response) => {
              const pageData = response?.data;

              const pageProducts = Array.isArray(pageData?.data)
                ? pageData.data
                : [];

              productList.push(...pageProducts);
            });
          }

          // Avoid duplicate products if API pages overlap.
          const uniqueProducts = Array.from(
            new Map(
              productList.map((product) => [
                product.id,
                product,
              ]),
            ).values(),
          );

          // Apply both filters independently.
          const matchingProducts =
            applyProductFilters(uniqueProducts);

          setFilteredProducts(matchingProducts);

          setTotalProducts(matchingProducts.length);

          const calculatedLastPage = Math.max(
            Math.ceil(matchingProducts.length / PER_PAGE),
            1,
          );

          setLastPage(calculatedLastPage);

          // Keep the current page within valid range.
          const safePage = Math.min(
            currentPage,
            calculatedLastPage,
          );

          const startIndex = (safePage - 1) * PER_PAGE;

          setProducts(
            matchingProducts.slice(
              startIndex,
              startIndex + PER_PAGE,
            ),
          );
        } else {
          // -------------------------------------------------
          // NORMAL MODE
          // Use standard server-side pagination.
          // -------------------------------------------------

          const response =
            await productApi.getProducts({
              page: currentPage,
              per_page: PER_PAGE,

              ...(search.trim()
                ? { search: search.trim() }
                : {}),
            });

          const apiData = response?.data;

          productList = Array.isArray(apiData?.data)
            ? apiData.data
            : [];

          setProducts(productList);

          setFilteredProducts(productList);

          setTotalProducts(
            Number(apiData?.pagination?.total || 0),
          );

          setLastPage(
            Math.max(
              Number(apiData?.pagination?.last_page || 1),
              1,
            ),
          );
        }
      } catch (error: any) {
        console.error("Products API Error:", error);

        toast.error(
          error?.response?.data?.message ||
            "Failed to load products",
        );

        setProducts([]);
        setFilteredProducts([]);
        setLastPage(1);
        setTotalProducts(0);
      } finally {
        setLoading(false);

        if (isInitialLoad) {
          setInitialDataLoading(false);
        }
      }
    },
    [
      currentPage,
      search,
      statusFilter,
      stockFilter,
      applyProductFilters,
    ],
  );

  // ===================================================
  // FETCH AFTER PERMISSIONS
  // ===================================================

  useEffect(() => {
    if (permissionsLoading) {
      return;
    }

    if (!canViewProducts) {
      setInitialDataLoading(false);
      return;
    }

    void fetchProducts(true);
  }, [
    fetchProducts,
    canViewProducts,
    permissionsLoading,
  ]);

  // ===================================================
  // PAGE LOADING
  // ===================================================

  const pageLoading =
    permissionsLoading ||
    logoLoading ||
    initialDataLoading;

  // ===================================================
  // FILTER CHANGE HANDLERS
  // ===================================================

  const handleSearchChange = (
    value: string,
  ) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (
    value: string,
  ) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleStockFilterChange = (
    value: string,
  ) => {
    setStockFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setStockFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    stockFilter !== "all";

  // ===================================================
  // SELECTION HELPERS
  // ===================================================

  const isSelected = (productId: number) => {
    return selectedProducts.some(
      (product) => product.id === productId,
    );
  };

  const toggleProduct = (product: Product) => {
    setSelectedProducts((prev) => {
      const exists = prev.some(
        (item) => item.id === product.id,
      );

      if (exists) {
        return prev.filter(
          (item) => item.id !== product.id,
        );
      }

      return [...prev, product];
    });
  };

  const allCurrentSelected = useMemo(() => {
    if (!products.length) return false;

    return products.every((product) =>
      selectedProducts.some(
        (selected) => selected.id === product.id,
      ),
    );
  }, [products, selectedProducts]);

  const toggleSelectAllCurrentPage = () => {
    if (allCurrentSelected) {
      setSelectedProducts((prev) =>
        prev.filter(
          (selected) =>
            !products.some(
              (product) => product.id === selected.id,
            ),
        ),
      );

      return;
    }

    setSelectedProducts((prev) => {
      const existingIds = new Set(
        prev.map((item) => item.id),
      );

      const newProducts = products.filter(
        (product) => !existingIds.has(product.id),
      );

      return [...prev, ...newProducts];
    });
  };

  const clearSelection = () => {
    setSelectedProducts([]);
    setSelectedVariants({});
    setSelectionMode(false);
    setAssignModalOpen(false);
  };

  // ===================================================
  // LOAD WAREHOUSES
  // ===================================================

  const loadWarehouses = async () => {
    try {
      setWarehouseLoading(true);

      const response = await warehousesApi.getAll(1, 100);

      const apiResponse = response?.data;

      const warehouseList = Array.isArray(
        apiResponse?.data?.data,
      )
        ? apiResponse.data.data
        : [];

      const activeWarehouses = warehouseList.filter(
        (warehouse) => warehouse.is_active === true,
      );

      setWarehouses(activeWarehouses);

      if (!activeWarehouses.length) {
        toast.error("No active warehouse found");
        return;
      }

      setAssignModalOpen(true);
    } catch (error: any) {
      console.error("Warehouse API Error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to load warehouses",
      );
    } finally {
      setWarehouseLoading(false);
    }
  };

  // ===================================================
  // OPEN ASSIGN MODAL
  // ===================================================

  const handleOpenAssign = async () => {
    if (!selectedProducts.length) {
      toast.error("Please select at least one product");
      return;
    }

    setSelectedWarehouseId("");

    const initialVariants: Record<
      number,
      number | null
    > = {};

    selectedProducts.forEach((product) => {
      initialVariants[product.id] = null;
    });

    setSelectedVariants(initialVariants);

    await loadWarehouses();
  };

  // ===================================================
  // CHANGE VARIANT
  // ===================================================

  const handleVariantChange = (
    productId: number,
    variantValue: string,
  ) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]:
        variantValue === ""
          ? null
          : Number(variantValue),
    }));
  };

  // ===================================================
  // ASSIGN PRODUCTS
  // ===================================================

  const handleAssignProducts = async () => {
    if (!selectedWarehouseId) {
      toast.error("Please select a warehouse");
      return;
    }

    if (!selectedProducts.length) {
      toast.error("Please select products");
      return;
    }

    try {
      setAssignLoading(true);

      const productIds = selectedProducts.map(
        (product) => product.id,
      );

      const variantIds = selectedProducts.map(
        (product) => {
          if (
            !product.variants ||
            product.variants.length === 0
          ) {
            return null;
          }

          return selectedVariants[product.id] ?? null;
        },
      );

      const payload = {
        warehouse_id: Number(selectedWarehouseId),
        product_id: productIds,
        variant_id: variantIds,
        quantity: 0,
      };

      console.log("Warehouse Stock Payload:", payload);

      const response =
        await productApi.assignProductsToWarehouse(payload);

      toast.success(
        response?.data?.message ||
          "Products assigned to warehouse successfully",
      );

      setAssignModalOpen(false);
      setSelectedWarehouseId("");
      setSelectedProducts([]);
      setSelectedVariants({});
      setSelectionMode(false);

      await fetchProducts();
    } catch (error: any) {
      console.error("Assign Warehouse Error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to assign products to warehouse",
      );
    } finally {
      setAssignLoading(false);
    }
  };

  // ===================================================
  // PAGINATION
  // ===================================================

  const paginationText = useMemo(() => {
    if (!totalProducts) {
      return "0 products";
    }

    const start = (currentPage - 1) * PER_PAGE + 1;

    const end = Math.min(
      currentPage * PER_PAGE,
      totalProducts,
    );

    return `${start}-${end} of ${totalProducts} products`;
  }, [currentPage, totalProducts]);

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  // ===================================================
  // ACCESS DENIED
  // ===================================================

  if (!canViewProducts) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
            <AlertCircle size={26} />
          </div>

          <h2 className="text-lg font-bold text-[#111827]">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-[#6B7280]">
            You don't have access to the Product Assignment module.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // COLUMN COUNT
  // ===================================================

  const columnCount = (selectionMode ? 1 : 0) + 9;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-white p-4 font-poppins md:p-6">
      {/* HEADER */}

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FF]">
              <Package
                size={22}
                className="text-[#2D6FE8]"
              />
            </div>

            <div>
              <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
                All Products
              </h1>

              <p className="text-sm text-[#111827]">
                View, search and assign products to warehouses
              </p>
            </div>
          </div>
        </div>

        {/* HEADER BUTTONS */}

        <div className="flex flex-wrap items-center gap-2">
          {selectionMode ? (
            <>
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-[#111827] transition hover:bg-[#F4F8FD]"
              >
                <X size={16} />
                Cancel
              </button>

              <button
                type="button"
                onClick={toggleSelectAllCurrentPage}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-[#2D6FE8] transition hover:bg-[#EAF3FF]"
              >
                <Check size={16} />
                {allCurrentSelected
                  ? "Unselect All"
                  : "Select All"}
              </button>

              {canAssignProducts && (
                <button
                  type="button"
                  onClick={handleOpenAssign}
                  disabled={
                    selectedProducts.length === 0 ||
                    warehouseLoading
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(45,111,232,0.15)] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <WarehouseIcon size={17} />

                  {warehouseLoading
                    ? "Loading..."
                    : `Assign to Warehouse (${selectedProducts.length})`}
                </button>
              )}
            </>
          ) : (
            canAssignProducts && (
              <button
                type="button"
                onClick={() => setSelectionMode(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-4 text-sm font-semibold text-white transition hover:-translate-y-[1px]"
              >
                <WarehouseIcon size={17} />
                Assign Products to Warehouse
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => void fetchProducts()}
            disabled={loading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {/* FILTER CARD */}

      <div className="mb-4 rounded-2xl border border-[#DCE6F2] bg-white p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                handleSearchChange(e.target.value)
              }
              placeholder="Search product name or product code..."
              className="h-11 w-full rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] pl-10 pr-4 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:ring-4 focus:ring-[#2D6FE8]/10"
            />
          </div>

          {/* PRODUCT STATUS FILTER */}

          <div className="relative">
            <SlidersHorizontal
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                handleStatusFilterChange(e.target.value)
              }
              className="h-11 min-w-[160px] appearance-none rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] pl-9 pr-8 text-sm font-medium text-[#111827] outline-none focus:border-[#2D6FE8] focus:ring-4 focus:ring-[#2D6FE8]/10"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* STOCK STATUS FILTER */}

          <div className="relative">
            <Boxes
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
            />

            <select
              value={stockFilter}
              onChange={(e) =>
                handleStockFilterChange(e.target.value)
              }
              className="h-11 min-w-[165px] appearance-none rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] pl-9 pr-8 text-sm font-medium text-[#111827] outline-none focus:border-[#2D6FE8] focus:ring-4 focus:ring-[#2D6FE8]/10"
            >
              <option value="all">All Stock</option>
              <option value="active">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* CLEAR FILTERS */}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#DCE6F2] bg-white px-4 text-sm font-semibold text-[#C23B32] transition hover:bg-[#FEF2F2]"
            >
              <X size={15} />
              Clear Filters
            </button>
          )}
        </div>

        {/* ACTIVE FILTER SUMMARY */}

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#DCE6F2] pt-3">
            <span className="text-xs font-semibold text-[#6B7280]">
              Active filters:
            </span>

            {search.trim() && (
              <span className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[10px] font-semibold text-[#2D6FE8]">
                Search: {search.trim()}
              </span>
            )}

            {statusFilter !== "all" && (
              <span className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[10px] font-semibold text-[#2D6FE8]">
                Status:{" "}
                {statusFilter.charAt(0).toUpperCase() +
                  statusFilter.slice(1)}
              </span>
            )}

            {stockFilter !== "all" && (
              <span className="rounded-full bg-[#FEF9C3] px-2.5 py-1 text-[10px] font-semibold text-[#A16207]">
                Stock:{" "}
                {stockFilter === "active"
                  ? "In Stock"
                  : stockFilter === "low_stock"
                    ? "Low Stock"
                    : stockFilter === "out_of_stock"
                      ? "Out of Stock"
                      : "Inactive"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* SELECTED INFO */}

      {selectionMode && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2D6FE8]/20 bg-[#EAF3FF] px-4 py-3">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-[#2D6FE8]" />

            <span className="text-sm font-semibold text-[#111827]">
              {selectedProducts.length} product
              {selectedProducts.length === 1 ? "" : "s"} selected
            </span>
          </div>

          {selectedProducts.length > 0 && (
            <span className="text-xs text-[#6B7280]">
              Select warehouse to assign these products
            </span>
          )}
        </div>
      )}

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] table-fixed">
            <colgroup>
              {selectionMode && (
                <col style={{ width: "45px" }} />
              )}

              <col style={{ width: "55px" }} />
              <col style={{ width: "260px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "110px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "120px" }} />
            </colgroup>

            <thead>
              <tr className="bg-[#4F8FF7]">
                {selectionMode && (
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allCurrentSelected}
                      onChange={toggleSelectAllCurrentPage}
                      disabled={!products.length || loading}
                      className="h-3.5 w-3.5 cursor-pointer accent-white"
                    />
                  </th>
                )}

                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white">
                  S.No.
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white">
                  Product
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white">
                  Code
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white">
                  Category
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white">
                  Retail Price
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white">
                  Distributor Price
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white">
                  Stock
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white">
                  Status
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white">
                  Stock Status
                </th>
              </tr>
            </thead>

            <tbody>
              {/* TABLE SKELETON */}

              {loading ? (
                Array.from({ length: 7 }).map((_, index) => (
                  <tr
                    key={index}
                    className="border-b border-[#DCE6F2]"
                  >
                    {selectionMode && (
                      <td className="px-3 py-3">
                        <div className="h-3.5 w-3.5 animate-pulse rounded bg-[#EAF3FF]" />
                      </td>
                    )}

                    <td className="px-3 py-3">
                      <div className="h-6 w-6 animate-pulse rounded-md bg-[#EAF3FF]" />
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 animate-pulse rounded-lg bg-[#EAF3FF]" />

                        <div className="space-y-1.5">
                          <div className="h-3 w-32 animate-pulse rounded bg-[#EAF3FF]" />
                          <div className="h-2.5 w-20 animate-pulse rounded bg-[#F4F8FD]" />
                        </div>
                      </div>
                    </td>

                    {Array.from({ length: 7 }).map((__, i) => (
                      <td key={i} className="px-3 py-3">
                        <div className="h-3 w-16 animate-pulse rounded bg-[#F4F8FD]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnCount}
                    className="px-6 py-16"
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF3FF]">
                        <Package
                          size={25}
                          className="text-[#2D6FE8]"
                        />
                      </div>

                      <h3 className="text-sm font-bold text-[#111827]">
                        No products found
                      </h3>

                      <p className="mt-1 text-xs text-[#6B7280]">
                        Try changing your search or filters.
                      </p>

                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="mt-3 text-xs font-semibold text-[#2D6FE8] hover:underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product, index) => {
                  const selected = isSelected(product.id);

                  const image = getProductImage(product);

                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-[#DCE6F2] transition last:border-b-0 ${
                        selected
                          ? "bg-[#EAF3FF]/60"
                          : "bg-white hover:bg-[#F8FBFF]"
                      }`}
                    >
                      {selectionMode && (
                        <td className="px-3 py-3 align-top">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              toggleProduct(product)
                            }
                            className="mt-1.5 h-3.5 w-3.5 cursor-pointer accent-[#2D6FE8]"
                          />
                        </td>
                      )}

                      {/* S.NO. */}

                      <td className="px-3 py-3 align-top">
                        <span className="mt-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF3FF] text-[10px] font-bold text-[#2D6FE8]">
                          {(currentPage - 1) * PER_PAGE +
                            index +
                            1}
                        </span>
                      </td>

                      {/* PRODUCT */}

                      <td className="px-3 py-3 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F4F8FD]">
                            {image ? (
                              <img
                                src={image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon
                                size={14}
                                className="text-[#6B7280]"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 pt-0.5">
                            <p
                              className="line-clamp-2 break-words text-[11px] font-semibold leading-4 text-[#111827]"
                              title={product.name}
                            >
                              {product.name}
                            </p>

                            {product.is_trending && (
                              <span className="mt-1 inline-flex rounded-full bg-[#FEF9C3] px-1.5 py-0.5 text-[9px] font-semibold text-[#A16207]">
                                Trending
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CODE */}

                      <td className="px-3 py-3 align-top">
                        <span className="mt-1 inline-block rounded-md bg-[#F4F8FD] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#111827]">
                          {product.product_code?.trim() || "-"}
                        </span>
                      </td>

                      {/* CATEGORY */}

                      <td className="px-3 py-3 align-top">
                        <span className="mt-1 inline-block text-[11px] text-[#111827]">
                          {product.category?.title ||
                            product.category?.name ||
                            "-"}
                        </span>
                      </td>

                      {/* RETAIL PRICE */}

                      <td className="px-3 py-3 align-top">
                        <div className="mt-1">
                          <p className="text-[11px] font-bold text-[#111827]">
                            {formatCurrency(product.retail_price)}
                          </p>

                          {Number(product.retail_mrp) >
                            Number(product.retail_price) && (
                            <p className="text-[10px] text-[#6B7280] line-through">
                              {formatCurrency(product.retail_mrp)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* DISTRIBUTOR PRICE */}

                      <td className="px-3 py-3 align-top">
                        <div className="mt-1">
                          <p className="text-[11px] font-bold text-[#2D6FE8]">
                            {formatCurrency(
                              product.distributor_price,
                            )}
                          </p>

                          {Number(product.distributor_mrp) >
                            Number(
                              product.distributor_price,
                            ) && (
                            <p className="text-[10px] text-[#6B7280] line-through">
                              {formatCurrency(
                                product.distributor_mrp,
                              )}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* STOCK */}

                      <td className="px-3 py-3 align-top">
                        <div className="mt-1 flex items-start gap-1.5">
                          <Boxes
                            size={13}
                            className="mt-0.5 text-[#2D6FE8]"
                          />

                          <div>
                            <p className="text-[11px] font-bold text-[#111827]">
                              {product.stock_quantity ?? 0}
                            </p>

                            <p className="text-[9px] text-[#6B7280]">
                              Min:{" "}
                              {product.low_stock_threshold ?? 0}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* PRODUCT STATUS */}

                      <td className="px-3 py-3 align-top">
                        <div className="mt-1.5">
                          <StatusBadge product={product} />
                        </div>
                      </td>

                      {/* STOCK STATUS */}

                      <td className="px-3 py-3 align-top">
                        <div className="mt-1.5">
                          <StockBadge product={product} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        {!loading && products.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#DCE6F2] bg-[#F8FBFF] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-[#6B7280]">
              {paginationText}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(1, page - 1),
                  )
                }
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>

              <div className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-3 text-xs font-bold text-white">
                {currentPage}
              </div>

              <span className="text-xs text-[#6B7280]">
                of {lastPage}
              </span>

              <button
                type="button"
                disabled={currentPage >= lastPage}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(lastPage, page + 1),
                  )
                }
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ASSIGN WAREHOUSE MODAL */}

      {canAssignProducts && assignModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#111827]/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white font-poppins shadow-[0_25px_80px_rgba(45,111,232,0.20)]">
            {/* HEADER */}

            <div className="relative border-b border-[#DCE6F2] px-5 py-4">
              <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#FACC15]" />

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FF]">
                    <WarehouseIcon
                      size={19}
                      className="text-[#2D6FE8]"
                    />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-[#111827]">
                      Assign Products to Warehouse
                    </h2>

                    <p className="mt-0.5 text-xs text-[#6B7280]">
                      {selectedProducts.length} selected product
                      {selectedProducts.length === 1
                        ? ""
                        : "s"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  disabled={assignLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] text-[#6B7280] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* BODY */}

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {/* WAREHOUSE */}

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-[#111827]">
                  Select Warehouse
                  <span className="ml-1 text-[#C23B32]">
                    *
                  </span>
                </label>

                <select
                  value={selectedWarehouseId}
                  onChange={(e) =>
                    setSelectedWarehouseId(
                      e.target.value
                        ? Number(e.target.value)
                        : "",
                    )
                  }
                  disabled={assignLoading}
                  className="h-11 w-full rounded-lg border border-[#DCE6F2] bg-[#F4F8FD] px-3 text-sm text-[#111827] outline-none transition focus:border-[#2D6FE8] focus:ring-4 focus:ring-[#2D6FE8]/10"
                >
                  <option value="">
                    Select warehouse
                  </option>

                  {warehouses.map((warehouse) => (
                    <option
                      key={warehouse.id}
                      value={warehouse.id}
                    >
                      {warehouse.name}
                      {warehouse.code
                        ? ` (${warehouse.code})`
                        : ""}
                    </option>
                  ))}
                </select>

                <p className="mt-1.5 text-xs text-[#6B7280]">
                  Selected products will be assigned to this warehouse.
                </p>
              </div>

              {/* PRODUCTS */}

              <div className="rounded-xl border border-[#DCE6F2] bg-[#F8FBFF]">
                <div className="border-b border-[#DCE6F2] px-4 py-3">
                  <h3 className="text-sm font-bold text-[#111827]">
                    Selected Products
                  </h3>
                </div>

                <div className="divide-y divide-[#DCE6F2]">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white px-4 py-3"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#DCE6F2] bg-[#F4F8FD]">
                            {getProductImage(product) ? (
                              <img
                                src={getProductImage(product)}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package
                                size={16}
                                className="text-[#6B7280]"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-semibold text-[#111827]"
                              title={product.name}
                            >
                              {product.name}
                            </p>

                            <p className="mt-0.5 text-xs text-[#6B7280]">
                              {product.product_code?.trim() || "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONFIRMATION INFO */}

              <div className="mt-4 rounded-xl border border-[#2D6FE8]/20 bg-[#EAF3FF] p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#2D6FE8]">
                    <WarehouseIcon size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#111827]">
                      Ready to Assign
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                      {selectedProducts.length} selected product
                      {selectedProducts.length === 1
                        ? ""
                        : "s"}{" "}
                      will be assigned to the selected warehouse.
                      Please verify the warehouse before clicking{" "}
                      <span className="font-semibold text-[#2D6FE8]">
                        Assign Products
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex flex-col-reverse gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                disabled={assignLoading}
                onClick={() => setAssignModalOpen(false)}
                className="h-10 rounded-lg border border-[#DCE6F2] bg-white px-5 text-sm font-semibold text-[#111827] transition hover:bg-[#F4F8FD] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  assignLoading ||
                  !selectedWarehouseId ||
                  selectedProducts.length === 0
                }
                onClick={handleAssignProducts}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(45,111,232,0.15)] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assignLoading ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Assign Products
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productsaasignment;
