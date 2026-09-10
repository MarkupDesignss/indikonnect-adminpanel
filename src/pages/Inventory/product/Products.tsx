
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiPlus,
  FiSearch,
} from "react-icons/fi";

import { motion } from "framer-motion";

import { toast } from "react-hot-toast";

import { useLocation } from "react-router-dom";

import GlobalModal from "@/components/common/GlobalModal";

import ProductTable from "./components/ProductTable";

import AddProductModal from "./components/AddProductModal";

import ViewProductModal from "./components/ViewProductModal";

import { productApi } from "../../../api/endpoints/product";

import trendingProductsApi from "../../../api/endpoints/today";

import {
  Product,
  SelectOption,
} from "@/types/product";

// =====================================================
// THEME
// =====================================================

const GREEN = "#163F20";
const DARK_GREEN = "#0F3219";
const LIGHT_GREEN = "#EAF3EA";
const PAGE_BG = "#F5F7F5";
const TEXT_PRIMARY = "#202721";
const TEXT_SECONDARY = "#59645C";
const MUTED = "#9AA29C";
const BORDER = "#D8E2D8";
const RED = "#C23B32";

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
      type: "spring",
      stiffness: 110,
      damping: 16,
    },
  },
};

// =====================================================
// PRODUCTS
// =====================================================

const Products: React.FC = () => {
  const location = useLocation();

  // ===================================================
  // STATE
  // ===================================================

  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<SelectOption[]>([]);

  const [taxCategories, setTaxCategories] =
    useState<SelectOption[]>([]);

  const [brands, setBrands] =
    useState<SelectOption[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [addLoading, setAddLoading] =
    useState(false);

  const [editLoading, setEditLoading] =
    useState(false);

  const [fetchingProduct, setFetchingProduct] =
    useState(false);

  const [trendingLoadingId, setTrendingLoadingId] =
    useState<number | null>(null);

  const [publishLoadingId, setPublishLoadingId] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [highlightedProductId, setHighlightedProductId] =
    useState<number | null>(null);

  const ITEMS_PER_PAGE = 10;

  // ===================================================
  // MODALS
  // ===================================================

  const [addModalOpen, setAddModalOpen] =
    useState(false);

  const [editModalOpen, setEditModalOpen] =
    useState(false);

  const [viewModalOpen, setViewModalOpen] =
    useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  // ===================================================
  // GET PRODUCT FROM HEADER NAVIGATION STATE
  // ===================================================

  const productFromHeader =
    location.state?.product as
      | Product
      | undefined;

  // ===================================================
  // FETCH PRODUCTS
  // IMPORTANT:
  // ADMIN SHOWS BOTH PUBLISHED + UNPUBLISHED
  // ===================================================

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response =
        await productApi.getProducts();

      const productData =
        response.data?.data ?? [];

      /**
       * Do NOT filter by is_published here.
       *
       * Admin must see:
       * - Published products
       * - Unpublished products
       *
       * This allows unpublished products
       * to be published again.
       */

      setProducts(productData);
    } catch (error: any) {
      console.error(
        "Fetch products error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to fetch products."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // FETCH PRODUCT DETAILS
  // ===================================================

  const fetchProductDetails =
    async (
      productId: number
    ) => {
      try {
        setFetchingProduct(true);

        const response =
          await productApi.getProductById(
            productId
          );

        return response.data?.data;
      } catch (error: any) {
        console.error(
          "Fetch product details error:",
          error
        );

        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to fetch product details."
        );

        return null;
      } finally {
        setFetchingProduct(false);
      }
    };

  // ===================================================
  // FETCH CATEGORIES
  // ===================================================

  const fetchCategories =
    async () => {
      try {
        const response =
          await productApi.getCategories();

        const data =
          response.data?.data || [];

        setCategories(
          data.map(
            (item: any) => ({
              value: item.id,
              label: item.name,
            })
          )
        );
      } catch (error) {
        console.error(
          "Fetch categories error:",
          error
        );
      }
    };

  // ===================================================
  // FETCH TAX CATEGORIES
  // ===================================================

  const fetchTaxCategories =
    async () => {
      try {
        const response =
          await productApi.getTaxCategories();

        const data =
          response.data?.data || [];

        setTaxCategories(
          data.map(
            (item: any) => ({
              value: item.id,
              label: item.name,
            })
          )
        );
      } catch (error) {
        console.error(
          "Fetch tax categories error:",
          error
        );
      }
    };

  // ===================================================
  // FETCH BRANDS
  // ===================================================

  const fetchBrands =
    async () => {
      try {
        const response =
          await productApi.getBrands();

        const data =
          response.data?.data || [];

        setBrands(
          data.map(
            (item: any) => ({
              value: item.id,
              label: item.name,
            })
          )
        );
      } catch (error) {
        console.error(
          "Fetch brands error:",
          error
        );
      }
    };

  // ===================================================
  // INITIAL FETCH
  // ===================================================

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchTaxCategories();
    fetchBrands();
  }, []);

  // ===================================================
  // HANDLE PRODUCT FROM HEADER
  // ===================================================

  useEffect(() => {
    if (!productFromHeader) {
      return;
    }

    if (productFromHeader.name) {
      setSearch(
        productFromHeader.name
      );
    } else if (
      productFromHeader.id
    ) {
      setSearch(
        String(
          productFromHeader.id
        )
      );
    }

    setHighlightedProductId(
      productFromHeader.id
    );

    window.history.replaceState(
      {},
      document.title
    );
  }, [
    productFromHeader,
  ]);

  // ===================================================
  // SEARCH
  // BOTH PUBLISHED + UNPUBLISHED INCLUDED
  // ===================================================

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return products;
      }

      return products.filter(
        (product: any) => {
          // PRODUCT ID

          if (
            !isNaN(Number(query)) &&
            product.id === Number(query)
          ) {
            return true;
          }

          // NAME

          if (
            product.name
              ?.toLowerCase()
              .includes(query)
          ) {
            return true;
          }

          // PRODUCT CODE

          if (
            product.product_code
              ?.toLowerCase()
              .includes(query)
          ) {
            return true;
          }

          // SLUG

          if (
            product.slug
              ?.toLowerCase()
              .includes(query)
          ) {
            return true;
          }

          // DESCRIPTION

          if (
            product.description
              ?.toLowerCase()
              .includes(query)
          ) {
            return true;
          }

          // SKU

          if (
            product.sku
              ?.toLowerCase()
              .includes(query)
          ) {
            return true;
          }

          // CATEGORY

          if (
            product.category?.name
              ?.toLowerCase()
              .includes(query)
          ) {
            return true;
          }

          // BRAND

          if (
            product.brand?.name
              ?.toLowerCase()
              .includes(query)
          ) {
            return true;
          }

          // PRICE

          if (
            product.price
              ?.toString()
              .includes(query)
          ) {
            return true;
          }

          // EXISTING STATUS

          if (
            product.status
              ?.toLowerCase()
              .includes(query)
          ) {
            return true;
          }

          // =================================================
          // PUBLISHED STATUS SEARCH
          // =================================================

          const isPublished =
            product.is_published ===
              true ||
            product.is_published === 1 ||
            product.is_published ===
              "1" ||
            product.is_published ===
              "true";

          if (
            query === "published" &&
            isPublished
          ) {
            return true;
          }

          if (
            query === "unpublished" &&
            !isPublished
          ) {
            return true;
          }

          if (
            query === "active" &&
            isPublished
          ) {
            return true;
          }

          if (
            query === "inactive" &&
            !isPublished
          ) {
            return true;
          }

          // RAW PUBLISH VALUE

          if (
            String(
              product.is_published
            )
              .toLowerCase()
              .includes(query)
          ) {
            return true;
          }

          return false;
        }
      );
    }, [
      products,
      search,
    ]);

  // ===================================================
  // PUBLISHED / UNPUBLISHED COUNTS
  // ===================================================

  const publishedCount =
    useMemo(() => {
      return products.filter(
        (product: any) => {
          return (
            product.is_published ===
              true ||
            product.is_published ===
              1 ||
            product.is_published ===
              "1" ||
            product.is_published ===
              "true"
          );
        }
      ).length;
    }, [products]);

  const unpublishedCount =
    useMemo(() => {
      return (
        products.length -
        publishedCount
      );
    }, [
      products,
      publishedCount,
    ]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.ceil(
    filteredProducts.length /
      ITEMS_PER_PAGE
  );

  const safeTotalPages = Math.max(
    totalPages,
    1
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
    filteredProducts.length ===
    0
      ? 0
      : startIndex + 1;

  const endEntry = Math.min(
    startIndex +
      ITEMS_PER_PAGE,
    filteredProducts.length
  );

  // ===================================================
  // KEEP CURRENT PAGE VALID
  // ===================================================

  useEffect(() => {
    if (
      currentPage >
      safeTotalPages
    ) {
      setCurrentPage(
        safeTotalPages
      );
    }
  }, [
    currentPage,
    safeTotalPages,
  ]);

  // ===================================================
  // ADD PRODUCT
  // ===================================================

  const handleAddProduct =
    async (
      formData: FormData
    ) => {
      try {
        setAddLoading(true);

        const response =
          await productApi.createProduct(
            formData
          );

        await fetchProducts();

        setAddModalOpen(false);

        setCurrentPage(1);

        toast.success(
          response.data?.message ||
            "Product added successfully."
        );
      } catch (error: any) {
        console.error(
          "Add product error:",
          error
        );

        if (
          error?.response?.data
            ?.errors
        ) {
          const errors =
            error.response.data
              .errors;

          const errorMessages =
            Object.values(errors)
              .flat()
              .join(", ");

          toast.error(
            errorMessages
          );
        } else {
          toast.error(
            error?.response?.data
              ?.message ||
              error?.message ||
              "Unable to add product."
          );
        }
      } finally {
        setAddLoading(false);
      }
    };

  // ===================================================
  // EDIT PRODUCT
  // ===================================================

  const handleEditProduct =
    async (
      formData: FormData
    ) => {
      if (!selectedProduct) {
        return;
      }

      try {
        setEditLoading(true);

        const response =
          await productApi.updateProduct(
            selectedProduct.id,
            formData
          );

        await fetchProducts();

        setEditModalOpen(false);

        setSelectedProduct(null);

        toast.success(
          response.data?.message ||
            "Product updated successfully."
        );
      } catch (error: any) {
        console.error(
          "Update product error:",
          error
        );

        if (
          error?.response?.data
            ?.errors
        ) {
          const errors =
            error.response.data
              .errors;

          const errorMessages =
            Object.values(errors)
              .flat()
              .join(", ");

          toast.error(
            errorMessages
          );
        } else {
          toast.error(
            error?.response?.data
              ?.message ||
              error?.message ||
              "Unable to update product."
          );
        }
      } finally {
        setEditLoading(false);
      }
    };

  // ===================================================
  // TRENDING TOGGLE
  // ===================================================

  const handleTrendingToggle =
    async (
      product: Product,
      checked: boolean
    ) => {
      try {
        setTrendingLoadingId(
          product.id
        );

        const response =
          await trendingProductsApi.updateTrendingStatus(
            product.id,
            {
              is_trending:
                checked ? 1 : 0,
            }
          );

        await fetchProducts();

        toast.success(
          response.data?.message ||
            (checked
              ? "Product added to trending."
              : "Product removed from trending.")
        );
      } catch (error: any) {
        console.error(
          "Trending status update error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Unable to update trending status."
        );
      } finally {
        setTrendingLoadingId(
          null
        );
      }
    };

  // ===================================================
  // PUBLISH / UNPUBLISH
  // ===================================================

  const handlePublishToggle =
    async (
      product: Product,
      isPublished: boolean
    ) => {
      try {
        setPublishLoadingId(
          product.id
        );

        const response =
          await productApi.publishProduct(
            product.id,
            {
              is_published:
                isPublished ? 1 : 0,
            }
          );

        await fetchProducts();

        toast.success(
          response.data?.message ||
            (isPublished
              ? "Product published successfully."
              : "Product unpublished successfully.")
        );
      } catch (error: any) {
        console.error(
          "Publish status update error:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Unable to update product publish status."
        );
      } finally {
        setPublishLoadingId(
          null
        );
      }
    };

  // ===================================================
  // HANDLE EDIT
  // ===================================================

  const handleEdit = async (
    product: Product
  ) => {
    try {
      const fullProduct =
        await fetchProductDetails(
          product.id
        );

      if (fullProduct) {
        setSelectedProduct(
          fullProduct
        );

        setEditModalOpen(true);
      } else {
        setSelectedProduct(
          product
        );

        setEditModalOpen(true);
      }
    } catch (error) {
      console.error(
        "Error fetching product details:",
        error
      );

      setSelectedProduct(
        product
      );

      setEditModalOpen(true);
    }
  };

  // ===================================================
  // HANDLE VIEW
  // ===================================================

  const handleView = (
    product: Product
  ) => {
    setSelectedProduct(
      product
    );

    setViewModalOpen(true);
  };

  // ===================================================
  // HANDLE PAGE CHANGE
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

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {
    await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchTaxCategories(),
      fetchBrands(),
    ]);

    setCurrentPage(1);
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <motion.div
      className="min-h-screen bg-[#F5F7F5] p-4 sm:p-5 lg:p-6"
      variants={
        containerVariants
      }
      initial="hidden"
      animate="visible"
    >
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <motion.div
        variants={itemVariants}
        className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        {/* LEFT */}

        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />

            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#4C8A57]">
              Catalog Management
            </span>
          </div>

          <h1 className="text-[28px] font-bold tracking-tight text-[#202721] sm:text-[32px]">
            Products
          </h1>

          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#59645C]">
            Manage your products, pricing,
            inventory, and product
            information from one place.
          </p>
        </div>

        {/* STATUS SUMMARY */}

        <div className="flex flex-wrap items-center gap-2.5">
          {/* TOTAL */}

          <div className="rounded-xl border border-[#163F20]/10 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9AA29C]">
              Total Products
            </div>

            <div className="mt-0.5 text-lg font-bold text-[#202721]">
              {products.length}
            </div>
          </div>

          {/* PUBLISHED */}

          <div className="rounded-xl border border-[#163F20]/10 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#4C8A57]">
              Published
            </div>

            <div className="mt-0.5 text-lg font-bold text-[#163F20]">
              {publishedCount}
            </div>
          </div>

          {/* UNPUBLISHED */}

          <div className="rounded-xl border border-[#C23B32]/15 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#C23B32]">
              Unpublished
            </div>

            <div className="mt-0.5 text-lg font-bold text-[#C23B32]">
              {unpublishedCount}
            </div>
          </div>
        </div>
      </motion.div>

      {/* =================================================
          SEARCH + ACTIONS
      ================================================= */}

      <motion.div
        variants={itemVariants}
        className="relative mb-5 overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white p-4 shadow-[0_8px_30px_rgba(22,63,32,0.06)] sm:p-5"
      >
        {/* TOP ACCENT */}

        <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

        {/* DECORATIVE CIRCLES */}

        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#163F20]/10" />

        <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full border border-[#163F20]/10" />

        <div className="pointer-events-none absolute right-8 top-8 h-3 w-3 rounded-full bg-[#163F20]/10" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* SEARCH */}

          <div className="relative w-full lg:max-w-[620px]">
            <FiSearch
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#163F20]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(
                  e.target.value
                );

                setCurrentPage(1);

                setHighlightedProductId(
                  null
                );
              }}
              placeholder="Search by ID, name, code, slug, SKU, price, status..."
              className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-4 text-xs text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
            />

            {/* RESULT COUNT */}

            {search && (
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-[#EAF3EA] px-2 py-1 text-[9px] font-bold text-[#163F20]">
                {
                  filteredProducts.length
                }{" "}
                result
                {filteredProducts.length !==
                1
                  ? "s"
                  : ""}
              </div>
            )}
          </div>

          {/* ADD PRODUCT */}

          <motion.button
            type="button"
            onClick={() =>
              setAddModalOpen(
                true
              )
            }
            whileHover={{
              y: -2,
            }}
            whileTap={{
              scale: 0.97,
            }}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.55)] transition hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)]"
          >
            <FiPlus size={15} />

            Add Product
          </motion.button>
        </div>
      </motion.div>

      {/* =================================================
          TABLE
      ================================================= */}

      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-[22px] border border-[#E5EAE5] bg-white shadow-[0_8px_30px_rgba(22,63,32,0.06)]"
      >
        {/* ACCENT */}

        <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

        <div className="pt-[3px]">
          <ProductTable
            /*
             * IMPORTANT:
             * paginatedProducts contains BOTH:
             *
             * is_published = true
             * is_published = false
             *
             * Nothing is removed here.
             */

            products={
              paginatedProducts
            }
            loading={loading}
            currentPage={
              currentPage
            }
            totalPages={
              totalPages
            }
            totalEntries={
              filteredProducts.length
            }
            startEntry={
              startEntry
            }
            endEntry={
              endEntry
            }
            onPageChange={
              handlePageChange
            }
            onEdit={
              handleEdit
            }
            onView={
              handleView
            }
            onTrendingToggle={
              handleTrendingToggle
            }
            trendingLoadingId={
              trendingLoadingId
            }
            highlightedProductId={
              highlightedProductId
            }
            onPublishToggle={
              handlePublishToggle
            }
            publishLoadingId={
              publishLoadingId
            }
          />
        </div>
      </motion.div>

      {/* =================================================
          ADD PRODUCT MODAL
      ================================================= */}

      <GlobalModal
        isOpen={
          addModalOpen
        }
        onClose={() => {
          if (!addLoading) {
            setAddModalOpen(
              false
            );
          }
        }}
        closeOnOverlayClick={
          !addLoading
        }
      >
        <AddProductModal
          open={
            addModalOpen
          }
          loading={
            addLoading
          }
          onClose={() => {
            if (!addLoading) {
              setAddModalOpen(
                false
              );
            }
          }}
          onSubmit={
            handleAddProduct
          }
          isEdit={false}
        />
      </GlobalModal>

      {/* =================================================
          EDIT PRODUCT MODAL
      ================================================= */}

      <GlobalModal
        isOpen={
          editModalOpen
        }
        onClose={() => {
          if (!editLoading) {
            setEditModalOpen(
              false
            );

            setSelectedProduct(
              null
            );
          }
        }}
        closeOnOverlayClick={
          !editLoading
        }
      >
        <AddProductModal
          open={
            editModalOpen
          }
          loading={
            editLoading
          }
          onClose={() => {
            if (!editLoading) {
              setEditModalOpen(
                false
              );

              setSelectedProduct(
                null
              );
            }
          }}
          onSubmit={
            handleEditProduct
          }
          editData={
            selectedProduct
          }
          isEdit={true}
        />
      </GlobalModal>

      {/* =================================================
          VIEW PRODUCT MODAL
      ================================================= */}

      <GlobalModal
        isOpen={
          viewModalOpen
        }
        onClose={() => {
          if (!fetchingProduct) {
            setViewModalOpen(
              false
            );

            setSelectedProduct(
              null
            );
          }
        }}
        closeOnOverlayClick={
          !fetchingProduct
        }
      >
        <ViewProductModal
          open={
            viewModalOpen
          }
          product={
            selectedProduct
          }
          categories={
            categories
          }
          taxCategories={
            taxCategories
          }
          brands={
            brands
          }
          onClose={() => {
            if (!fetchingProduct) {
              setViewModalOpen(
                false
              );

              setSelectedProduct(
                null
              );
            }
          }}
        />
      </GlobalModal>
    </motion.div>
  );
};

export default Products;

