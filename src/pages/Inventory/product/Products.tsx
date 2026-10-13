import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiPlus,
  FiSearch,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";

import GlobalModal from "@/components/common/GlobalModal";

import ProductTable from "./components/ProductTable";
import AddProductModal from "./components/AddProductModal";
import ViewProductModal from "./components/ViewProductModal";

import {
  productApi,
  type Product,
  type ProductListParams,
  type Pagination,
  type SelectOption,
  type UploadProgressMeta,
} from "../../../api/endpoints/product";

import trendingProductsApi from "../../../api/endpoints/today";

import { usePermissions } from "../../permissions/usePermissions";

// =====================================================
// CONSTANTS
// =====================================================

const ITEMS_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 350;

// =====================================================
// ANIMATIONS
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
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
// HELPER FUNCTIONS
// =====================================================

const isPublishedProduct = (product: Product | any): boolean => {
  const value = product?.is_published;

  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value).toLowerCase() === "true"
  );
};

const toNumber = (value: unknown, fallback: number): number => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

type NormalizedProductResponse = {
  products: Product[];
  pagination: Pagination;
};

/**
 * Supports common API response shapes:
 *
 * 1. { data: [...], pagination: {...} }
 * 2. { data: { data: [...], pagination: {...} } }
 * 3. { data: [...], current_page, last_page, total, per_page }
 * 4. { data: { data: [...], current_page, last_page, total, per_page } }
 */
const normalizeProductResponse = (
  responseData: unknown,
  requestedPage: number,
  requestedPerPage: number,
): NormalizedProductResponse => {
  const body = (responseData ?? {}) as Record<string, any>;

  const rootData = body.data;

  let rows: any[] = [];

  if (Array.isArray(rootData)) {
    rows = rootData;
  } else if (Array.isArray(rootData?.data)) {
    rows = rootData.data;
  } else if (Array.isArray(body.products)) {
    rows = body.products;
  } else if (Array.isArray(body.result?.data)) {
    rows = body.result.data;
  } else if (Array.isArray(body.payload?.data)) {
    rows = body.payload.data;
  }

  const nestedContainer =
    rootData &&
    !Array.isArray(rootData) &&
    typeof rootData === "object"
      ? rootData
      : undefined;

  const hasPaginationShape = (value: any): boolean => {
    if (!value || typeof value !== "object") {
      return false;
    }

    return (
      value.total !== undefined ||
      value.current_page !== undefined ||
      value.last_page !== undefined ||
      value.per_page !== undefined
    );
  };

  const paginationSource =
    body.pagination ??
    body.meta?.pagination ??
    body.meta ??
    nestedContainer?.pagination ??
    nestedContainer?.meta?.pagination ??
    nestedContainer?.meta ??
    (hasPaginationShape(nestedContainer)
      ? nestedContainer
      : undefined) ??
    (hasPaginationShape(body) ? body : undefined) ??
    {};

  const total = Math.max(
    0,
    toNumber(
      paginationSource.total ??
        paginationSource.total_entries ??
        paginationSource.totalRecords,
      rows.length,
    ),
  );

  const perPage = Math.max(
    1,
    toNumber(
      paginationSource.per_page ??
        paginationSource.perPage ??
        paginationSource.limit,
      requestedPerPage,
    ),
  );

  const currentPage = Math.max(
    1,
    toNumber(
      paginationSource.current_page ??
        paginationSource.currentPage ??
        paginationSource.page,
      requestedPage,
    ),
  );

  const lastPage = Math.max(
    1,
    toNumber(
      paginationSource.last_page ?? paginationSource.lastPage,
      Math.ceil(total / perPage) || 1,
    ),
  );

  const defaultFrom =
    total > 0 && rows.length > 0
      ? (currentPage - 1) * perPage + 1
      : 0;

  const from =
    rows.length > 0
      ? toNumber(paginationSource.from, defaultFrom)
      : 0;

  const defaultTo =
    rows.length > 0
      ? Math.min(
          (currentPage - 1) * perPage + rows.length,
          total || (currentPage - 1) * perPage + rows.length,
        )
      : 0;

  const to =
    rows.length > 0
      ? toNumber(paginationSource.to, defaultTo)
      : 0;

  return {
    products: rows as Product[],
    pagination: {
      total,
      per_page: perPage,
      current_page: currentPage,
      last_page: lastPage,
      from,
      to,
    },
  };
};

// =====================================================
// PERMISSION LOADING STATE
// =====================================================

const PermissionLoadingState: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
      <div className="w-full max-w-md rounded-2xl border border-[#D6E2F0] bg-white p-8 text-center shadow-sm">
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
// BODY SCROLL LOCK RESET HELPER
// =====================================================

const resetBodyScrollLock = () => {
  if (typeof document === "undefined") return;

  document.body.style.overflow = "";
  document.body.style.overflowY = "";
  document.body.style.paddingRight = "";

  document.documentElement.style.overflow = "";
};

// =====================================================
// DEFAULT PAGINATION
// =====================================================

const createDefaultPagination = (): Pagination => ({
  total: 0,
  per_page: ITEMS_PER_PAGE,
  current_page: 1,
  last_page: 1,
  from: 0,
  to: 0,
});

// =====================================================
// PRODUCTS
// =====================================================

const Products: React.FC = () => {
  const location = useLocation();

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
      hasModuleAccess("product") ||
      hasPermission("product.view"),
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  const canCreateProduct = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("product") ||
      hasPermission("product.create") ||
      hasPermission("products.create") ||
      hasPermission("product.add") ||
      hasPermission("products.add") ||
      hasPermission("product.store"),
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  const canUpdateProduct = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("product.update") ||
      hasPermission("product.edit"),
    [isSuperAdmin, hasPermission],
  );

  const canDeleteProduct = useMemo(
    () => isSuperAdmin || hasPermission("product.delete"),
    [isSuperAdmin, hasPermission],
  );

  const canPublishProduct = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("product.publish") ||
      hasPermission("product.update"),
    [isSuperAdmin, hasPermission],
  );

  const canToggleTrending = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("product.trending") ||
      hasPermission("product.update"),
    [isSuperAdmin, hasPermission],
  );

  const canToggleDeal = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("product.deal") ||
      hasPermission("product.deal_of_the_day") ||
      hasPermission("product.update"),
    [isSuperAdmin, hasPermission],
  );

  const canSetPrimaryImage = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("product.update") ||
      hasPermission("product.edit") ||
      hasPermission("product.set_primary_image"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // STATE
  // ===================================================

  const [products, setProducts] = useState<Product[]>([]);

  const [categories] = useState<SelectOption[]>([]);
  const [taxCategories] = useState<SelectOption[]>([]);
  const [brands] = useState<SelectOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);

  const [trendingLoadingId, setTrendingLoadingId] =
    useState<number | null>(null);

  const [dealLoadingId, setDealLoadingId] =
    useState<number | null>(null);

  const [publishLoadingId, setPublishLoadingId] =
    useState<number | null>(null);

  const [setPrimaryLoadingId, setSetPrimaryLoadingId] =
    useState<number | null>(null);

  const [uploadProgress, setUploadProgress] =
    useState<UploadProgressMeta | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>(
    createDefaultPagination,
  );

  const [highlightedProductId, setHighlightedProductId] =
    useState<number | null>(null);

  // Old requests cannot replace data from the latest request.
  const latestRequestId = useRef(0);

  // ===================================================
  // MODALS
  // ===================================================

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const productFromHeader = location.state?.product as
    | Product
    | undefined;

  // ===================================================
  // BODY SCROLL LOCK FIX
  // ===================================================

  useEffect(() => {
    const anyModalOpen =
      addModalOpen || editModalOpen || viewModalOpen;

    if (!anyModalOpen) {
      const timer = window.setTimeout(() => {
        resetBodyScrollLock();
      }, 50);

      return () => window.clearTimeout(timer);
    }
  }, [addModalOpen, editModalOpen, viewModalOpen]);

  useEffect(() => {
    return () => {
      resetBodyScrollLock();
      latestRequestId.current += 1;
    };
  }, []);

  // ===================================================
  // DEBOUNCED SEARCH
  // ===================================================

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [search]);

  // ===================================================
  // FETCH PRODUCTS - SERVER-SIDE PAGINATION
  // ===================================================

  const fetchProducts = useCallback(
    async (
      page: number = currentPage,
      query: string = debouncedSearch,
    ) => {
      const requestId = ++latestRequestId.current;

      try {
        setLoading(true);

        const params: ProductListParams = {
          page,
          per_page: ITEMS_PER_PAGE,
        };

        if (query.trim()) {
          params.search = query.trim();
        }

        const response = await productApi.getProducts(params);

        // Ignore stale responses.
        if (requestId !== latestRequestId.current) {
          return;
        }

        const normalized = normalizeProductResponse(
          response?.data,
          page,
          ITEMS_PER_PAGE,
        );

        setProducts(normalized.products);
        setPagination(normalized.pagination);
      } catch (error: any) {
        if (requestId !== latestRequestId.current) {
          return;
        }

        console.error("Fetch products error:", error);

        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to fetch products.",
        );
      } finally {
        if (requestId === latestRequestId.current) {
          setLoading(false);
        }
      }
    },
    [currentPage, debouncedSearch],
  );

  // ===================================================
  // INITIAL FETCH + PAGE/SEARCH CHANGE
  // ===================================================

  useEffect(() => {
    if (!permissionsLoading && canViewProducts) {
      void fetchProducts(currentPage, debouncedSearch);
    }
  }, [
    permissionsLoading,
    canViewProducts,
    currentPage,
    debouncedSearch,
    fetchProducts,
  ]);

  // ===================================================
  // FETCH PRODUCT DETAILS
  // ===================================================

  const fetchProductDetails = async (
    productId: number,
  ): Promise<Product | null> => {
    try {
      setFetchingProduct(true);

      const response = await productApi.getProductById(productId);

      const responseBody = response?.data as any;

      const rawProduct =
        responseBody?.data?.data ??
        responseBody?.data ??
        responseBody?.product ??
        responseBody;

      if (!rawProduct || typeof rawProduct !== "object") {
        return null;
      }

      let normalizedSubcategoryId: number | null = null;

      const possibleSubcategoryId =
        rawProduct?.subcategory_id ??
        rawProduct?.sub_category_id ??
        rawProduct?.subcategory?.id ??
        rawProduct?.sub_category?.id;

      if (
        possibleSubcategoryId !== undefined &&
        possibleSubcategoryId !== null &&
        possibleSubcategoryId !== ""
      ) {
        const parsedId = Number(possibleSubcategoryId);

        if (!Number.isNaN(parsedId)) {
          normalizedSubcategoryId = parsedId;
        }
      }

      const normalizedImages = Array.isArray(rawProduct.images)
        ? rawProduct.images.map((image: any) => ({
            ...image,
            is_primary:
              image?.is_primary ??
              image?.isPrimary ??
              (image?.id === rawProduct?.primary_image_id ? 1 : undefined),
          }))
        : [];

      return {
        ...rawProduct,
        subcategory_id: normalizedSubcategoryId,
        images: normalizedImages,
      } as Product;
    } catch (error: any) {
      console.error("Fetch product details error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to fetch product details.",
      );

      return null;
    } finally {
      setFetchingProduct(false);
    }
  };

  // ===================================================
  // HEADER PRODUCT
  // ===================================================

  useEffect(() => {
    if (!productFromHeader) {
      return;
    }

    if (productFromHeader.name) {
      setSearch(productFromHeader.name);
    } else if (productFromHeader.id) {
      setSearch(String(productFromHeader.id));
    }

    setCurrentPage(1);
    setHighlightedProductId(productFromHeader.id);

    window.history.replaceState({}, document.title);
  }, [productFromHeader]);

  // ===================================================
  // API RESULTS
  // ===================================================

  // The API already returns only the current page.
  // Do not slice this list again on the client.
  const filteredProducts = products;

  const totalProducts = pagination.total;

  // These two counts describe the currently displayed page.
  const publishedCount = useMemo(
    () => products.filter(isPublishedProduct).length,
    [products],
  );

  const unpublishedCount = products.length - publishedCount;

  // ===================================================
  // PAGINATION METADATA
  // ===================================================

  const totalPages = Math.max(
    1,
    pagination.last_page ||
      Math.ceil(pagination.total / ITEMS_PER_PAGE) ||
      1,
  );

  const safeTotalPages = totalPages;

  const startEntry =
    filteredProducts.length === 0
      ? 0
      : pagination.from ||
        (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const endEntry =
    filteredProducts.length === 0
      ? 0
      : pagination.to ||
        Math.min(
          (currentPage - 1) * ITEMS_PER_PAGE + filteredProducts.length,
          pagination.total || filteredProducts.length,
        );

  // ===================================================
  // KEEP PAGE VALID
  // ===================================================

  useEffect(() => {
    if (currentPage > safeTotalPages) {
      setCurrentPage(safeTotalPages);
    }
  }, [currentPage, safeTotalPages]);

  // ===================================================
  // ADD PRODUCT
  // ===================================================

  const handleAddProduct = async (formData: FormData) => {
    try {
      setAddLoading(true);
      setUploadProgress(null);

      const response = await productApi.createProduct(
        formData,
        (meta) => setUploadProgress(meta),
      );

      setAddModalOpen(false);
      resetBodyScrollLock();

      // Refresh page 1 after creating a product.
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        await fetchProducts(1, debouncedSearch);
      }

      toast.success(
        response.data?.message || "Product added successfully.",
      );
    } catch (error: any) {
      console.error("Add product error:", error);

      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;

        const errorMessages = Object.values(errors)
          .flat()
          .join(", ");

        toast.error(errorMessages);
      } else {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to add product.",
        );
      }
    } finally {
      setAddLoading(false);
      setUploadProgress(null);
    }
  };

  // ===================================================
  // EDIT PRODUCT
  // ===================================================

  const handleEditProduct = async (formData: FormData) => {
    if (!selectedProduct) {
      return;
    }

    try {
      setEditLoading(true);
      setUploadProgress(null);

      const response = await productApi.updateProduct(
        selectedProduct.id,
        formData,
        (meta) => setUploadProgress(meta),
      );

      setEditModalOpen(false);
      setSelectedProduct(null);
      resetBodyScrollLock();

      await fetchProducts(currentPage, debouncedSearch);

      toast.success(
        response.data?.message || "Product updated successfully.",
      );
    } catch (error: any) {
      console.error("Update product error:", error);

      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;

        const errorMessages = Object.values(errors)
          .flat()
          .join(", ");

        toast.error(errorMessages);
      } else {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to update product.",
        );
      }
    } finally {
      setEditLoading(false);
      setUploadProgress(null);
    }
  };

  // ===================================================
  // TRENDING TOGGLE
  // ===================================================

  const handleTrendingToggle = async (
    product: Product,
    checked: boolean,
  ) => {
    try {
      setTrendingLoadingId(product.id);

      const response =
        await trendingProductsApi.updateTrendingStatus(product.id, {
          is_trending: checked ? 1 : 0,
        });

      await fetchProducts(currentPage, debouncedSearch);

      toast.success(
        response.data?.message ||
          (checked
            ? "Product added to trending."
            : "Product removed from trending."),
      );
    } catch (error: any) {
      console.error("Trending status update error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update trending status.",
      );
    } finally {
      setTrendingLoadingId(null);
    }
  };

  // ===================================================
  // DEAL OF THE DAY TOGGLE
  // ===================================================

  const handleDealToggle = async (
    product: Product,
    checked: boolean,
  ) => {
    try {
      setDealLoadingId(product.id);

      let response;

      if (checked) {
        response = await productApi.addDeal(product.id, {
          starts_at: new Date().toISOString(),
          ends_at: new Date(
            Date.now() + 24 * 60 * 60 * 1000,
          ).toISOString(),
          sale_type: "today_best",
        });
      } else {
        response = await productApi.removeDeal(product.id);
      }

      await fetchProducts(currentPage, debouncedSearch);

      toast.success(
        response.data?.message ||
          (checked
            ? "Product added to Deal of the Day."
            : "Product removed from Deal of the Day."),
      );
    } catch (error: any) {
      console.error("Deal of the Day update error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update Deal of the Day status.",
      );
    } finally {
      setDealLoadingId(null);
    }
  };

  // ===================================================
  // PUBLISH / UNPUBLISH
  // ===================================================

  const handlePublishToggle = async (
    product: Product,
    isPublished: boolean,
  ) => {
    try {
      setPublishLoadingId(product.id);

      const response = await productApi.publishProduct(product.id, {
        is_published: isPublished ? 1 : 0,
      });

      await fetchProducts(currentPage, debouncedSearch);

      toast.success(
        response.data?.message ||
          (isPublished
            ? "Product published successfully."
            : "Product unpublished successfully."),
      );
    } catch (error: any) {
      console.error("Publish status update error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update product publish status.",
      );
    } finally {
      setPublishLoadingId(null);
    }
  };

  // ===================================================
  // SET AS PRIMARY IMAGE
  // ===================================================

  const handleSetPrimaryImage = async (
    product: Product,
    imageId: number,
  ) => {
    try {
      setSetPrimaryLoadingId(product.id);

      const response = await productApi.setPrimaryImage(
        product.id,
        imageId,
      );

      await fetchProducts(currentPage, debouncedSearch);

      // Refresh selected product details too when needed.
      if (
        selectedProduct?.id === product.id &&
        (editModalOpen || viewModalOpen)
      ) {
        const refreshedProduct = await fetchProductDetails(product.id);

        if (refreshedProduct) {
          setSelectedProduct(refreshedProduct);
        }
      }

      toast.success(
        response.data?.message || "Primary image set successfully.",
      );
    } catch (error: any) {
      console.error("Set primary image error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to set primary image.",
      );
    } finally {
      setSetPrimaryLoadingId(null);
    }
  };

  // ===================================================
  // HANDLE EDIT
  // ===================================================

  const handleEdit = async (product: Product) => {
    if (!canUpdateProduct) {
      return;
    }

    const fullProduct = await fetchProductDetails(product.id);
    const productToEdit = fullProduct || product;

    setSelectedProduct(productToEdit);
    setEditModalOpen(true);
  };

  // ===================================================
  // HANDLE VIEW
  // ===================================================

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  // ===================================================
  // HANDLE PAGE CHANGE
  // ===================================================

  const handlePageChange = (page: number) => {
    if (page < 1 || page > safeTotalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);

    // fetchProducts is triggered automatically by the page effect.
  };

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (permissionsLoading) {
    return <PermissionLoadingState />;
  }

  // ===================================================
  // ACCESS DENIED
  // ===================================================

  if (!canViewProducts) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
            <FiAlertCircle size={26} />
          </div>

          <h2 className="text-lg font-bold text-[#111827]">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-[#6B7280]">
            You don't have permission to access this section.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <motion.div
      className="min-h-screen bg-white p-4 font-poppins sm:p-5 lg:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* PAGE HEADER */}

      <motion.div
        variants={itemVariants}
        className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />

            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#2D6FE8]">
              Catalog Management
            </span>
          </div>

          <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
            Products
          </h1>

          <p className="mt-0.5 text-sm text-[#111827]">
            Manage your products, pricing, inventory, and product
            information from one place.
          </p>
        </div>

        {/* STATUS SUMMARY */}

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-xl border border-[#DCE6F2] bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
              Total Products
            </div>

            <div className="mt-0.5 text-lg font-bold text-[#111827]">
              {totalProducts}
            </div>
          </div>

          <div className="rounded-xl border border-[#2D6FE8]/15 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#2D6FE8]">
              Published on Page
            </div>

            <div className="mt-0.5 text-lg font-bold text-[#111827]">
              {publishedCount}
            </div>
          </div>

          <div className="rounded-xl border border-[#D6E2F0] bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
              Unpublished on Page
            </div>

            <div className="mt-0.5 text-lg font-bold text-[#111827]">
              {unpublishedCount}
            </div>
          </div>
        </div>
      </motion.div>

      {/* SEARCH + ACTIONS */}

      <motion.div
        variants={itemVariants}
        className="relative mb-5 overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white p-3 sm:p-3"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#2D6FE8]/10" />

        <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full border border-[#2D6FE8]/10" />

        <div className="pointer-events-none absolute right-8 top-8 h-3 w-3 rounded-full bg-[#FACC15]/30" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* SEARCH */}

          <div className="relative w-full lg:max-w-[620px]">
            <FiSearch
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#111827]"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
                setHighlightedProductId(null);
              }}
              placeholder="Search by ID, name, code, slug, SKU, price, status..."
              className="h-11 w-full rounded-xl border border-[#D6E2F0] bg-[#F4F8FD] pl-10 pr-28 text-xs text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/15"
            />

            {search && (
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-[#EAF3FF] px-2 py-1 text-[9px] font-bold text-[#2D6FE8]">
                {loading ? "Searching..." : `${pagination.total} result${pagination.total !== 1 ? "s" : ""}`}
              </div>
            )}
          </div>

          {/* ADD PRODUCT BUTTON */}

          {canCreateProduct && (
            <motion.button
              type="button"
              onClick={() => setAddModalOpen(true)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 text-xs font-bold text-white transition hover:shadow-[0_12px_22px_-8px_rgba(45,111,232,0.7)]"
            >
              <FiPlus size={15} />
              Add Product
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* PRODUCT TABLE */}

      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white"
      >
        <ProductTable
          products={filteredProducts}
          loading={loading}
          currentPage={currentPage}
          totalPages={safeTotalPages}
          totalEntries={pagination.total}
          startEntry={startEntry}
          endEntry={endEntry}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onView={handleView}
          onTrendingToggle={handleTrendingToggle}
          trendingLoadingId={trendingLoadingId}
          onDealToggle={handleDealToggle}
          dealLoadingId={dealLoadingId}
          highlightedProductId={highlightedProductId}
          onPublishToggle={handlePublishToggle}
          publishLoadingId={publishLoadingId}
          onSetPrimaryImage={handleSetPrimaryImage}
          setPrimaryLoadingId={setPrimaryLoadingId}
          canView={canViewProducts}
          canEdit={canUpdateProduct}
          canDelete={canDeleteProduct}
          canPublish={canPublishProduct}
          canToggleTrending={canToggleTrending}
          canToggleDeal={canToggleDeal}
          canSetPrimaryImage={canSetPrimaryImage}
        />
      </motion.div>

      {/* ADD PRODUCT MODAL */}

      {canCreateProduct && (
        <GlobalModal
          isOpen={addModalOpen}
          onClose={() => {
            if (!addLoading) {
              setAddModalOpen(false);
              resetBodyScrollLock();
            }
          }}
          closeOnOverlayClick={!addLoading}
        >
          <AddProductModal
            open={addModalOpen}
            loading={addLoading}
            uploadProgress={uploadProgress}
            onClose={() => {
              if (!addLoading) {
                setAddModalOpen(false);
                resetBodyScrollLock();
              }
            }}
            onSubmit={handleAddProduct}
            isEdit={false}
          />
        </GlobalModal>
      )}

      {/* EDIT PRODUCT MODAL */}

      {canUpdateProduct && (
        <GlobalModal
          isOpen={editModalOpen}
          onClose={() => {
            if (!editLoading) {
              setEditModalOpen(false);
              setSelectedProduct(null);
              resetBodyScrollLock();
            }
          }}
          closeOnOverlayClick={!editLoading}
        >
          <AddProductModal
            key={`edit-product-${selectedProduct?.id ?? "new"}`}
            open={editModalOpen}
            loading={editLoading}
            uploadProgress={uploadProgress}
            onClose={() => {
              if (!editLoading) {
                setEditModalOpen(false);
                setSelectedProduct(null);
                resetBodyScrollLock();
              }
            }}
            onSubmit={handleEditProduct}
            editData={selectedProduct}
            isEdit={true}
          />
        </GlobalModal>
      )}

      {/* VIEW PRODUCT MODAL */}

      <GlobalModal
        isOpen={viewModalOpen}
        onClose={() => {
          if (!fetchingProduct) {
            setViewModalOpen(false);
            setSelectedProduct(null);
            resetBodyScrollLock();
          }
        }}
        closeOnOverlayClick={!fetchingProduct}
      >
        <ViewProductModal
          open={viewModalOpen}
          product={selectedProduct}
          categories={categories}
          taxCategories={taxCategories}
          brands={brands}
          onClose={() => {
            if (!fetchingProduct) {
              setViewModalOpen(false);
              setSelectedProduct(null);
              resetBodyScrollLock();
            }
          }}
        />
      </GlobalModal>
    </motion.div>
  );
};

export default Products;