"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

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
  ProductVariant,
} from "../../api/endpoints/product";

import warehousesApi, {
  Warehouse,
} from "../../api/endpoints/warehouse";

// ✅ PERMISSIONS
import { usePermissions } from "../permissions/usePermissions";

// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === "") {
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
    product.images?.find((img) => img.is_primary)?.image_url ||
    product.images?.[0]?.image_url ||
    ""
  );
};

const getVariantLabel = (variant: ProductVariant) => {
  const attributes = Object.entries(variant.attributes || {});

  if (!attributes.length) {
    return variant.sku || `Variant #${variant.id}`;
  }

  return attributes
    .map(([key, value]) => `${key}: ${value}`)
    .join(" • ");
};

// =====================================================
// PERMISSION LOADING STATE
// =====================================================

const PermissionLoadingState: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] p-6 font-poppins">
      <div className="w-full max-w-md rounded-2xl border border-[#D8E2F0] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
          <RefreshCw size={24} className="animate-spin" />
        </div>

        <h2 className="mt-5 text-base font-bold text-[#0F1B3D]">
          Checking permissions...
        </h2>

        <p className="mt-2 text-sm text-[#8C97B2]">
          Please wait while we verify your access.
        </p>
      </div>
    </div>
  );
};

// =====================================================
// STATUS BADGE — NAVY THEME
// =====================================================

const StatusBadge = ({
  status,
}: {
  status: Product["status"];
}) => {
  const configMap: Record<
    string,
    { label: string; className: string }
  > = {
    active: {
      label: "Active",
      className: "bg-[#EAF1FF] text-[#1E3A8A] border-[#1E3A8A]/20",
    },
    inactive: {
      label: "Inactive",
      className: "bg-[#F5F8FF] text-[#4A5778] border-[#E3E9F5]",
    },
    draft: {
      label: "Draft",
      className: "bg-[#FEF9C3] text-[#8A6A00] border-[#FACC15]/40",
    },
  };

  const config = configMap[status as string] || {
    label: status ? String(status) : "Unknown",
    className: "bg-[#F5F8FF] text-[#4A5778] border-[#E3E9F5]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
};

// =====================================================
// STOCK BADGE — NAVY THEME
// =====================================================

const StockBadge = ({
  status,
}: {
  status: Product["stock_status"];
}) => {
  const configMap: Record<
    string,
    { label: string; className: string }
  > = {
    active: {
      label: "In Stock",
      className: "bg-[#EAF1FF] text-[#1E3A8A] border-[#1E3A8A]/20",
    },
    inactive: {
      label: "Inactive",
      className: "bg-[#F5F8FF] text-[#4A5778] border-[#E3E9F5]",
    },
    out_of_stock: {
      label: "Out of Stock",
      className: "bg-[#FBEAEA] text-[#C23B32] border-[#C23B32]/20",
    },
  };

  const config = configMap[status as string] || {
    label: status ? String(status) : "Unknown",
    className: "bg-[#F5F8FF] text-[#4A5778] border-[#E3E9F5]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
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
  // ✅ PERMISSIONS
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
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  const canAssignProducts = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("warehouse.update") ||
      hasPermission("warehouse.assign") ||
      hasPermission("product.update"),
    [isSuperAdmin, hasPermission],
  );

  // =====================================================
  // PRODUCTS
  // =====================================================

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const PER_PAGE = 12;

  // =====================================================
  // SELECTION
  // =====================================================

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  // =====================================================
  // WAREHOUSE MODAL
  // =====================================================

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | "">(
    "",
  );
  const [assignLoading, setAssignLoading] = useState(false);

  // productId -> variantId/null
  const [selectedVariants, setSelectedVariants] = useState<
    Record<number, number | null>
  >({});

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const response = await productApi.getProducts({
        page: currentPage,
        per_page: PER_PAGE,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(stockFilter !== "all" ? { stock_status: stockFilter } : {}),
      });

      const apiData = response?.data;

      const productList = Array.isArray(apiData?.data) ? apiData.data : [];

      setProducts(productList);

      setTotalProducts(apiData?.pagination?.total || 0);
      setLastPage(apiData?.pagination?.last_page || 1);
    } catch (error: any) {
      console.error("Products API Error:", error);

      toast.error(
        error?.response?.data?.message || "Failed to load products",
      );

      setProducts([]);
      setLastPage(1);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, stockFilter]);

  useEffect(() => {
    if (!permissionsLoading && canViewProducts) {
      fetchProducts();
    }
  }, [fetchProducts, canViewProducts, permissionsLoading]);

  // =====================================================
  // SEARCH RESET PAGE
  // =====================================================

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [search, statusFilter, stockFilter, currentPage]);

  // =====================================================
  // SELECTION HELPERS
  // =====================================================

  const isSelected = (productId: number) => {
    return selectedProducts.some((product) => product.id === productId);
  };

  const toggleProduct = (product: Product) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((item) => item.id === product.id);

      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }

      return [...prev, product];
    });
  };

  const allCurrentSelected = useMemo(() => {
    if (!products.length) return false;

    return products.every((product) =>
      selectedProducts.some((selected) => selected.id === product.id),
    );
  }, [products, selectedProducts]);

  const toggleSelectAllCurrentPage = () => {
    if (allCurrentSelected) {
      setSelectedProducts((prev) =>
        prev.filter(
          (selected) =>
            !products.some((product) => product.id === selected.id),
        ),
      );

      return;
    }

    setSelectedProducts((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));

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

  // =====================================================
  // LOAD WAREHOUSES
  // =====================================================

  const loadWarehouses = async () => {
    try {
      setWarehouseLoading(true);

      const response = await warehousesApi.getAll(1, 100);

      const apiResponse = response?.data;

      const warehouseList = Array.isArray(apiResponse?.data?.data)
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
        error?.response?.data?.message || "Failed to load warehouses",
      );
    } finally {
      setWarehouseLoading(false);
    }
  };

  // =====================================================
  // OPEN ASSIGN MODAL
  // =====================================================

  const handleOpenAssign = async () => {
    if (!selectedProducts.length) {
      toast.error("Please select at least one product");
      return;
    }

    setSelectedWarehouseId("");

    const initialVariants: Record<number, number | null> = {};

    selectedProducts.forEach((product) => {
      initialVariants[product.id] = null;
    });

    setSelectedVariants(initialVariants);

    await loadWarehouses();
  };

  // =====================================================
  // CHANGE VARIANT
  // =====================================================

  const handleVariantChange = (productId: number, variantValue: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]:
        variantValue === "" ? null : Number(variantValue),
    }));
  };

  // =====================================================
  // ASSIGN PRODUCTS
  // =====================================================

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

      const productIds = selectedProducts.map((product) => product.id);

      const variantIds = selectedProducts.map((product) => {
        if (!product.variants || product.variants.length === 0) {
          return null;
        }

        return selectedVariants[product.id] ?? null;
      });

      const payload = {
        warehouse_id: Number(selectedWarehouseId),
        product_id: productIds,
        variant_id: variantIds,
        quantity: 0,
      };

      console.log("Warehouse Stock Payload:", payload);

      const response = await productApi.assignProductsToWarehouse(payload);

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

  // =====================================================
  // PAGINATION
  // =====================================================

  const paginationText = useMemo(() => {
    if (!totalProducts) {
      return "0 products";
    }

    const start = (currentPage - 1) * PER_PAGE + 1;

    const end = Math.min(currentPage * PER_PAGE, totalProducts);

    return `${start}-${end} of ${totalProducts} products`;
  }, [currentPage, totalProducts]);

  // ===================================================
  // ✅ LOADING STATE (only once, at top level)
  // ===================================================

  if (permissionsLoading) {
    return <PermissionLoadingState />;
  }

  // ===================================================
  // ✅ ACCESS DENIED
  // ===================================================

  if (!canViewProducts) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] p-4 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#E3E9F5] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
            <AlertCircle size={26} />
          </div>
          <h2 className="text-lg font-bold text-[#0F1B3D]">Access Denied</h2>
          <p className="mt-2 text-sm text-[#6B7896]">
            Aapke paas Product Assignment module ka access nahi hai.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-[#F5F8FF] p-4 font-poppins md:p-6">
      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF1FF]">
              <Package size={22} className="text-[#1E3A8A]" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#0F1B3D] md:text-2xl">
                All Products
              </h1>

              <p className="mt-0.5 text-sm text-[#4A5778]">
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
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D8E2F0] bg-white px-4 text-sm font-semibold text-[#4A5778] transition hover:bg-[#F5F8FF]"
              >
                <X size={16} />
                Cancel
              </button>

              <button
                type="button"
                onClick={toggleSelectAllCurrentPage}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D8E2F0] bg-white px-4 text-sm font-semibold text-[#1E3A8A] transition hover:bg-[#EAF1FF]"
              >
                <Check size={16} />

                {allCurrentSelected ? "Unselect All" : "Select All"}
              </button>

              {/* ✅ ASSIGN — permission based */}
              {canAssignProducts && (
                <button
                  type="button"
                  onClick={handleOpenAssign}
                  disabled={
                    selectedProducts.length === 0 || warehouseLoading
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(30,58,138,0.15)] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <WarehouseIcon size={17} />

                  {warehouseLoading
                    ? "Loading..."
                    : `Assign to Warehouse${
                        selectedProducts.length
                          ? ` (${selectedProducts.length})`
                          : ""
                      }`}
                </button>
              )}
            </>
          ) : (
            canAssignProducts && (
              <button
                type="button"
                onClick={() => setSelectionMode(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(30,58,138,0.15)] transition hover:-translate-y-[1px]"
              >
                <WarehouseIcon size={17} />
                Assign Products to Warehouse
              </button>
            )
          )}

          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#4A5778] transition hover:bg-[#F5F8FF] disabled:opacity-50"
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

      <div className="mb-5 rounded-2xl border border-[#E3E9F5] bg-white p-4 shadow-[0_8px_30px_rgba(30,58,138,0.04)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97B2]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name or product code..."
              className="h-11 w-full rounded-lg border border-[#D8E2F0] bg-[#F5F8FF] pl-10 pr-4 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:ring-4 focus:ring-[#1E3A8A]/10"
            />
          </div>

          <div className="relative">
            <SlidersHorizontal
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97B2]"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 min-w-[150px] appearance-none rounded-lg border border-[#D8E2F0] bg-[#F5F8FF] pl-9 pr-8 text-sm font-medium text-[#0F1B3D] outline-none focus:border-[#1E3A8A] focus:ring-4 focus:ring-[#1E3A8A]/10"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="h-11 min-w-[150px] rounded-lg border border-[#D8E2F0] bg-[#F5F8FF] px-3 text-sm font-medium text-[#0F1B3D] outline-none focus:border-[#1E3A8A] focus:ring-4 focus:ring-[#1E3A8A]/10"
          >
            <option value="all">All Stock</option>
            <option value="active">In Stock</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* SELECTED INFO */}

      {selectionMode && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-[#D8E2F0] bg-[#EAF1FF] px-4 py-3">
          <div className="flex items-center gap-2">
            <Check size={17} className="text-[#1E3A8A]" />

            <span className="text-sm font-semibold text-[#1E3A8A]">
              {selectedProducts.length} product
              {selectedProducts.length === 1 ? "" : "s"} selected
            </span>
          </div>

          {selectedProducts.length > 0 && (
            <span className="text-xs text-[#4A5778]">
              Select warehouse to assign these products
            </span>
          )}
        </div>
      )}

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-[0_8px_30px_rgba(30,58,138,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full">
            <thead>
              <tr className="border-b border-[#E3E9F5] bg-[#F5F8FF]">
                {selectionMode && (
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allCurrentSelected}
                      onChange={toggleSelectAllCurrentPage}
                      disabled={!products.length}
                      className="h-4 w-4 cursor-pointer accent-[#1E3A8A]"
                    />
                  </th>
                )}

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
                  Product
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
                  Code
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
                  Category
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
                  Retail Price
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
                  Distributor Price
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
                  Stock
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
                  Product Status
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#4A5778]">
                  Stock Status
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 7 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#E3E9F5]">
                    {selectionMode && (
                      <td className="px-4 py-4">
                        <div className="h-4 w-4 animate-pulse rounded bg-[#EAF1FF]" />
                      </td>
                    )}

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 animate-pulse rounded-lg bg-[#EAF1FF]" />

                        <div className="space-y-2">
                          <div className="h-3 w-40 animate-pulse rounded bg-[#EAF1FF]" />
                          <div className="h-3 w-24 animate-pulse rounded bg-[#F5F8FF]" />
                        </div>
                      </div>
                    </td>

                    {Array.from({ length: 7 }).map((__, i) => (
                      <td key={i} className="px-4 py-4">
                        <div className="h-3 w-20 animate-pulse rounded bg-[#F5F8FF]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={selectionMode ? 10 : 9}
                    className="px-6 py-16"
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1FF]">
                        <Package size={25} className="text-[#2563EB]" />
                      </div>

                      <h3 className="text-sm font-bold text-[#0F1B3D]">
                        No products found
                      </h3>

                      <p className="mt-1 text-xs text-[#8C97B2]">
                        Try changing your search or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const selected = isSelected(product.id);

                  const image = getProductImage(product);

                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-[#E3E9F5] transition last:border-b-0 ${
                        selected
                          ? "bg-[#EAF1FF]/60"
                          : "hover:bg-[#F5F8FF]"
                      }`}
                    >
                      {selectionMode && (
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleProduct(product)}
                            className="h-4 w-4 cursor-pointer accent-[#1E3A8A]"
                          />
                        </td>
                      )}

                      <td className="px-4 py-4">
                        <div className="flex min-w-[250px] items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E3E9F5] bg-[#F5F8FF]">
                            {image ? (
                              <img
                                src={image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon
                                size={18}
                                className="text-[#8C97B2]"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-semibold text-[#0F1B3D]"
                              title={product.name}
                            >
                              {product.name}
                            </p>

                            {product.is_trending && (
                              <span className="mt-1 inline-flex rounded-full bg-[#EAF1FF] px-2 py-0.5 text-[10px] font-semibold text-[#1E3A8A]">
                                Trending
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-md bg-[#F5F8FF] px-2.5 py-1 font-mono text-xs font-semibold text-[#4A5778]">
                          {product.product_code || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-sm text-[#4A5778]">
                          {product.category?.title ||
                            product.category?.name ||
                            "-"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-bold text-[#0F1B3D]">
                            {formatCurrency(product.retail_price)}
                          </p>

                          {Number(product.retail_mrp) >
                            Number(product.retail_price) && (
                            <p className="text-xs text-[#8C97B2] line-through">
                              {formatCurrency(product.retail_mrp)}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-bold text-[#1E3A8A]">
                            {formatCurrency(product.distributor_price)}
                          </p>

                          {Number(product.distributor_mrp) >
                            Number(product.distributor_price) && (
                            <p className="text-xs text-[#8C97B2] line-through">
                              {formatCurrency(product.distributor_mrp)}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Boxes size={16} className="text-[#2563EB]" />

                          <div>
                            <p className="text-sm font-bold text-[#0F1B3D]">
                              {product.stock_quantity ?? 0}
                            </p>

                            <p className="text-[10px] text-[#8C97B2]">
                              Min: {product.low_stock_threshold ?? 0}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge
                          status={
                            (product.status ??
                              (product.is_published
                                ? "active"
                                : "inactive")) as Product["status"]
                          }
                        />
                      </td>

                      <td className="px-4 py-4">
                        <StockBadge status={product.stock_status} />
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
          <div className="flex flex-col gap-3 border-t border-[#E3E9F5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-[#4A5778]">
              {paginationText}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#4A5778] transition hover:bg-[#F5F8FF] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-3 text-xs font-bold text-white">
                {currentPage}
              </div>

              <button
                type="button"
                disabled={currentPage >= lastPage}
                onClick={() =>
                  setCurrentPage((page) => Math.min(lastPage, page + 1))
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#4A5778] transition hover:bg-[#F5F8FF] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ✅ ASSIGN WAREHOUSE MODAL — permission based */}

      {canAssignProducts && assignModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F1B3D]/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-[0_25px_80px_rgba(30,58,138,0.25)] font-poppins">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#E3E9F5] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FF]">
                  <WarehouseIcon size={19} className="text-[#1E3A8A]" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-[#0F1B3D]">
                    Assign Products to Warehouse
                  </h2>

                  <p className="mt-0.5 text-xs text-[#8C97B2]">
                    {selectedProducts.length} selected product
                    {selectedProducts.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                disabled={assignLoading}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#4A5778] transition hover:bg-[#F5F8FF]"
              >
                <X size={18} />
              </button>
            </div>

            {/* BODY */}

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {/* WAREHOUSE */}

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-[#0F1B3D]">
                  Select Warehouse
                  <span className="ml-1 text-[#C23B32]">*</span>
                </label>

                <select
                  value={selectedWarehouseId}
                  onChange={(e) =>
                    setSelectedWarehouseId(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  disabled={assignLoading}
                  className="h-11 w-full rounded-lg border border-[#D8E2F0] bg-[#F5F8FF] px-3 text-sm text-[#0F1B3D] outline-none transition focus:border-[#1E3A8A] focus:ring-4 focus:ring-[#1E3A8A]/10"
                >
                  <option value="">Select warehouse</option>

                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                      {warehouse.code ? ` (${warehouse.code})` : ""}
                    </option>
                  ))}
                </select>

                <p className="mt-1.5 text-xs text-[#8C97B2]">
                  Selected products will be assigned to this warehouse.
                </p>
              </div>

              {/* PRODUCTS */}

              <div className="rounded-xl border border-[#E3E9F5] bg-[#F5F8FF]">
                <div className="border-b border-[#E3E9F5] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0F1B3D]">
                      Selected Products
                    </h3>
                  </div>
                </div>

                <div className="divide-y divide-[#E3E9F5]">
                  {selectedProducts.map((product) => (
                    <div key={product.id} className="bg-white px-4 py-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E3E9F5] bg-[#F5F8FF]">
                            {getProductImage(product) ? (
                              <img
                                src={getProductImage(product)}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package
                                size={17}
                                className="text-[#8C97B2]"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-semibold text-[#0F1B3D]"
                              title={product.name}
                            >
                              {product.name}
                            </p>

                            <p className="mt-0.5 text-xs text-[#8C97B2]">
                              {product.product_code}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#D8E2F0] bg-[#EAF1FF] p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
                    <WarehouseIcon size={17} className="text-[#1E3A8A]" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#1E3A8A]">
                      Ready to Assign
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#4A5778]">
                      {selectedProducts.length} selected product
                      {selectedProducts.length === 1 ? "" : "s"} will be
                      assigned to the selected warehouse. Please verify the
                      warehouse before clicking{" "}
                      <span className="font-semibold text-[#1E3A8A]">
                        Assign Products
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex flex-col-reverse gap-2 border-t border-[#E3E9F5] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                disabled={assignLoading}
                onClick={() => setAssignModalOpen(false)}
                className="h-10 rounded-lg border border-[#D8E2F0] px-5 text-sm font-semibold text-[#4A5778] transition hover:bg-[#F5F8FF] disabled:opacity-50"
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
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(30,58,138,0.15)] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assignLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
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