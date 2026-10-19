import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiPlus, FiSearch, FiAlertCircle, FiRefreshCw, FiDownload, FiChevronDown } from "react-icons/fi";
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
import { categoryApi, type Category } from "../../../api/endpoints/category";
import { usePermissions } from "../../permissions/usePermissions";

// ✅ NEW: logo API (same pattern as Orders / ReturnRefund / CreditNotes / Payment)
import logoApi from "../../../api/endpoints/logoApi";

const ITEMS_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 350;

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 110, damping: 16 } },
};

const isPublishedProduct = (product: Product | any): boolean => {
  const value = product?.is_published;
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
};

const toNumber = (value: unknown, fallback: number): number => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type NormalizedProductResponse = { products: Product[]; pagination: Pagination };

const normalizeProductResponse = (
  responseData: unknown,
  requestedPage: number,
  requestedPerPage: number,
): NormalizedProductResponse => {
  const body = (responseData ?? {}) as Record<string, any>;
  const rootData = body.data;
  let rows: any[] = [];

  if (Array.isArray(rootData)) rows = rootData;
  else if (Array.isArray(rootData?.data)) rows = rootData.data;
  else if (Array.isArray(body.products)) rows = body.products;
  else if (Array.isArray(body.result?.data)) rows = body.result.data;
  else if (Array.isArray(body.payload?.data)) rows = body.payload.data;

  const nested = rootData && !Array.isArray(rootData) && typeof rootData === "object" ? rootData : undefined;
  const hasPaginationShape = (value: any) => !!value && typeof value === "object" && (
    value.total !== undefined || value.current_page !== undefined || value.last_page !== undefined || value.per_page !== undefined
  );
  const paginationSource = body.pagination ?? body.meta?.pagination ?? body.meta ?? nested?.pagination ?? nested?.meta?.pagination ?? nested?.meta ?? (hasPaginationShape(nested) ? nested : undefined) ?? (hasPaginationShape(body) ? body : undefined) ?? {};

  const total = Math.max(0, toNumber(paginationSource.total ?? paginationSource.total_entries ?? paginationSource.totalRecords, rows.length));
  const perPage = Math.max(1, toNumber(paginationSource.per_page ?? paginationSource.perPage ?? paginationSource.limit, requestedPerPage));
  const currentPage = Math.max(1, toNumber(paginationSource.current_page ?? paginationSource.currentPage ?? paginationSource.page, requestedPage));
  const lastPage = Math.max(1, toNumber(paginationSource.last_page ?? paginationSource.lastPage, Math.ceil(total / perPage) || 1));
  const defaultFrom = total > 0 && rows.length > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const from = rows.length > 0 ? toNumber(paginationSource.from, defaultFrom) : 0;
  const defaultTo = rows.length > 0 ? Math.min((currentPage - 1) * perPage + rows.length, total || (currentPage - 1) * perPage + rows.length) : 0;
  const to = rows.length > 0 ? toNumber(paginationSource.to, defaultTo) : 0;

  return {
    products: rows as Product[],
    pagination: { total, per_page: perPage, current_page: currentPage, last_page: lastPage, from, to },
  };
};

// =====================================================
// ✅ PERMISSION / PAGE LOADING STATE (PULSING LOGO)
// Same pattern as Orders / ReturnRefund / CreditNotes / Payment
// =====================================================

interface PermissionLoadingStateProps {
  logoUrl: string | null;
}

const PermissionLoadingState: React.FC<PermissionLoadingStateProps> = ({
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
        className="block max-h-[120px] max-w-[240px] object-contain"
        referrerPolicy="no-referrer"
        initial={{ opacity: 0.5, scale: 0.96 }}
        animate={{
          opacity: [0.8, 1, 0.8],
          scale: [0.98, 1, 0.98],
        }}
        transition={{
          duration: 1.6,
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

const resetBodyScrollLock = () => {
  if (typeof document === "undefined") return;
  document.body.style.overflow = "";
  document.body.style.overflowY = "";
  document.body.style.paddingRight = "";
  document.documentElement.style.overflow = "";
};

const createDefaultPagination = (): Pagination => ({ total: 0, per_page: ITEMS_PER_PAGE, current_page: 1, last_page: 1, from: 0, to: 0 });

type BestSellerPayload = { is_best_seller: 0 | 1 };

// CSV Export helper
const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const exportProductsToCsv = (products: Product[], filename: string) => {
  const headers = [
    "S.No",
    "Product Name",
    "SKU",
    "Description",
    "Retail Price",
    "Distributor Price",
    "Stock",
    "Low Stock Threshold",
    "Status",
    "Trending",
    "Best Seller",
    "Deal of the Day",
    "Primary Image",
    "Category",
    "Created At",
  ];

  const getFlagLabel = (value: unknown): string => {
    const v = value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
    return v ? "Yes" : "No";
  };

  const rows = products.map((product, index) => {
    const images = product.images ?? [];
    const primaryImage = images.find((img: any) => {
      const v = img?.is_primary;
      return v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true";
    }) ?? images[0];

    return [
      index + 1,
      product.name || "",
      product.product_code || "",
      product.description || "",
      product.retail_price ?? "",
      (product as any).distributor_price ?? "",
      product.stock_quantity ?? "",
      product.low_stock_threshold ?? "",
      getFlagLabel(product.is_published) ? "Published" : "Unpublished",
      getFlagLabel((product as any).is_trending),
      getFlagLabel((product as any).is_best_seller),
      getFlagLabel((product as any).is_deal_of_the_day),
      primaryImage?.image_url || "",
      (product as any).category?.title || (product as any).category_name || "",
      product.created_at || "",
    ];
  });

  const csvContent = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const Products: React.FC = () => {
  const location = useLocation();
  const { hasPermission, hasModuleAccess, isSuperAdmin, loading: permissionsLoading } = usePermissions();

  const canViewProducts = useMemo(() => isSuperAdmin || hasModuleAccess("product") || hasPermission("product.view"), [isSuperAdmin, hasModuleAccess, hasPermission]);
  const canCreateProduct = useMemo(() => isSuperAdmin || hasModuleAccess("product") || ["product.create", "products.create", "product.add", "products.add", "product.store"].some(hasPermission), [isSuperAdmin, hasModuleAccess, hasPermission]);
  const canUpdateProduct = useMemo(() => isSuperAdmin || hasPermission("product.update") || hasPermission("product.edit"), [isSuperAdmin, hasPermission]);
  const canDeleteProduct = useMemo(() => isSuperAdmin || hasPermission("product.delete"), [isSuperAdmin, hasPermission]);
  const canPublishProduct = useMemo(() => isSuperAdmin || hasPermission("product.publish") || hasPermission("product.update"), [isSuperAdmin, hasPermission]);
  const canToggleTrending = useMemo(() => isSuperAdmin || hasPermission("product.trending") || hasPermission("product.update"), [isSuperAdmin, hasPermission]);
  const canToggleDeal = useMemo(() => isSuperAdmin || hasPermission("product.deal") || hasPermission("product.deal_of_the_day") || hasPermission("product.update"), [isSuperAdmin, hasPermission]);
  const canSetPrimaryImage = useMemo(() => isSuperAdmin || hasPermission("product.update") || hasPermission("product.edit") || hasPermission("product.set_primary_image"), [isSuperAdmin, hasPermission]);
  const canToggleBestSeller = useMemo(() => isSuperAdmin || hasPermission("product.best_seller") || hasPermission("product.best_seller.toggle") || hasPermission("product.update"), [isSuperAdmin, hasPermission]);

  // ✅ NEW: logo state (same pattern as Orders / ReturnRefund / CreditNotes / Payment)
  const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
  const [logoLoading, setLogoLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [taxCategories] = useState<SelectOption[]>([]);
  const [brands] = useState<SelectOption[]>([]);

  // ✅ first load only — subsequent fetches don't block page
  const [initialProductsLoading, setInitialProductsLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [trendingLoadingId, setTrendingLoadingId] = useState<number | null>(null);
  const [dealLoadingId, setDealLoadingId] = useState<number | null>(null);
  const [bestSellerLoadingId, setBestSellerLoadingId] = useState<number | null>(null);
  const [publishLoadingId, setPublishLoadingId] = useState<number | null>(null);
  const [setPrimaryLoadingId, setSetPrimaryLoadingId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressMeta | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>(createDefaultPagination);
  const [highlightedProductId, setHighlightedProductId] = useState<number | null>(null);
  const latestRequestId = useRef(0);
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const productFromHeader = location.state?.product as Product | undefined;

  // ===================================================
  // LOGO FETCH (same as Orders / ReturnRefund / CreditNotes / Payment)
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    const fetchLogo = async () => {
      try {
        const response: any = await logoApi.getLogo();

        const possibleLogos: unknown[] = [
          response?.data?.data?.logo,
          response?.data?.logo,
          response?.data?.data?.data?.logo,
          response?.data?.data?.logo_url,
          response?.data?.logo_url,
          response?.logo,
        ];

        const resolvedLogo = possibleLogos.find(
          (value): value is string =>
            typeof value === "string" && /^https?:\/\//i.test(value.trim()),
        );

        if (!cancelled && resolvedLogo) {
          setLogoUrl(resolvedLogo.trim());
        }
      } catch (error) {
        console.error("Logo API error:", error);
      } finally {
        if (!cancelled) {
          setLogoLoading(false);
        }
      }
    };

    void fetchLogo();

    return () => {
      cancelled = true;
    };
  }, []);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const anyModalOpen = addModalOpen || editModalOpen || viewModalOpen;
    if (!anyModalOpen) {
      const timer = window.setTimeout(resetBodyScrollLock, 50);
      return () => window.clearTimeout(timer);
    }
  }, [addModalOpen, editModalOpen, viewModalOpen]);

  useEffect(() => () => {
    resetBodyScrollLock();
    latestRequestId.current += 1;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Fetch categories for filter dropdown
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoryApi.getAll();
      const body = response?.data as any;
      const rows: Category[] = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body)
          ? body
          : Array.isArray(body?.data?.data)
            ? body.data.data
            : [];
      setCategories(rows);
    } catch (error: any) {
      console.error("Fetch categories error:", error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permissionsLoading && canViewProducts) void fetchCategories();
  }, [permissionsLoading, canViewProducts, fetchCategories]);

  // ===================================================
  // FETCH PRODUCTS
  // isInitialLoad = true ONLY FOR THE FIRST LOAD
  // ===================================================

  const fetchProducts = useCallback(
    async (
      page: number = currentPage,
      query: string = debouncedSearch,
      categoryId: string = selectedCategoryId,
      isInitialLoad = false,
    ) => {
      const requestId = ++latestRequestId.current;
      try {
        setLoading(true);
        const params: ProductListParams & { category_id?: number } = { page, per_page: ITEMS_PER_PAGE };
        if (query.trim()) params.search = query.trim();
        if (categoryId && categoryId !== "all") {
          const parsed = Number(categoryId);
          if (Number.isFinite(parsed)) (params as any).category_id = parsed;
        }
        const response = await productApi.getProducts(params as ProductListParams);
        if (requestId !== latestRequestId.current) return;
        const normalized = normalizeProductResponse(response?.data, page, ITEMS_PER_PAGE);
        setProducts(normalized.products);
        setPagination(normalized.pagination);
      } catch (error: any) {
        if (requestId !== latestRequestId.current) return;
        console.error("Fetch products error:", error);
        toast.error(error?.response?.data?.message || error?.message || "Unable to fetch products.");
      } finally {
        if (requestId === latestRequestId.current) {
          setLoading(false);
          if (isInitialLoad) setInitialProductsLoading(false);
        }
      }
    },
    [currentPage, debouncedSearch, selectedCategoryId],
  );

  useEffect(() => {
    if (!permissionsLoading && canViewProducts) {
      void fetchProducts(currentPage, debouncedSearch, selectedCategoryId, true);
    } else if (!permissionsLoading && !canViewProducts) {
      setLoading(false);
      setInitialProductsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, canViewProducts, currentPage, debouncedSearch, selectedCategoryId]);

  // ===================================================
  // COMBINED INITIAL LOADING
  // ===================================================

  const pageLoading =
    permissionsLoading ||
    logoLoading ||
    initialProductsLoading;

  const fetchProductDetails = async (productId: number): Promise<Product | null> => {
    try {
      setFetchingProduct(true);
      const response = await productApi.getProductById(productId);
      const body = response?.data as any;
      const raw = body?.data?.data ?? body?.data ?? body?.product ?? body;
      if (!raw || typeof raw !== "object") return null;
      const rawSubcategoryId = raw.subcategory_id ?? raw.sub_category_id ?? raw.subcategory?.id ?? raw.sub_category?.id;
      const parsedSubcategoryId = rawSubcategoryId === undefined || rawSubcategoryId === null || rawSubcategoryId === "" ? null : Number(rawSubcategoryId);
      const normalizedImages = Array.isArray(raw.images) ? raw.images.map((image: any) => ({
        ...image,
        is_primary: image?.is_primary ?? image?.isPrimary ?? (image?.id === raw?.primary_image_id ? 1 : undefined),
      })) : [];
      return { ...raw, subcategory_id: parsedSubcategoryId !== null && Number.isFinite(parsedSubcategoryId) ? parsedSubcategoryId : null, images: normalizedImages } as Product;
    } catch (error: any) {
      console.error("Fetch product details error:", error);
      toast.error(error?.response?.data?.message || error?.message || "Unable to fetch product details.");
      return null;
    } finally {
      setFetchingProduct(false);
    }
  };

  useEffect(() => {
    if (!productFromHeader) return;
    if (productFromHeader.name) setSearch(productFromHeader.name);
    else if (productFromHeader.id) setSearch(String(productFromHeader.id));
    setCurrentPage(1);
    setHighlightedProductId(productFromHeader.id);
    window.history.replaceState({}, document.title);
  }, [productFromHeader]);

  const publishedCount = useMemo(() => products.filter(isPublishedProduct).length, [products]);
  const unpublishedCount = products.length - publishedCount;
  const totalPages = Math.max(1, pagination.last_page || Math.ceil(pagination.total / ITEMS_PER_PAGE) || 1);
  const startEntry = products.length === 0 ? 0 : pagination.from || (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endEntry = products.length === 0 ? 0 : pagination.to || Math.min((currentPage - 1) * ITEMS_PER_PAGE + products.length, pagination.total || products.length);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleAddProduct = async (formData: FormData) => {
    try {
      setAddLoading(true);
      setUploadProgress(null);
      const response = await productApi.createProduct(formData, setUploadProgress);
      setAddModalOpen(false);
      resetBodyScrollLock();
      if (currentPage !== 1) setCurrentPage(1);
      else await fetchProducts(1, debouncedSearch, selectedCategoryId);
      toast.success(response.data?.message || "Product added successfully.");
    } catch (error: any) {
      console.error("Add product error:", error);
      const errors = error?.response?.data?.errors;
      toast.error(errors ? Object.values(errors).flat().join(", ") : error?.response?.data?.message || error?.message || "Unable to add product.");
    } finally {
      setAddLoading(false);
      setUploadProgress(null);
    }
  };

  const handleEditProduct = async (formData: FormData) => {
    if (!selectedProduct) return;
    try {
      setEditLoading(true);
      setUploadProgress(null);
      const response = await productApi.updateProduct(selectedProduct.id, formData, setUploadProgress);
      setEditModalOpen(false);
      setSelectedProduct(null);
      resetBodyScrollLock();
      await fetchProducts(currentPage, debouncedSearch, selectedCategoryId);
      toast.success(response.data?.message || "Product updated successfully.");
    } catch (error: any) {
      console.error("Update product error:", error);
      const errors = error?.response?.data?.errors;
      toast.error(errors ? Object.values(errors).flat().join(", ") : error?.response?.data?.message || error?.message || "Unable to update product.");
    } finally {
      setEditLoading(false);
      setUploadProgress(null);
    }
  };

  const handleTrendingToggle = async (product: Product, checked: boolean) => {
    try {
      setTrendingLoadingId(product.id);
      const response = await trendingProductsApi.updateTrendingStatus(product.id, { is_trending: checked ? 1 : 0 });
      await fetchProducts(currentPage, debouncedSearch, selectedCategoryId);
      toast.success(response.data?.message || (checked ? "Product added to trending." : "Product removed from trending."));
    } catch (error: any) {
      console.error("Trending status update error:", error);
      toast.error(error?.response?.data?.message || error?.message || "Unable to update trending status.");
    } finally {
      setTrendingLoadingId(null);
    }
  };

  const handleDealToggle = async (product: Product, checked: boolean) => {
    try {
      setDealLoadingId(product.id);
      const response = checked
        ? await productApi.addDeal(product.id, {
            starts_at: new Date().toISOString(),
            ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            sale_type: "today_best",
          })
        : await productApi.removeDeal(product.id);
      await fetchProducts(currentPage, debouncedSearch, selectedCategoryId);
      toast.success(response.data?.message || (checked ? "Product added to Deal of the Day." : "Product removed from Deal of the Day."));
    } catch (error: any) {
      console.error("Deal of the Day update error:", error);
      toast.error(error?.response?.data?.message || error?.message || "Unable to update Deal of the Day status.");
    } finally {
      setDealLoadingId(null);
    }
  };

  const handleBestSellerToggle = async (product: Product, checked: boolean) => {
    try {
      setBestSellerLoadingId(product.id);
      const response = await productApi.setBestSeller(product.id, { is_best_seller: (checked ? 1 : 0) } satisfies BestSellerPayload);
      await fetchProducts(currentPage, debouncedSearch, selectedCategoryId);
      toast.success(response.data?.message || (checked ? "Product marked as Best Seller." : "Product removed from Best Seller."));
    } catch (error: any) {
      console.error("Best Seller status update error:", error);
      toast.error(error?.response?.data?.message || error?.message || "Unable to update Best Seller status.");
    } finally {
      setBestSellerLoadingId(null);
    }
  };

  const handlePublishToggle = async (product: Product, isPublished: boolean) => {
    try {
      setPublishLoadingId(product.id);
      const response = await productApi.publishProduct(product.id, { is_published: isPublished ? 1 : 0 });
      await fetchProducts(currentPage, debouncedSearch, selectedCategoryId);
      toast.success(response.data?.message || (isPublished ? "Product published successfully." : "Product unpublished successfully."));
    } catch (error: any) {
      console.error("Publish status update error:", error);
      toast.error(error?.response?.data?.message || error?.message || "Unable to update product publish status.");
    } finally {
      setPublishLoadingId(null);
    }
  };

  const handleSetPrimaryImage = async (product: Product, imageId: number) => {
    try {
      setSetPrimaryLoadingId(product.id);
      const response = await productApi.setPrimaryImage(product.id, imageId);
      await fetchProducts(currentPage, debouncedSearch, selectedCategoryId);
      if (selectedProduct?.id === product.id && (editModalOpen || viewModalOpen)) {
        const refreshed = await fetchProductDetails(product.id);
        if (refreshed) setSelectedProduct(refreshed);
      }
      toast.success(response.data?.message || "Primary image set successfully.");
    } catch (error: any) {
      console.error("Set primary image error:", error);
      toast.error(error?.response?.data?.message || error?.message || "Unable to set primary image.");
    } finally {
      setSetPrimaryLoadingId(null);
    }
  };

  const handleEdit = async (product: Product) => {
    if (!canUpdateProduct) return;
    const fullProduct = await fetchProductDetails(product.id);
    setSelectedProduct(fullProduct || product);
    setEditModalOpen(true);
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    setCurrentPage(1);
    setHighlightedProductId(null);
    setCategoryDropdownOpen(false);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedCategoryId("");
    setCurrentPage(1);
    setHighlightedProductId(null);
  };

  const handleDownloadCsv = () => {
    if (products.length === 0) {
      toast.error("No products to export.");
      return;
    }
    const categoryName = selectedCategoryId && selectedCategoryId !== "all"
      ? categories.find((c) => String(c.id) === selectedCategoryId)?.title ?? "category"
      : "all";
    const safeCategory = categoryName.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    const date = new Date().toISOString().slice(0, 10);
    exportProductsToCsv(products, `products_${safeCategory}_${date}.csv`);
    toast.success(`Exported ${products.length} product${products.length === 1 ? "" : "s"} to CSV.`);
  };

  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategoryId || selectedCategoryId === "all") return "All Categories";
    const found = categories.find((c) => String(c.id) === selectedCategoryId);
    return found?.title || "All Categories";
  }, [selectedCategoryId, categories]);

  // ===================================================
  // COMPONENT-LEVEL LOADING (PULSING LOGO)
  // SIDEBAR / NAVBAR UNTOUCHED
  // ===================================================

  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  // ===================================================
  // ACCESS DENIED
  // ===================================================

  if (!canViewProducts) {
    return <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
      <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#C23B32]"><FiAlertCircle size={26} /></div>
        <h2 className="text-lg font-bold text-[#111827]">Access Denied</h2>
        <p className="mt-2 text-sm text-[#6B7280]">You don't have permission to access this section.</p>
      </div>
    </div>;
  }

  return (
    <motion.div className="min-h-screen bg-white p-3 font-poppins sm:p-4 lg:p-5" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-4 flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div>
          <div className="mb-1.5 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" /><span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" /><span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" /><span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#2D6FE8]">Catalog Management</span></div>
          <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">Products</h1>
          <p className="mt-0.5 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">Manage your products, pricing, inventory, and product information from one place.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          <div className="rounded-xl border border-[#DCE6F2] bg-white px-3 py-2 shadow-sm sm:min-w-[110px] sm:px-4"><div className="text-[8px] font-bold uppercase tracking-wider text-slate-500 sm:text-[9px]">Total Products</div><div className="mt-0.5 text-lg font-bold text-slate-900">{pagination.total}</div></div>
          <div className="rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-sm sm:min-w-[110px] sm:px-4"><div className="text-[8px] font-bold uppercase tracking-wider text-blue-600 sm:text-[9px]">Published on Page</div><div className="mt-0.5 text-lg font-bold text-slate-900">{publishedCount}</div></div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:min-w-[110px] sm:px-4"><div className="text-[8px] font-bold uppercase tracking-wider text-slate-500 sm:text-[9px]">Unpublished Page</div><div className="mt-0.5 text-lg font-bold text-slate-900">{unpublishedCount}</div></div>
        </div>
      </motion.div>

      {/* Filter bar — relative z-50 so dropdown overlays everything below */}
      <motion.div
        variants={itemVariants}
        className="relative z-50 mb-4 rounded-2xl border border-[#DCE6F2] bg-white p-3"
      >
        <div className="relative z-50 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Search + Category filter + Clear */}
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-[860px]">
            <div className="relative w-full sm:flex-1">
              <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                  setHighlightedProductId(null);
                }}
                placeholder="Search by name, product code, SKU..."
                className="h-10 w-full rounded-xl border border-[#D6E2F0] bg-[#F7FAFF] pl-10 pr-24 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
              />
              {search && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-500">
                  {loading ? "Searching..." : `${pagination.total} result${pagination.total === 1 ? "" : "s"}`}
                </span>
              )}
            </div>

            {/* Category Dropdown Filter — highest z-index */}
            <div className="relative z-[100] w-full sm:w-[220px] sm:shrink-0" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-[#D6E2F0] bg-[#F7FAFF] px-3 text-xs font-medium text-slate-700 outline-none transition hover:border-[#2D6FE8] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{selectedCategoryLabel}</span>
                  {selectedCategoryId && selectedCategoryId !== "all" && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2D6FE8] px-1 text-[9px] font-bold text-white">
                      1
                    </span>
                  )}
                </span>
                <FiChevronDown
                  size={14}
                  className={`shrink-0 text-slate-500 transition-transform ${categoryDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {categoryDropdownOpen && (
                <div
                  className="absolute right-0 z-[999] mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-[#D6E2F0] bg-white shadow-2xl"
                  style={{ zIndex: 9999 }}
                >
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("")}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition hover:bg-[#F7FAFF] ${
                      !selectedCategoryId || selectedCategoryId === "all"
                        ? "bg-[#EAF3FF] font-semibold text-[#2D6FE8]"
                        : "text-slate-700"
                    }`}
                  >
                    <span>All Categories</span>
                    {(!selectedCategoryId || selectedCategoryId === "all") && <span className="text-[#2D6FE8]">✓</span>}
                  </button>

                  {categoriesLoading ? (
                    <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-slate-500">
                      <FiRefreshCw size={12} className="animate-spin" /> Loading...
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-500">No categories found</div>
                  ) : (
                    categories.map((category) => {
                      const isSelected = String(category.id) === selectedCategoryId;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategoryChange(String(category.id))}
                          className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition hover:bg-[#F7FAFF] ${
                            isSelected ? "bg-[#EAF3FF] font-semibold text-[#2D6FE8]" : "text-slate-700"
                          }`}
                        >
                          <span className="truncate">{category.title}</span>
                          {isSelected && <span className="text-[#2D6FE8]">✓</span>}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {(search || (selectedCategoryId && selectedCategoryId !== "all")) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right: Export CSV + Add Product */}
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={loading || products.length === 0}
              className="flex h-10 flex-1 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/30 bg-[#EAF3FF] px-4 text-xs font-bold text-[#2D6FE8] transition hover:bg-[#2D6FE8] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              <FiDownload size={15} />
              <span>Export CSV</span>
            </button>

            {canCreateProduct && (
              <motion.button
                type="button"
                onClick={() => setAddModalOpen(true)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex h-10 flex-1 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-4 text-xs font-bold text-white transition hover:shadow-md sm:flex-none"
              >
                <FiPlus size={15} /> Add Product
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Table wrapper — relative z-0 so dropdown always overlays it */}
      <motion.div variants={itemVariants} className="relative z-0 overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white">
        <ProductTable
          products={products}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
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
          onBestSellerToggle={handleBestSellerToggle}
          bestSellerLoadingId={bestSellerLoadingId}
          onPublishToggle={handlePublishToggle}
          publishLoadingId={publishLoadingId}
          onSetPrimaryImage={handleSetPrimaryImage}
          setPrimaryLoadingId={setPrimaryLoadingId}
          highlightedProductId={highlightedProductId}
          canView={canViewProducts}
          canEdit={canUpdateProduct}
          canDelete={canDeleteProduct}
          canPublish={canPublishProduct}
          canToggleTrending={canToggleTrending}
          canToggleDeal={canToggleDeal}
          canToggleBestSeller={canToggleBestSeller}
          canSetPrimaryImage={canSetPrimaryImage}
        />
      </motion.div>

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
            isEdit
          />
        </GlobalModal>
      )}

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
          categories={categories as any}
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